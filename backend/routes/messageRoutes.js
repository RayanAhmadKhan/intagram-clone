const express = require('express');
const router = express.Router();
const multer = require('multer');

// Destructure authenticateUser matching your authMiddleware export
const { authenticateUser } = require('../middlewares/authMiddleware');

const {
  sendMessage,
  getConversations,
  getChatHistory,
} = require('../controllers/messageController');

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

// Apply authentication middleware
router.use(authenticateUser);

router.post('/', upload.single('media'), sendMessage);
router.get('/conversations', getConversations);
router.get('/:userId', getChatHistory);

module.exports = router;