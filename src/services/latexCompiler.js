const fs = require('fs').promises;
const { execWithTimeout } = require('../utils/execWithTimeout');
const { getTempPath, cleanup } = require('../utils/fileManager');
const { LATEX_TIMEOUT } = require('../config/constants');

async function compileLatex(tikzCode, hash) {
  const basePath = getTempPath(hash);
  const texPath = `${basePath}.tex`;
  const pdfPath = `${basePath}.pdf`;

  const latexDoc = `
\\documentclass[border=2pt]{standalone}
\\usepackage{tikz}
\\usetikzlibrary{arrows,shapes,positioning,calc}
\\begin{document}
${tikzCode}
\\end{document}
`;

  await fs.writeFile(texPath, latexDoc);

  await execWithTimeout(
    `pdflatex -interaction=nonstopmode -output-directory=${getTempPath('')} ${texPath}`,
    LATEX_TIMEOUT
  );

  return pdfPath;
}

module.exports = { compileLatex };
