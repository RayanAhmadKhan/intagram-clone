const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { canViewUserContent } = require('../utils/visibility');
const { getIO } = require('../config/socket'); // Added socket import

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const serializeComment = (comment, viewerId, extra = {}) => ({
  id: comment._id,
  text: comment.text,
  author: {
    id: comment.author._id,
    username: comment.author.username,
    fullName: comment.author.fullName,
    avatar: comment.author.avatar,
  },
  likesCount: comment.likes ? comment.likes.length : 0,
  isLikedByViewer: comment.likes ? comment.likes.some((id) => id.equals(viewerId)) : false,
  isOwnComment: comment.author._id.equals(viewerId),
  createdAt: comment.createdAt,
  ...extra,
});

const loadCommentWithOwner = async (commentId) => {
  return await Comment.findById(commentId).populate({
    path: 'post',
    select: 'owner',
    populate: { path: 'owner', select: 'isPrivate followers' },
  });
};

// POST /api/posts/:id/comments
const createComment = async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    if (!isValidId(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post id' });
    }

    const post = await Post.findById(postId).populate('owner', 'isPrivate followers');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (!canViewUserContent(req.user._id, post.owner)) {
      return res.status(403).json({ success: false, message: 'This account is private' });
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      text: req.body.text,
    });

    post.comments.push(comment._id);
    await post.save();

    const populated = await comment.populate('author', 'username fullName avatar');
    const commentData = serializeComment(populated, req.user._id, { repliesCount: 0 });

    // REAL-TIME BROADCAST: Emit new comment to listeners
    try {
      getIO().emit(`post:${postId}:comment`, {
        action: 'create',
        comment: commentData,
        commentsCount: post.comments.length,
      });
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Comment added',
      data: { comment: commentData },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/posts/:id/comments
const getPostComments = async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    if (!isValidId(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post id' });
    }

    const post = await Post.findById(postId).populate('owner', 'isPrivate followers');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (!canViewUserContent(req.user._id, post.owner)) {
      return res.status(403).json({ success: false, message: 'This account is private' });
    }

    const comments = await Comment.find({ post: postId, parentComment: null })
      .sort({ createdAt: 1 })
      .populate('author', 'username fullName avatar');

    const withReplyCounts = await Promise.all(
      comments.map(async (c) => {
        const repliesCount = await Comment.countDocuments({ parentComment: c._id });
        return serializeComment(c, req.user._id, { repliesCount });
      })
    );

    return res.status(200).json({ success: true, data: { comments: withReplyCounts } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/comments/:id
const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid comment id' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only edit your own comments' });
    }

    comment.text = req.body.text;
    await comment.save();

    const populated = await comment.populate('author', 'username fullName avatar');
    const updatedData = serializeComment(populated, req.user._id);

    // REAL-TIME BROADCAST: Emit update event
    try {
      getIO().emit(`post:${comment.post}:comment`, {
        action: 'update',
        comment: updatedData,
      });
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Comment updated',
      data: { comment: updatedData },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid comment id' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments' });
    }

    const replies = await Comment.find({ parentComment: comment._id }, '_id');
    const idsToRemove = [comment._id, ...replies.map((r) => r._id)];

    await Comment.deleteMany({ _id: { $in: idsToRemove } });

    const updatedPost = await Post.findByIdAndUpdate(
      comment.post,
      { $pull: { comments: { $in: idsToRemove } } },
      { new: true }
    );

    // REAL-TIME BROADCAST: Emit deletion event
    try {
      getIO().emit(`post:${comment.post}:comment`, {
        action: 'delete',
        commentId: id,
        commentsCount: updatedPost ? updatedPost.comments.length : 0,
      });
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Comment deleted',
      data: { deletedCount: idsToRemove.length },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/comments/:id/replies
const createReply = async (req, res, next) => {
  try {
    const { id: parentId } = req.params;
    if (!isValidId(parentId)) {
      return res.status(400).json({ success: false, message: 'Invalid comment id' });
    }

    const parent = await loadCommentWithOwner(parentId);
    if (!parent) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    if (!canViewUserContent(req.user._id, parent.post.owner)) {
      return res.status(403).json({ success: false, message: 'This account is private' });
    }

    const reply = await Comment.create({
      post: parent.post._id,
      author: req.user._id,
      text: req.body.text,
      parentComment: parent._id,
    });

    await Post.findByIdAndUpdate(parent.post._id, { $addToSet: { comments: reply._id } });

    const populated = await reply.populate('author', 'username fullName avatar');
    const replyData = serializeComment(populated, req.user._id);

    // REAL-TIME BROADCAST: Emit reply event
    try {
      getIO().emit(`post:${parent.post._id}:comment`, {
        action: 'reply',
        parentId,
        reply: replyData,
      });
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Reply added',
      data: { reply: replyData },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/comments/:id/replies
const getCommentReplies = async (req, res, next) => {
  try {
    const { id: parentId } = req.params;
    if (!isValidId(parentId)) {
      return res.status(400).json({ success: false, message: 'Invalid comment id' });
    }

    const parent = await loadCommentWithOwner(parentId);
    if (!parent) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    if (!canViewUserContent(req.user._id, parent.post.owner)) {
      return res.status(403).json({ success: false, message: 'This account is private' });
    }

    const replies = await Comment.find({ parentComment: parentId })
      .sort({ createdAt: 1 })
      .populate('author', 'username fullName avatar');

    return res.status(200).json({
      success: true,
      data: { replies: replies.map((r) => serializeComment(r, req.user._id)) },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/comments/:id/like
const likeComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid comment id' });
    }

    const comment = await loadCommentWithOwner(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    if (!canViewUserContent(req.user._id, comment.post.owner)) {
      return res.status(403).json({ success: false, message: 'This account is private' });
    }

    const alreadyLiked = comment.likes.some((likeId) => likeId.equals(req.user._id));
    if (alreadyLiked) {
      return res.status(409).json({ success: false, message: 'Already liked this comment' });
    }

    comment.likes.push(req.user._id);
    await comment.save();

    return res.status(200).json({
      success: true,
      message: 'Comment liked',
      data: { likesCount: comment.likes.length, isLikedByViewer: true },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/comments/:id/like
const unlikeComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid comment id' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    comment.likes = comment.likes.filter((likeId) => !likeId.equals(req.user._id));
    await comment.save();

    return res.status(200).json({
      success: true,
      message: 'Comment unliked',
      data: { likesCount: comment.likes.length, isLikedByViewer: false },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
  createReply,
  getCommentReplies,
  likeComment,
  unlikeComment,
};