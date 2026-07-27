const mongoose = require('mongoose');

const followRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent the same user from sending duplicate pending requests to the same account
followRequestSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model('FollowRequest', followRequestSchema);
