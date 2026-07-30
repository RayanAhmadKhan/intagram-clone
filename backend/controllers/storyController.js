const mongoose = require('mongoose');
const Story = require('../models/Story');
const User = require('../models/User');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');
const { canViewUserContent } = require('../utils/visibility');
const { getIO } = require('../config/socket');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const serializeStory = (story, viewerId) => ({
  id: story._id,
  media: story.media,
  owner: {
    id: story.owner._id,
    username: story.owner.username,
    avatar: story.owner.avatar,
  },
  isOwnStory: story.owner._id.toString() === viewerId.toString(),
  createdAt: story.createdAt,
  expiresAt: story.expiresAt,
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
      // expiresAt intentionally omitted — let the schema default (10 minutes,
      // see models/Story.js) apply. Hardcoding it here previously overrode
      // that default with 24 hours on every story, which is why stories
      // weren't disappearing on the timeline you expected.
    });

    const populated = await story.populate('owner', 'username avatar followers');
    const serialized = serializeStory(populated, req.user._id);

    try {
      const io = getIO();
      const recipientIds = [req.user._id, ...populated.owner.followers];
      recipientIds.forEach((id) => {
        io.to(`user:${id}`).emit('story:new', { story: serialized, ownerId: req.user._id });
      });
    } catch (err) {
      console.error('Socket emit error:', err?.message || err);
    }

    return res.status(201).json({
      success: true,
      message: 'Story posted',
      data: { story: serialized },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/stories/feed
const getFeedStories = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id).select('following');
    const myIdStr = req.user._id.toString();

    const ownerIds = [req.user._id, ...(me?.following || [])];

    const stories = await Story.find({
      deleted: false,
      owner: { $in: ownerIds },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: 1 })
      .populate('owner', 'username avatar');

    const grouped = new Map();

    for (const story of stories) {
      if (!story.owner) continue;

      const ownerIdStr = story.owner._id.toString();

      if (!grouped.has(ownerIdStr)) {
        grouped.set(ownerIdStr, {
          owner: {
            id: ownerIdStr,
            username: story.owner.username,
            avatar: story.owner.avatar,
          },
          isOwn: ownerIdStr === myIdStr,
          stories: [],
        });
      }

      grouped.get(ownerIdStr).stories.push(serializeStory(story, req.user._id));
    }

    return res.status(200).json({
      success: true,
      data: { feed: Array.from(grouped.values()) },
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

    const stories = await Story.find({
      owner: owner._id,
      deleted: false,
      expiresAt: { $gt: new Date() },
    })
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
