const Message = require('../models/Message');
const User = require('../models/User');
const { getIO } = require('../config/socket');

// Safe extractor for logged-in user ID
const getUserId = (req) => {
  if (!req.user) return null;
  return req.user._id || req.user.id || req.user;
};

// @route   POST /api/messages
const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, text } = req.body;
    const senderId = getUserId(req);

    if (!senderId) { // 401 Unauthorized
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!recipientId) { //400 Bad Request
      return res.status(400).json({ success: false, message: 'Recipient is required' });
    }

    if (!text && !req.file) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    let media = null;
    if (req.file) {
      const { uploadBufferToCloudinary } = require('../utils/cloudinaryUpload');
      const uploadRes = await uploadBufferToCloudinary(req.file.buffer, 'instagram-clone/messages');
      media = { url: uploadRes.url, publicId: uploadRes.publicId };
    }

    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      text: text || '',
      media,
    });

    const populatedMsg = await message.populate('sender recipient', 'username avatar');

    // Emit real-time message event via Socket.io
    try {
      getIO().to(recipientId.toString()).emit('message:received', populatedMsg);
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    return res.status(201).json({ success: true, data: { message: populatedMsg } });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/messages/conversations
const getConversations = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('sender recipient', 'username avatar');

    const conversationMap = new Map();

    for (const msg of messages) {
      if (!msg.sender || !msg.recipient) continue;

      const otherUser = msg.sender._id.toString() === userId.toString() ? msg.recipient : msg.sender;
      const otherUserId = otherUser._id.toString();

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0,
        });
      }

      if (msg.recipient._id.toString() === userId.toString() && !msg.read) {
        const conv = conversationMap.get(otherUserId);
        conv.unreadCount += 1;
      }
    }

    return res.status(200).json({
      success: true,
      data: { conversations: Array.from(conversationMap.values()) },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/messages/:userId
const getChatHistory = async (req, res, next) => {
  try {
    const myId = getUserId(req);
    const { userId: otherUserId } = req.params;

    if (!myId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const messages = await Message.find({
      $or: [
        { sender: myId, recipient: otherUserId },
        { sender: otherUserId, recipient: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender recipient', 'username avatar');

    await Message.updateMany(
      { sender: otherUserId, recipient: myId, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({ success: true, data: { messages } });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getConversations, getChatHistory };