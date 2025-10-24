const { validateTikzCode } = require('../utils/sanitizer');

function validateRenderRequest(req, res, next) {
  try {
    const { tikzCode, format = 'svg' } = req.body;

    validateTikzCode(tikzCode);

    if (!['svg', 'png'].includes(format)) {
      return res.status(400).json({ error: 'format must be svg or png' });
    }

    req.validated = { tikzCode, format };
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = { validateRenderRequest };
