const express = require('express');
const router = express.Router();
const transcodeController = require('../controllers/transcodeController')

// Post route for transcoding
router.post('/', transcodeController.transcodeVideo);

// Transcoding status e.g /transcode/status?_id={123}
router.get('/status', transcodeController.getStatus);

module.exports = router;
