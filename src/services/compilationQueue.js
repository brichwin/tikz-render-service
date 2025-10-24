const { MAX_CONCURRENT_COMPILATIONS } = require('../config/constants');

class CompilationQueue {
  constructor(maxConcurrent = MAX_CONCURRENT_COMPILATIONS) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { fn, resolve, reject } = this.queue.shift();

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }

  getStats() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
}

module.exports = new CompilationQueue();
