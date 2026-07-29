const mongoose = require('mongoose');
const { getIO } = require('../config/socket');
const User = require('../models/User');
const FollowRequest = require('../models/FollowRequest');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @route   POST /api/follow/:id
// @access  Private
// Public account -> follows instantly. Private account -> creates a pending request.
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
      // Public account: follow instantly
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: targetId } });

      try {
        getIO().to(`user:${targetId}`).emit('notification:new', {
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

    // Private account: create (or report) a pending request
    let request;
    try {
      request = await FollowRequest.create({ requester: req.user._id, recipient: targetId });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: 'Follow request already sent' });
      }
      throw err;
    }

    try {
      const io = getIO();
      // Specific event so the recipient's Requests page can push this into
      // its list live, without a page refresh...
      io.to(`user:${targetId}`).emit('follow:request', {
        id: request._id,
        requester: {
          id: req.user._id,
          username: req.user.username,
          fullName: req.user.fullName,
          avatar: req.user.avatar,
        },
        createdAt: request.createdAt,
      });
      // ...plus the generic notification, same pattern as likes/comments.
      io.to(`user:${targetId}`).emit('notification:new', {
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
// Unfollows if already following, OR cancels a pending request if one exists.
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
// Incoming pending requests for the logged-in user to accept/reject
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
      // The specific "followAccepted" event your roadmap calls for — lets the
      // requester's UserProfile button flip from "Requested" to "Unfollow"
      // live, without them refreshing.
      io.to(`user:${request.requester}`).emit('follow:accepted', {
        by: { id: req.user._id, username: req.user.username },
      });
      io.to(`user:${request.requester}`).emit('notification:new', {
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
      // Quietly reset the requester's own button state live — deliberately
      // NOT a user-facing "you were rejected" notification (Instagram itself
      // declines to broadcast rejections too), just a state sync.
      getIO().to(`user:${request.requester}`).emit('follow:rejected', {
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

module.exports = {
  followUser,
  unfollowUser,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
};
