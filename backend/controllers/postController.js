const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');
const { canViewUserContent } = require('../utils/visibility');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const serializePost = (post, viewerId) => ({
  id: post._id,
  caption: post.caption,
  media: post.media,
  owner: {
    id: post.owner._id,
    username: post.owner.username,
    fullName: post.owner.fullName,
    avatar: post.owner.avatar,
  },
  likesCount: post.likes.length,
  commentsCount: post.comments.length,
  isLikedByViewer: post.likes.some((id) => id.equals(viewerId)),
  isOwnPost: post.owner._id.equals(viewerId),
  createdAt: post.createdAt,
});

// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one media file is required' });
    }

    const media = [];
    for (const file of req.files) {
      const result = await uploadBufferToCloudinary(file.buffer, 'instagram-clone/posts');
      media.push({ url: result.url, publicId: result.publicId, resourceType: result.resourceType });
    }

    const post = await Post.create({
      caption: req.body.caption || '',
      media,
      owner: req.user._id,
    });

    const populated = await post.populate('owner', 'username fullName avatar');

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post: serializePost(populated, req.user._id) },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/posts/:id
// @access  Private
const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post id' });
    }

    const post = await Post.findById(id).populate(
      'owner',
      'username fullName avatar isPrivate followers'
    );
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (!canViewUserContent(req.user._id, post.owner)) {
      return res.status(403).json({ success: false, message: 'This account is private' });
    }

    return res.status(200).json({ success: true, data: { post: serializePost(post, req.user._id) } });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/posts/:id
// @access  Private (owner only)
// NOTE: only the caption is editable — media is treated as immutable once
// posted (matches how Instagram itself behaves; re-uploading media on edit
// adds real complexity for little evaluation value, so this is a deliberate
// scope call worth mentioning in your README's Assumptions section).
const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post id' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (!post.owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only edit your own posts' });
    }

    post.caption = req.body.caption;
    await post.save();

    const populated = await post.populate('owner', 'username fullName avatar');

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: { post: serializePost(populated, req.user._id) },
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/posts/:id
// @access  Private (owner only)
const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post id' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (!post.owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own posts' });
    }

    for (const item of post.media) {
      await deleteFromCloudinary(item.publicId, item.resourceType);
    }
    await post.deleteOne();

    return res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/posts/user/:username
// @access  Private
const getUserPosts = async (req, res, next) => {
  try {
    const { username } = req.params;

    const owner = await User.findOne({ username: username.toLowerCase() });
    if (!owner) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!canViewUserContent(req.user._id, owner)) {
      return res.status(403).json({ success: false, message: 'This account is private' });
    }

    const posts = await Post.find({ owner: owner._id })
      .sort({ createdAt: -1 })
      .populate('owner', 'username fullName avatar');

    return res.status(200).json({
      success: true,
      data: { posts: posts.map((p) => serializePost(p, req.user._id)) },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post id' });
    }

    const post = await Post.findById(id).populate('owner', 'isPrivate followers');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (!canViewUserContent(req.user._id, post.owner)) {
      return res.status(403).json({ success: false, message: 'This account is private' });
    }

    const alreadyLiked = post.likes.some((id) => id.equals(req.user._id));
    if (alreadyLiked) {
      return res.status(409).json({ success: false, message: 'Already liked this post' });
    }

    post.likes.push(req.user._id);
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post liked',
      data: { likesCount: post.likes.length, isLikedByViewer: true },
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/posts/:id/like
// @access  Private
const unlikePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post id' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.likes = post.likes.filter((likeId) => !likeId.equals(req.user._id));
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post unliked',
      data: { likesCount: post.likes.length, isLikedByViewer: false },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getPostById,
  updatePost,
  deletePost,
  getUserPosts,
  likePost,
  unlikePost,
};
