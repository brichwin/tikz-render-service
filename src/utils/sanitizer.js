const { MAX_TIKZ_SIZE, DANGEROUS_PATTERNS } = require('../config/constants');

function validateTikzCode(tikzCode) {
  if (!tikzCode || typeof tikzCode !== 'string') {
    throw new Error('tikzCode must be a non-empty string');
  }

  if (tikzCode.length > MAX_TIKZ_SIZE) {
    throw new Error(`tikzCode too large (max ${MAX_TIKZ_SIZE} bytes)`);
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(tikzCode)) {
      throw new Error('Potentially dangerous LaTeX command detected');
    }
  }

  return tikzCode;
}

module.exports = { validateTikzCode };
