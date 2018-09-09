const express = require('express');
const router = express.Router();
const transcodeController = require('../controllers/transcodeController')


router.route('/')
    .post(transcodeController.transcodeVideo);


module.exports = router;
