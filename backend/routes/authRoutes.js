const express = require('express');
const { register, login, logout, getMe } = require('../controllers/authController');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { validate, registerRules, loginRules } = require('../validators/authValidator');

const router = express.Router();

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/logout', authenticateUser, logout);
router.get('/me', authenticateUser, getMe);

module.exports = router;
