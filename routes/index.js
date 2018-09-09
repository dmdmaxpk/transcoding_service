const express = require('express');
const router = express.Router();

// Service Label
router.get('/', (req, res) => res.send("Transcode Microservice"));

router.use('/transcode',    require('./transcodeRoutes'));

module.exports = router;