// Utility functions for VocabSRS
class DateUtils {
  static now() {
    return new Date().toISOString();
  }

  static formatDate(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleDateString();
  }

  static isToday(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  static addDays(date, days) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString();
  }
}

class TextUtils {
  static sanitizeText(text) {
    if (!text) return '';
    return text.trim().toLowerCase();
  }

  static formatDisplayText(text) {
    if (!text) return '';
    return text.trim();
  }

  static isPhrase(text) {
    if (!text) return false;
    return text.trim().split(/\s+/).length > 1;
  }

  static countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  }
}

class IDUtils {
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static generateShortID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
}

class Logger {
  static log(message, ...args) {
    console.log(`📝 [VocabSRS]`, message, ...args);
  }

  static error(message, ...args) {
    console.error(`❌ [VocabSRS]`, message, ...args);
  }

  static warn(message, ...args) {
    console.warn(`⚠️ [VocabSRS]`, message, ...args);
  }

  static info(message, ...args) {
    console.info(`ℹ️ [VocabSRS]`, message, ...args);
  }
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.DateUtils = DateUtils;
  window.TextUtils = TextUtils;
  window.IDUtils = IDUtils;
  window.Logger = Logger;
}
