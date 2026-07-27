const express = require('express');
const {
  followUser,
  unfollowUser,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
} = require('../controllers/followController');
const { authenticateUser } = require('../middlewares/authMiddleware');

const router = express.Router();

// Static routes registered before the /:id param route to avoid collisions
router.get('/requests', authenticateUser, getFollowRequests);
router.post('/requests/:id/accept', authenticateUser, acceptFollowRequest);
router.post('/requests/:id/reject', authenticateUser, rejectFollowRequest);

router.post('/:id', authenticateUser, followUser);
router.delete('/:id', authenticateUser, unfollowUser);

module.exports = router;
