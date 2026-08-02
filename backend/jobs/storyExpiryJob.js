const cron = require('node-cron');
const Story = require('../models/Story');
const { deleteFromCloudinary } = require('../utils/cloudinaryUpload');

const sweepExpiredStories = async () => {
  const expired = await Story.find({ deleted: false, expiresAt: { $lte: new Date() } });

  if (expired.length === 0) return;

  for (const story of expired) {
    try {
      await deleteFromCloudinary(story.media.publicId, story.media.resourceType);
    } catch (err) {
      console.error(`Failed to delete Cloudinary asset for story ${story._id}:`, err.message);
    }
  }

  await Story.updateMany(
    { _id: { $in: expired.map((s) => s._id) } },
    { $set: { deleted: true } }
  );

  console.log(`Story expiry sweep: soft-deleted ${expired.length} story(ies)`);
};

const startStoryExpiryJob = () => {
  cron.schedule('* * * * *', () => {
    sweepExpiredStories().catch((err) => console.error('Story expiry sweep failed:', err));
  });
  console.log('Story expiry cron job scheduled (runs every minute)');
};

module.exports = { startStoryExpiryJob, sweepExpiredStories };
