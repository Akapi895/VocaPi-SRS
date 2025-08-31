// Text utility functions
const TextUtils = {
  isValidWord(text) {
    if (!text) return false;
    const trimmed = text.trim();
    if (trimmed.length > 200) return false;
    if (!/[a-zA-Z]/.test(trimmed)) return false;
    return /^[a-zA-Z0-9\s''\-,.\(\)!?]+$/.test(trimmed);
  },
  isValidSingleWord(text) {
    if (!text) return false;
    const words = text.split(/\s+/);
    return words.length === 1 && /^[a-zA-Z]+(?:[''-][a-zA-Z]+)*$/.test(words[0]);
  },
  isPhrase(text) { return !!text && text.trim().split(/\s+/).length > 1; },
  countWords(text) { return text ? text.trim().split(/\s+/).length : 0; },
  sanitizeText(text) { return text.trim().replace(/\s+/g, " "); },
  sanitizeWord(word) { return word.trim().toLowerCase(); },
  capitalizeFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); },
  formatDisplayText(text) {
    if (!text) return "";
    const trimmed = this.sanitizeText(text);
    if (!this.isPhrase(trimmed)) return this.capitalizeFirst(trimmed.toLowerCase());
    return trimmed.replace(/^\w|\.\s+\w/g, l => l.toUpperCase());
  },
  // Thêm method cleanText để tương thích với addModal.js
  cleanText(text) {
    return text.trim();
  }
};

// Expose to window for content scripts
if (typeof window !== 'undefined') {
  window.TextUtils = TextUtils;
  console.log("✅ TextUtils exposed to window");
}

// No export needed for content scripts
