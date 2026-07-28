const express = require('express');
const multer = require('multer');
const {
  createStory,
  getUserStories,
  getFeedStories,
  deleteStory,
} = require('../controllers/storyController');
const { authenticateUser } = require('../middlewares/authMiddleware');

const router = express.Router();

// Memory storage for file uploads via multer (sends buffer to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for high-res images and videos
});

// @route   POST /api/stories
// @access  Private
router.post('/', authenticateUser, upload.single('media'), createStory);

// @route   GET /api/stories/feed
// @access  Private
router.get('/feed', authenticateUser, getFeedStories);

// @route   GET /api/stories/user/:username
// @access  Private
router.get('/user/:username', authenticateUser, getUserStories);

// @route   DELETE /api/stories/:id
// @access  Private (owner only)
router.delete('/:id', authenticateUser, deleteStory);

// REQUIRED: Export the router instance for app.use('/api/stories', storyRoutes)
module.exports = router;