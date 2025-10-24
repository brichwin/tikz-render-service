const app = require('./app');
const config = require('./config');
const { ensureTempDir } = require('./utils/fileManager');

async function start() {
  try {
    await ensureTempDir();
    
    app.listen(config.port, () => {
      console.log(`TikZ rendering service running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
