const Post = require('../models/Post');
const User = require('../models/User');
const { serializePost } = require('./postController');

// @route   GET /api/feed?page=1&limit=10
// @access  Private
// Posts already only ever come from users you follow (private accounts only
// enter your "following" list once they've accepted your request), so no
// extra per-post privacy check is needed here — that gate already happened
// at follow-time. This is exactly why Follow (Step 6) had to come before Feed.
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
