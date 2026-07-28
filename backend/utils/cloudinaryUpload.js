const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

/**
 * Uploads a buffer (e.g. req.file.buffer from multer memoryStorage) to Cloudinary.
 * @param {Buffer} buffer
 * @param {string} folder - Cloudinary folder, e.g. 'instagram-clone/posts'
 * @param {string} resourceType - 'image' | 'video' | 'auto' (default 'auto' lets
 *   Cloudinary detect it, which is what Posts/Stories need since they accept both)
 * @returns {Promise<{url: string, publicId: string, resourceType: string}>}
 */
const uploadBufferToCloudinary = (buffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = { uploadBufferToCloudinary, deleteFromCloudinary };
