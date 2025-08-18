// Utility functions for Vocab SRS Extension
const {
  AdvancedSRSAlgorithm,
  scheduleNextReview,
  TimeUtils: SRSTimeUtils,
  calculateForgettingCurve,
  analyzeResponseTime,
  calculateQualityBonus,
  calculateConsistencyBonus
} = window.SRS || {};

const { StorageManager, VocabStorage } = window;
const { DateUtils } = window;

// Generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Enhanced SRS (Spaced Repetition System) Algorithm
const SRSAlgorithm = {
  updateCard(srsData, quality, options = {}) {
    try {
      if (options.useAdvanced) {
        const advanced = new AdvancedSRSAlgorithm();
        const card = {
          srs: srsData,
          category: options.category,
          difficulty: options.difficulty,
          reviewHistory: options.reviewHistory || []
        };
        let updated = advanced.calculateNextReview(
          card,
          quality,
          options.responseTime,
          options.userStats || {}
        );
        if (typeof updated.nextReview === "number") {
          updated.nextReview = new Date(updated.nextReview).toISOString();
        }
        return this.normalizeSRSData(updated);
      }
      return this.fallbackSM2Algorithm(srsData, quality);
    } catch (err) {
      console.error("SRSAlgorithm error:", err);
      return this.fallbackSM2Algorithm(srsData, quality);
    }
  },

  fallbackSM2Algorithm(srsData, quality) {
    let updated = { ...srsData };
    updated.repetitions = updated.repetitions || 0;
    updated.interval = updated.interval || 10;
    updated.easeFactor = updated.easeFactor || 2.5;

    if (quality >= 3) {
      updated.repetitions += 1;
      updated.interval = Math.round(updated.interval * updated.easeFactor);
      updated.easeFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
      if (updated.easeFactor < 1.3) updated.easeFactor = 1.3;
    } else {
      updated.repetitions = 0;
      updated.interval = quality <= 1 ? 10 : 30;
      updated.easeFactor = Math.max(1.3, updated.easeFactor - 0.2);
    }

    updated.interval = Math.max(10, Math.min(525600, updated.interval));
    updated.nextReview = new Date(Date.now() + updated.interval * 60000).toISOString();
    return updated;
  },

  normalizeSRSData(srs) {
    return {
      repetitions: Math.max(0, srs.repetitions || 0),
      interval: Math.max(1, srs.interval || 1),
      easeFactor: Math.max(1.3, Math.min(2.5, srs.easeFactor || 2.5)),
      nextReview: typeof srs.nextReview === "number"
        ? new Date(srs.nextReview).toISOString()
        : srs.nextReview,
      lastReviewedAt: srs.lastReviewedAt || Date.now(),
      totalReviews: Math.max(0, srs.totalReviews || 0),
      reviewHistory: Array.isArray(srs.reviewHistory) ? srs.reviewHistory : []
    };
  }
};

// Text validation utilities
const TextUtils = {
  isValidWord(text) {
    if (!text || text.length === 0) return false;
    
    // Support both single words and phrases
    const trimmedText = text.trim();
    
    // Basic validation: not empty, reasonable length, contains letters
    if (trimmedText.length > 200) return false; // Max phrase length
    if (!/[a-zA-Z]/.test(trimmedText)) return false; // Must contain letters
    
    // Allow letters, numbers, spaces, hyphens, apostrophes, commas, periods
    const phrasePattern = /^[a-zA-Z0-9\s''\-,.\(\)!?]+$/;
    return phrasePattern.test(trimmedText);
  },
  
  isValidSingleWord(text) {
    if (!text || text.length === 0) return false;
    
    // Check for single word (no spaces, only letters and common word characters)
    const wordPattern = /^[a-zA-Z]+(?:[''-][a-zA-Z]+)*$/;
    const words = text.split(/\s+/);
    
    return words.length === 1 && wordPattern.test(words[0]);
  },
  
  isPhrase(text) {
    if (!text) return false;
    const words = text.trim().split(/\s+/);
    return words.length > 1;
  },
  
  countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  },
  
  sanitizeText(text) {
    return text.trim().replace(/\s+/g, ' '); // Normalize whitespace
  },
  
  sanitizeWord(word) {
    return word.trim().toLowerCase();
  },
  
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  
  formatDisplayText(text) {
    // For display purposes - capitalize appropriately
    if (!text) return '';
    
    const trimmed = this.sanitizeText(text);
    
    // If it's a single word, just capitalize first letter
    if (!this.isPhrase(trimmed)) {
      return this.capitalizeFirst(trimmed.toLowerCase());
    }
    
    // For phrases, capitalize first letter of each sentence
    return trimmed.replace(/^\w|\.\s+\w/g, letter => letter.toUpperCase());
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.VocabUtils = {
    generateUUID,
    DateUtils,
    StorageManager,
    VocabStorage,
    SRSAlgorithm,
    TextUtils,
    SRSTimeUtils
  };
}

// Also export individual utilities for backward compatibility
if (typeof window !== 'undefined') {
  window.generateUUID = generateUUID;
  window.DateUtils = DateUtils;
  window.StorageManager = StorageManager;
  window.VocabStorage = VocabStorage;
  window.SRSAlgorithm = SRSAlgorithm;
  window.TextUtils = TextUtils;
  window.TimeUtils = SRSTimeUtils;
}
