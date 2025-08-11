// Production Logger Utility
// Centralized logging system with production optimization

const VocabLogger = {
  // Production mode flag - set to true for production
  PRODUCTION_MODE: false,
  
  // Log levels
  LEVELS: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  },
  
  // Current log level (only logs at this level or higher will be shown)
  currentLevel: 0, // DEBUG level for development
  
  // Log with level checking
  log(level, message, ...args) {
    if (this.PRODUCTION_MODE && level < this.LEVELS.WARN) {
      return; // Skip debug and info logs in production
    }
    
    if (level >= this.currentLevel) {
      const prefix = this.getPrefix(level);
      console.log(prefix + message, ...args);
    }
  },
  
  // Convenience methods
  debug(message, ...args) {
    this.log(this.LEVELS.DEBUG, message, ...args);
  },
  
  info(message, ...args) {
    this.log(this.LEVELS.INFO, message, ...args);
  },
  
  warn(message, ...args) {
    this.log(this.LEVELS.WARN, message, ...args);
  },
  
  error(message, ...args) {
    this.log(this.LEVELS.ERROR, message, ...args);
  },
  
  // Get prefix for log level
  getPrefix(level) {
    const now = new Date().toLocaleTimeString();
    switch (level) {
      case this.LEVELS.DEBUG:
        return `[${now}] 🔧 DEBUG: `;
      case this.LEVELS.INFO:
        return `[${now}] ℹ️ INFO: `;
      case this.LEVELS.WARN:
        return `[${now}] ⚠️ WARN: `;
      case this.LEVELS.ERROR:
        return `[${now}] ❌ ERROR: `;
      default:
        return `[${now}] `;
    }
  },
  
  // Set production mode
  setProductionMode(enabled) {
    this.PRODUCTION_MODE = enabled;
    this.currentLevel = enabled ? this.LEVELS.WARN : this.LEVELS.DEBUG;
  }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.VocabLogger = VocabLogger;
}

// Export for Node.js modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VocabLogger;
}
