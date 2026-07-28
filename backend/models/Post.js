const mongoose = require('mongoose');

const mediaItemSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ['image', 'video'], required: true },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    caption: {
      type: String,
      trim: true,
      maxlength: 2200,
      default: '',
    },
    media: {
      type: [mediaItemSchema],
      validate: {
        validator: (arr) => arr.length > 0 && arr.length <= 10,
        message: 'A post needs between 1 and 10 media items',
      },
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likes: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] },
    ],
    comments: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: [] },
    ],
  },
  { timestamps: true }
);

postSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
