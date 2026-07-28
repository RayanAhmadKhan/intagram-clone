const express = require('express');
const { getFeed } = require('../controllers/feedController');
const { authenticateUser } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authenticateUser, getFeed);

module.exports = router;
