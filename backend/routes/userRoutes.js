const express = require('express');
const { getProfileByUsername, updateProfile, updateAvatar } = require('../controllers/userController');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { validate, updateProfileRules } = require('../validators/userValidator');
const { avatarUpload } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// /profile and /avatar use different HTTP methods (PUT/POST) than the
// GET /:username route below, so there's no path collision — but keep any
// future GET-based static routes (e.g. GET /search) above GET /:username.
router.put('/profile', authenticateUser, updateProfileRules, validate, updateProfile);
router.post('/avatar', authenticateUser, avatarUpload.single('avatar'), updateAvatar);
router.get('/:username', authenticateUser, getProfileByUsername);

module.exports = router;
