const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

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
