const express = require('express');
const {
  followUser,
  unfollowUser,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowers,
  getFollowing,
} = require('../controllers/followController');
const { authenticateUser } = require('../middlewares/authMiddleware');

const router = express.Router();

// Static routes registered before /:id to avoid route collisions
router.get('/requests', authenticateUser, getFollowRequests);
router.post('/requests/:id/accept', authenticateUser, acceptFollowRequest);
router.post('/requests/:id/reject', authenticateUser, rejectFollowRequest);

router.get('/:id/followers', authenticateUser, getFollowers);
router.get('/:id/following', authenticateUser, getFollowing);

router.post('/:id', authenticateUser, followUser);
router.delete('/:id', authenticateUser, unfollowUser);

module.exports = router;