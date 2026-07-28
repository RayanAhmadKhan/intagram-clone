const express = require('express');
const {
  updateComment,
  deleteComment,
  createReply,
  getCommentReplies,
  likeComment,
  unlikeComment,
} = require('../controllers/commentController');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { validate, commentRules } = require('../validators/commentValidator');

const router = express.Router();

// Edit / Delete standalone comments or replies
router.put('/:id', authenticateUser, commentRules, validate, updateComment);
router.delete('/:id', authenticateUser, deleteComment);

// Reply management
router.post('/:id/replies', authenticateUser, commentRules, validate, createReply);
router.get('/:id/replies', authenticateUser, getCommentReplies);

// Comment/Reply likes
router.post('/:id/like', authenticateUser, likeComment);
router.delete('/:id/like', authenticateUser, unlikeComment);

module.exports = router;