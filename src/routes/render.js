const express = require('express');
const router = express.Router();
const { validateRenderRequest } = require('../middleware/validator');
const compilationQueue = require('../services/compilationQueue');
const cacheService = require('../services/cacheService');
const { compileLatex } = require('../services/latexCompiler');
const { convertToFormat } = require('../services/imageConverter');
const { generateHash, cleanup, getTempPath } = require('../utils/fileManager');

router.post('/', validateRenderRequest, async (req, res, next) => {
  const { tikzCode, format } = req.validated;

  try {
    // Check cache
    const cacheKey = generateHash(tikzCode + format);
    const cached = cacheService.get(cacheKey);

    if (cached) {
      res.set('Content-Type', format === 'svg' ? 'image/svg+xml' : 'image/png');
      res.set('X-Cache', 'HIT');
      return res.send(cached);
    }

    // Queue and render
    const result = await compilationQueue.add(async () => {
      const hash = generateHash(tikzCode + format);
      const basePath = getTempPath(hash);

      try {
        const pdfPath = await compileLatex(tikzCode, hash);
        const imageBuffer = await convertToFormat(pdfPath, hash, format);
        await cleanup(basePath);
        return imageBuffer;
      } catch (error) {
        await cleanup(basePath);
        throw error;
      }
    });

    // Cache result
    cacheService.set(cacheKey, result);

    res.set('Content-Type', format === 'svg' ? 'image/svg+xml' : 'image/png');
    res.set('X-Cache', 'MISS');
    res.send(result);

  } catch (error) {
    next(error);
  }
});

module.exports = router;
