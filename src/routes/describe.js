const express = require('express');
const router = express.Router();
const { generateDescription } = require('../services/descriptionService');
const cacheService = require('../services/cacheService');
const { generateHash } = require('../utils/fileManager');

router.post('/', async (req, res, next) => {
  console.log('=== Description Request Received ===');
  
  const { tikzCode, imageBase64, format = 'png' } = req.body;

  try {
    if (!tikzCode || !imageBase64) {
      return res.status(400).json({ 
        error: 'tikzCode and imageBase64 are required' 
      });
    }

    if (!['svg', 'png'].includes(format)) {
      return res.status(400).json({ 
        error: 'format must be svg or png' 
      });
    }

    // Create cache key based on TikZ code only
    // (descriptions are the same regardless of image format)
    const cacheKey = 'desc_' + generateHash(tikzCode);
    
    // Check cache first
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log('Description cache HIT');
      
      // Return as plain text with cache header
      res.set('Content-Type', 'text/plain; charset=utf-8');
      res.set('X-Cache', 'HIT');
      return res.send(`${cached.altText}\n\n${cached.longDescription}`);
    }

    console.log('Description cache MISS - generating...');
    const descriptions = await generateDescription(tikzCode, imageBase64, format);
    
    // Cache the descriptions
    cacheService.set(cacheKey, descriptions);
    
    console.log('Description generated and cached successfully');
    console.log('Alt text length:', descriptions.altText.length);
    
    // Return as plain text with cache header
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.set('X-Cache', 'MISS');
    res.send(`${descriptions.altText}\n\n${descriptions.longDescription}`);

  } catch (error) {
    console.error('Description generation error:', error);
    next(error);
  }
});

module.exports = router;