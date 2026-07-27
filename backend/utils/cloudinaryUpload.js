const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

/**
 * Uploads a buffer (e.g. req.file.buffer from multer memoryStorage) to Cloudinary.
 * @param {Buffer} buffer
 * @param {string} folder - Cloudinary folder, e.g. 'instagram-clone/avatars'
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadBufferToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadBufferToCloudinary, deleteFromCloudinary };
