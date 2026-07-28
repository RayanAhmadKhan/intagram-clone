const multer = require('multer');

const storage = multer.memoryStorage();

// Avatars: images only, small limit (used by Step 5 profile upload)
const imageOnlyFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const avatarUpload = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Posts/Stories: images or videos, larger limit (Step 7 media service)
const mediaFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image or video files are allowed'), false);
  }
};

const mediaUpload = multer({
  storage,
  fileFilter: mediaFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB, generous for short videos
});

module.exports = { avatarUpload, mediaUpload };
