// Unified Logger Utility
// Supports Development & Production with configurable log levels

class VocabLogger {
  constructor() {
    const manifest = (typeof chrome !== 'undefined' && chrome.runtime?.getManifest?.()) || {};
    this.isProduction = !!manifest.key; // Chrome store builds have key
    this.currentLevel = this.isProduction ? this.LEVELS.WARN : this.LEVELS.DEBUG;
  }

  LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  };

  log(level, message, ...args) {
    if (level < this.currentLevel) return;
    const prefix = this.getPrefix(level);
    switch (level) {
      case this.LEVELS.DEBUG:
        console.debug(prefix + message, ...args);
        break;
      case this.LEVELS.INFO:
        console.info(prefix + message, ...args);
        break;
      case this.LEVELS.WARN:
        console.warn(prefix + message, ...args);
        break;
      case this.LEVELS.ERROR:
        console.error(prefix + message, ...args);
        break;
      default:
        console.log(prefix + message, ...args);
    }
  }

  debug(message, ...args) {
    this.log(this.LEVELS.DEBUG, message, ...args);
  }

  info(message, ...args) {
    this.log(this.LEVELS.INFO, message, ...args);
  }

  warn(message, ...args) {
    this.log(this.LEVELS.WARN, message, ...args);
  }

  error(message, ...args) {
    this.log(this.LEVELS.ERROR, message, ...args);
  }

  getPrefix(level) {
    const now = new Date().toLocaleTimeString();
    const emojiMap = {
      [this.LEVELS.DEBUG]: "🔧 DEBUG",
      [this.LEVELS.INFO]: "ℹ️ INFO",
      [this.LEVELS.WARN]: "⚠️ WARN",
      [this.LEVELS.ERROR]: "❌ ERROR"
    };
    return `[${now}] ${emojiMap[level] || "LOG"}: `;
  }

  setLevel(level) {
    this.currentLevel = level;
  }
}

// Global instance
const logger = new VocabLogger();

// Expose to window for content scripts
if (typeof window !== 'undefined') {
  window.VocabLogger = VocabLogger;
  window.logger = logger;
  console.log("✅ VocabLogger and logger exposed to window");
}
