const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

// @route   POST /api/media/test-upload
// @access  Private
// This is a throwaway diagnostic route for Step 7 — it exists only to prove
// the Cloudinary media service (image + video, buffer -> stream -> Cloudinary)
// works before Posts (Step 8) starts calling uploadBufferToCloudinary directly
// from the real post-creation flow. Safe to delete once Step 8 is underway.
const testUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, 'instagram-clone/test-uploads');

    return res.status(200).json({
      success: true,
      message: 'Uploaded successfully',
      data: result, // { url, publicId, resourceType }
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/media/test-upload/:publicId
// @access  Private
// Lets you verify deletion works too (Cloudinary public IDs can contain slashes,
// so the client should URL-encode the id — see testing instructions).
const testDelete = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    const { resourceType } = req.query; // 'image' | 'video'
    await deleteFromCloudinary(decodeURIComponent(publicId), resourceType || 'image');
    return res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { testUpload, testDelete };
