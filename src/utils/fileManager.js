const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

async function ensureTempDir() {
  await fs.mkdir(config.tempDir, { recursive: true });
}

function generateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getTempPath(hash, extension = '') {
  return path.join(config.tempDir, `${hash}${extension}`);
}

async function cleanup(basePath) {
  const extensions = ['.tex', '.pdf', '.aux', '.log', '.svg', '.png'];
  await Promise.all(
    extensions.map(ext => 
      fs.unlink(basePath + ext).catch(() => {})
    )
  );
}

module.exports = {
  ensureTempDir,
  generateHash,
  getTempPath,
  cleanup
};
