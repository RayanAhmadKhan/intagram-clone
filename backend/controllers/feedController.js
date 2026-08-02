const Post = require('../models/Post');
const User = require('../models/User');
const { serializePost } = require('./postController');


// @desc    Get feed posts for the authenticated user
// @route   GET /api/feed
// @access  Private
const getFeed = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const me = await User.findById(req.user._id).select('following');
    const ownerIds = [req.user._id, ...me.following];

    const [posts, totalCount] = await Promise.all([
      Post.find({ owner: { $in: ownerIds } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'username fullName avatar'),
      Post.countDocuments({ owner: { $in: ownerIds } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        posts: posts.map((p) => serializePost(p, req.user._id)),
        pagination: {
          page,
          limit,
          totalCount,
          hasMore: skip + posts.length < totalCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFeed };
