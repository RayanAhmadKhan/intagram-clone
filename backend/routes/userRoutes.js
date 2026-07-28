// const express = require('express');
// const {
//   createPost,
//   getPostById,
//   updatePost,
//   deletePost,
//   getUserPosts,
//   likePost,
//   unlikePost,
// } = require('../controllers/postController');
// const { createComment, getPostComments } = require('../controllers/commentController');
// const { authenticateUser } = require('../middlewares/authMiddleware');
// const { validate, createPostRules, updatePostRules } = require('../validators/postValidator');
// const { validate: validateComment, commentRules } = require('../validators/commentValidator');
// const { mediaUpload } = require('../middlewares/uploadMiddleware');

// const router = express.Router();

// // Static route registered before the /:id param route to avoid collisions
// router.get('/user/:username', authenticateUser, getUserPosts);

// router.post('/', authenticateUser, mediaUpload.array('media', 10), createPostRules, validate, createPost);
// router.get('/:id', authenticateUser, getPostById);
// router.put('/:id', authenticateUser, updatePostRules, validate, updatePost);
// router.delete('/:id', authenticateUser, deletePost);
// router.post('/:id/like', authenticateUser, likePost);
// router.delete('/:id/like', authenticateUser, unlikePost);
// router.post('/:id/comments', authenticateUser, commentRules, validateComment, createComment);
// router.get('/:id/comments', authenticateUser, getPostComments);

// module.exports = router;
const express = require('express');
const router = express.Router();
const {
  getProfileByUsername,
  updateProfile,
  updateAvatar,
} = require('../controllers/userController');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { mediaUpload } = require('../middlewares/uploadMiddleware');

// 1. Profile updates (placed before /:username to avoid route collisions)
router.put('/profile', authenticateUser, updateProfile);
router.post('/avatar', authenticateUser, mediaUpload.single('avatar'), updateAvatar);

// 2. Profile lookup (handles /api/users/test3)
router.get('/:username', authenticateUser, getProfileByUsername);

module.exports = router;