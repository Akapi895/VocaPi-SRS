// Production logger - removes console.log in production build
class ProductionLogger {
  constructor() {
    this.isProduction = !chrome.runtime.getManifest().key; // Development extensions have key
    this.isDevelopment = !this.isProduction;
  }

  log(...args) {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  info(...args) {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }

  warn(...args) {
    console.warn(...args); // Always show warnings
  }

  error(...args) {
    console.error(...args); // Always show errors
  }

  debug(...args) {
    if (this.isDevelopment) {
      console.debug(...args);
    }
  }

  group(label) {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  table(data) {
    if (this.isDevelopment) {
      console.table(data);
    }
  }
}

// Global logger instance
if (typeof window !== 'undefined') {
  window.Logger = new ProductionLogger();
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductionLogger;
}
