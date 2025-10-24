const express = require('express');
const router = express.Router();
const renderRoutes = require('./render');
const describeRoutes = require('./describe');
const compilationQueue = require('../services/compilationQueue');
const cacheService = require('../services/cacheService');

router.use('/render', renderRoutes);
router.use('/describe', describeRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    queue: compilationQueue.getStats(),
    cache: cacheService.getStats(),
    aiDescriptions: !!process.env.ANTHROPIC_API_KEY
  });
});

module.exports = router;
