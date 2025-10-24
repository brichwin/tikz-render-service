const NodeCache = require('node-cache');
const { CACHE_TTL } = require('../config/constants');

class CacheService {
  constructor() {
    this.cache = new NodeCache({ 
      stdTTL: CACHE_TTL, 
      checkperiod: 600 
    });
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    return this.cache.set(key, value);
  }

  getStats() {
    return this.cache.getStats();
  }

  flush() {
    return this.cache.flushAll();
  }
}

module.exports = new CacheService();
