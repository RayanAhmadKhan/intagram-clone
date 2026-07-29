const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    media: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      resourceType: { type: String, enum: ['image', 'video'], required: true },
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 1 * 60 * 1000), // 1 minute from creation
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Fast lookups for "active stories by owner" and for the cron sweep
storySchema.index({ owner: 1, deleted: 1, expiresAt: 1 });

module.exports = mongoose.model('Story', storySchema);


