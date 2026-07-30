const express = require('express');
const {
  createPost,
  getPostById,
  updatePost,
  deletePost,
  getUserPosts,
  likePost,
  unlikePost,
  getPostLikes,
} = require('../controllers/postController');
const { createComment, getPostComments } = require('../controllers/commentController');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { validate, createPostRules, updatePostRules } = require('../validators/postValidator');
const { validate: validateComment, commentRules } = require('../validators/commentValidator');
const { mediaUpload } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// 1. Static user posts route (placed before /:id)
router.get('/user/:username', authenticateUser, getUserPosts);

// 2. Post CRUD
router.post('/', authenticateUser, mediaUpload.array('media', 10), createPostRules, validate, createPost);
router.get('/:id', authenticateUser, getPostById);
router.put('/:id', authenticateUser, updatePostRules, validate, updatePost);
router.delete('/:id', authenticateUser, deletePost);

// 3. Post Likes
router.get('/:id/likes', authenticateUser, getPostLikes);
router.post('/:id/like', authenticateUser, likePost);
router.delete('/:id/like', authenticateUser, unlikePost);

// 4. Post Comments
router.post('/:id/comments', authenticateUser, commentRules, validateComment, createComment);
router.get('/:id/comments', authenticateUser, getPostComments);

module.exports = router;