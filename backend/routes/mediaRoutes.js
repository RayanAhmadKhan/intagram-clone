const express = require('express');
const { testUpload, testDelete } = require('../controllers/mediaController');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { mediaUpload } = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.post('/test-upload', authenticateUser, mediaUpload.single('media'), testUpload);
router.delete('/test-upload/:publicId', authenticateUser, testDelete);

module.exports = router;
