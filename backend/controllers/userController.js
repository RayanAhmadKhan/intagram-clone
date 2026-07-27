const User = require('../models/User');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

// @route   GET /api/users/:username
// @access  Private (must be logged in to view any profile)
// NOTE: full private-account gating (only approved followers can see content)
// is completed in Step 6 once the Follow system exists. For now this returns
// the profile's public fields to any authenticated user.
const getProfileByUsername = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isOwnProfile = req.user._id.equals(user._id);

    return res.status(200).json({
      success: true,
      data: {
        profile: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          isPrivate: user.isPrivate,
          isOwnProfile,
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

    // Delete the old avatar from Cloudinary first, if one exists
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
