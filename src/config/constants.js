module.exports = {
  MAX_TIKZ_SIZE: 50000, // 50KB
  MAX_CONCURRENT_COMPILATIONS: 2,
  LATEX_TIMEOUT: 30000, // 30 seconds
  CONVERSION_TIMEOUT: 10000, // 10 seconds
  CACHE_TTL: 3600, // 1 hour
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX: 20,
  DANGEROUS_PATTERNS: [
    /\\input\{/i,
    /\\include\{/i,
    /\\write18/i,
    /\\immediate\\write/i,
    /\\openout/i,
    /\\input\|/i,
    /\\def\\input/i
  ]
};
