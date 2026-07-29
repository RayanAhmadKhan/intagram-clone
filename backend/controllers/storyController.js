const mongoose = require('mongoose');
const Story = require('../models/Story');
const User = require('../models/User');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');
const { canViewUserContent } = require('../utils/visibility');
const { getIO } = require('../config/socket'); // Added socket import

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const serializeStory = (story, viewerId) => ({
  id: story._id,
  media: story.media,
  owner: {
    id: story.owner._id,
    username: story.owner.username,
    avatar: story.owner.avatar,
  },
  isOwnStory: story.owner._id.equals(viewerId),
  createdAt: story.createdAt,
  expiresAt: story.expiresAt,
});

const activeStoryFilter = (extra = {}) => ({
  deleted: false,
  expiresAt: { $gt: new Date() },
  ...extra,
});

// @route   POST /api/stories
const createStory = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'A photo or video is required' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, 'instagram-clone/stories');

    const story = await Story.create({
      owner: req.user._id,
      media: { url: result.url, publicId: result.publicId, resourceType: result.resourceType },
    });

    const populated = await story.populate('owner', 'username avatar');
    const serialized = serializeStory(populated, req.user._id);

    // REAL-TIME BROADCAST: Notify all clients of new story
    try {
      getIO().emit('story:new', { story: serialized, ownerId: req.user._id });
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Story posted — it will expire in 10 minutes',
      data: { story: serialized },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/stories/user/:username
const getUserStories = async (req, res, next) => {
  try {
    const { username } = req.params;

    const owner = await User.findOne({ username: username.toLowerCase() });
    if (!owner) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!canViewUserContent(req.user._id, owner)) {
      return res.status(403).json({ success: false, message: 'This account is private' });
    }

    const stories = await Story.find(activeStoryFilter({ owner: owner._id }))
      .sort({ createdAt: 1 })
      .populate('owner', 'username avatar');

    return res.status(200).json({
      success: true,
      data: { stories: stories.map((s) => serializeStory(s, req.user._id)) },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/stories/feed
const getFeedStories = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id).select('following');
    const ownerIds = [req.user._id, ...me.following];

    const stories = await Story.find(activeStoryFilter({ owner: { $in: ownerIds } }))
      .sort({ createdAt: 1 })
      .populate('owner', 'username avatar');

    const grouped = new Map();
    for (const story of stories) {
      const key = story.owner._id.toString();
      if (!grouped.has(key)) {
        grouped.set(key, {
          owner: { id: story.owner._id, username: story.owner.username, avatar: story.owner.avatar },
          isOwn: story.owner._id.equals(req.user._id),
          stories: [],
        });
      }
      grouped.get(key).stories.push(serializeStory(story, req.user._id));
    }

    return res.status(200).json({ success: true, data: { feed: Array.from(grouped.values()) } });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/stories/:id
const deleteStory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid story id' });
    }

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }
    if (!story.owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own stories' });
    }

    await deleteFromCloudinary(story.media.publicId, story.media.resourceType);
    story.deleted = true;
    await story.save();

    return res.status(200).json({ success: true, message: 'Story deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createStory, getUserStories, getFeedStories, deleteStory };