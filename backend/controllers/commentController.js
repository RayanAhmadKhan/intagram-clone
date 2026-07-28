const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { canViewUserContent } = require('../utils/visibility');

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
  likesCount: comment.likes.length,
  isLikedByViewer: comment.likes.some((id) => id.equals(viewerId)),
  isOwnComment: comment.author._id.equals(viewerId),
  createdAt: comment.createdAt,
  ...extra, // repliesCount on top-level comments
});

// Loads a comment plus its post's owner (isPrivate/followers), for the
// privacy check shared by replies and comment-likes below.
const loadCommentWithOwner = async (commentId) => {
  const comment = await Comment.findById(commentId).populate({
    path: 'post',
    select: 'owner',
    populate: { path: 'owner', select: 'isPrivate followers' },
  });
  return comment;
};

// @route   POST /api/posts/:id/comments
// @access  Private
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

    return res.status(201).json({
      success: true,
      message: 'Comment added',
      data: { comment: serializeComment(populated, req.user._id, { repliesCount: 0 }) },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/posts/:id/comments
// @access  Private
// Top-level comments only, each with a repliesCount — the replies themselves
// are fetched on demand via GET /api/comments/:id/replies.
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

// @route   PUT /api/comments/:id
// @access  Private (author only)
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

    return res.status(200).json({
      success: true,
      message: 'Comment updated',
      data: { comment: serializeComment(populated, req.user._id) },
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/comments/:id
// @access  Private (author only)
// Deletes the comment AND any replies under it, and cleans up every one of
// those ids (parent + replies) from Post.comments in a single $pull.
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
    await Post.findByIdAndUpdate(comment.post, { $pull: { comments: { $in: idsToRemove } } });

    return res.status(200).json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/comments/:id/replies
// @access  Private
// A reply is just a Comment with parentComment set — same collection, same
// serialization, so editing/deleting a reply reuses updateComment/deleteComment
// above unchanged.
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

    return res.status(201).json({
      success: true,
      message: 'Reply added',
      data: { reply: serializeComment(populated, req.user._id) },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/comments/:id/replies
// @access  Private
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

// @route   POST /api/comments/:id/like
// @access  Private
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

// @route   DELETE /api/comments/:id/like
// @access  Private
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
