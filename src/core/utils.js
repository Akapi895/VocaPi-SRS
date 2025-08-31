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


// Export for use in other files
if (typeof window !== 'undefined') {
  window.IDUtils = IDUtils;
}
