require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  tempDir: process.env.TEMP_DIR || './temp',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || null
};
