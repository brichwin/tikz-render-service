const fs = require('fs').promises;
const { execWithTimeout } = require('../utils/execWithTimeout');
const { getTempPath } = require('../utils/fileManager');
const { CONVERSION_TIMEOUT } = require('../config/constants');

async function convertToFormat(pdfPath, hash, format) {
  const basePath = getTempPath(hash);
  const outputPath = `${basePath}.${format}`;

  if (format === 'svg') {
    await execWithTimeout(`pdf2svg ${pdfPath} ${outputPath}`, CONVERSION_TIMEOUT);
  } else if (format === 'png') {
    await execWithTimeout(
      `pdftoppm ${pdfPath} ${basePath} -png -singlefile -r 300`,
      CONVERSION_TIMEOUT
    );
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }

  return await fs.readFile(outputPath);
}

module.exports = { convertToFormat };
