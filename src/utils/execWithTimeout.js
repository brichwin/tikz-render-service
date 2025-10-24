const { exec } = require('child_process');

function execWithTimeout(command, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout);
      }
    });

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`Command timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on('exit', () => clearTimeout(timeout));
  });
}

module.exports = { execWithTimeout };
