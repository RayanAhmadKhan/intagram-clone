const multer = require('multer');

const storage = multer.memoryStorage();

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
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB, generous for short videos
});

module.exports = { avatarUpload, mediaUpload };
