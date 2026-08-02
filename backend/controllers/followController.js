const mongoose = require('mongoose');
const { getIO } = require('../config/socket');
const User = require('../models/User');
const FollowRequest = require('../models/FollowRequest');
const { canViewUserContent } = require('../utils/visibility');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @route   POST /api/follow/:id
// @access  Private
const followUser = async (req, res, next) => {
  try {
    const { id: targetId } = req.params;

    if (!isValidId(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }
    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You can't follow yourself" });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const alreadyFollowing = targetUser.followers.some((f) => f.equals(req.user._id));
    if (alreadyFollowing) {
      return res.status(409).json({ success: false, message: 'Already following this user' });
    }

    if (!targetUser.isPrivate) {
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: targetId } });

      try {
        const io = getIO();
        io.to(`user:${targetId}`).to(targetId.toString()).emit('notification:new', {
          type: 'follow',
          sender: req.user.username,
          userId: req.user._id,
          message: 'started following you.',
        });
      } catch (err) {
        console.error('Socket emit error:', err.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Followed successfully',
        data: { status: 'following' },
      });
    }

    let request;
    try {
      request = await FollowRequest.create({ requester: req.user._id, recipient: targetId });
    } catch (err) {
      if (err.code === 11000) {  // Duplicate key error, meaning a follow request already exists
        return res.status(409).json({ success: false, message: 'Follow request already sent' });
      }
      throw err;
    }

    try {
      const io = getIO();
      const payload = {
        id: request._id,
        requester: {
          id: req.user._id,
          _id: req.user._id,
          username: req.user.username,
          fullName: req.user.fullName,
          avatar: req.user.avatar,
        },
        createdAt: request.createdAt,
      };

      io.to(`user:${targetId}`).to(targetId.toString()).emit('follow:request', payload);
      io.to(`user:${targetId}`).to(targetId.toString()).emit('follow_request', payload);

      io.to(`user:${targetId}`).to(targetId.toString()).emit('notification:new', {
        type: 'follow_request',
        sender: req.user.username,
        message: 'requested to follow you.',
      });
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Follow request sent',
      data: { status: 'requested' },
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/follow/:id
// @access  Private
const unfollowUser = async (req, res, next) => {
  try {
    const { id: targetId } = req.params;

    if (!isValidId(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    await User.findByIdAndUpdate(targetId, { $pull: { followers: req.user._id } });
    await User.findByIdAndUpdate(req.user._id, { $pull: { following: targetId } });

    const deletedRequest = await FollowRequest.findOneAndDelete({
      requester: req.user._id,
      recipient: targetId,
    });

    try {
      const io = getIO();
      const cancelPayload = {
        requesterId: req.user._id.toString(),
        requestId: deletedRequest ? deletedRequest._id.toString() : null,
      };

      io.to(`user:${targetId}`).to(targetId.toString()).emit('follow:canceled', cancelPayload);
      io.to(`user:${targetId}`).to(targetId.toString()).emit('follow_canceled', cancelPayload);
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    return res.status(200).json({
      success: true,
      message: deletedRequest ? 'Follow request cancelled' : 'Unfollowed successfully',
      data: { status: 'not_following' },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/follow/requests
// @access  Private
const getFollowRequests = async (req, res, next) => {
  try {
    const requests = await FollowRequest.find({ recipient: req.user._id })
      .populate('requester', 'username fullName avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        requests: requests.map((r) => ({
          id: r._id,
          requester: r.requester,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/follow/requests/:id/accept
// @access  Private
const acceptFollowRequest = async (req, res, next) => {
  try {
    const { id: requestId } = req.params;

    const request = await FollowRequest.findById(requestId);
    if (!request || !request.recipient.equals(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Follow request not found' });
    }

    await User.findByIdAndUpdate(request.recipient, { $addToSet: { followers: request.requester } });
    await User.findByIdAndUpdate(request.requester, { $addToSet: { following: request.recipient } });
    await request.deleteOne();

    try {
      const io = getIO();
      const requesterRoom = request.requester.toString();

      io.to(`user:${requesterRoom}`).to(requesterRoom).emit('follow:accepted', {
        by: { id: req.user._id, username: req.user.username },
      });
      io.to(`user:${requesterRoom}`).to(requesterRoom).emit('notification:new', {
        type: 'follow_accepted',
        sender: req.user.username,
        message: 'accepted your follow request.',
      });
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    return res.status(200).json({ success: true, message: 'Follow request accepted' });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/follow/requests/:id/reject
// @access  Private
const rejectFollowRequest = async (req, res, next) => {
  try {
    const { id: requestId } = req.params;

    const request = await FollowRequest.findById(requestId);
    if (!request || !request.recipient.equals(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Follow request not found' });
    }

    await request.deleteOne();

    try {
      const io = getIO();
      const requesterRoom = request.requester.toString();

      io.to(`user:${requesterRoom}`).to(requesterRoom).emit('follow:rejected', {
        by: { id: req.user._id, username: req.user.username },
      });
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    return res.status(200).json({ success: true, message: 'Follow request rejected' });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/follow/:id/followers
// @access  Private
const getFollowers = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: 'Invalid user id' });

    const user = await User.findById(id).populate('followers', 'username fullName avatar');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!canViewUserContent(req.user._id, user)) {
      return res.status(403).json({ success: false, message: 'This account is private' });
    }

    return res.status(200).json({
      success: true,
      data: { users: user.followers },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/follow/:id/following
// @access  Private
const getFollowing = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: 'Invalid user id' });

    const user = await User.findById(id).populate('following', 'username fullName avatar');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!canViewUserContent(req.user._id, user)) {
      return res.status(403).json({ success: false, message: 'This account is private' });
    }

    return res.status(200).json({
      success: true,
      data: { users: user.following },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowers,
  getFollowing,
};