const User = require('../models/User');
const FollowRequest = require('../models/FollowRequest');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');
const { getIO } = require('../config/socket');

// @route   GET /api/users/:username
// @access  Private
const getProfileByUsername = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isOwnProfile = req.user._id.equals(user._id);
    const isFollowing = user.followers.some((f) => f.equals(req.user._id));

    let hasPendingRequest = false;
    if (!isOwnProfile && !isFollowing) {
      const pending = await FollowRequest.findOne({ requester: req.user._id, recipient: user._id });
      hasPendingRequest = !!pending;
    }

    const canViewPrivateDetails = isOwnProfile || isFollowing || !user.isPrivate;

    return res.status(200).json({
      success: true,
      data: {
        profile: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: canViewPrivateDetails ? user.bio : '',
          isPrivate: user.isPrivate,
          isOwnProfile,
          isFollowing,
          hasPendingRequest,
          followersCount: user.followers.length,
          followingCount: user.following.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, bio, isPrivate } = req.body;

    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (bio !== undefined) updates.bio = bio;
    if (isPrivate !== undefined) updates.isPrivate = isPrivate;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          isPrivate: user.isPrivate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/users/avatar
// @access  Private
const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const user = await User.findById(req.user._id);

    if (user.avatar?.publicId) {
      await deleteFromCloudinary(user.avatar.publicId);
    }

    const { url, publicId } = await uploadBufferToCloudinary(
      req.file.buffer,
      'instagram-clone/avatars'
    );

    user.avatar = { url, publicId };
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      data: { avatar: user.avatar },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfileByUsername, updateProfile, updateAvatar };