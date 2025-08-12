// Utility functions for Vocab SRS Extension

// Generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Date utilities
const DateUtils = {
  now() {
    return new Date().to// Time formatting utilities for SRS
const TimeUtils = {
  formatTimeUntilReview(nextReview) {
    if (!nextReview) return 'Ready now';
    
    const now = Date.now();
    const nextReviewTime = typeof nextReview === 'string' 
      ? new Date(nextReview).getTime() 
      : nextReview;
    
    if (nextReviewTime <= now) return 'Ready now';
    
    const diffMs = nextReviewTime - now;
    const minutes = Math.ceil(diffMs / (1000 * 60));
    
    return this.formatInterval(minutes);
  },
  
  formatInterval(minutes) {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes < 1440) { // Less than 1 day
      const hours = Math.round((minutes / 60) * 10) / 10;
      return `${hours} hours`;
    } else if (minutes < 10080) { // Less than 1 week  
      const days = Math.round((minutes / 1440) * 10) / 10;
      return `${days} days`;
    } else if (minutes < 43200) { // Less than 1 month
      const weeks = Math.round((minutes / 10080) * 10) / 10;
      return `${weeks} weeks`;
    } else {
      const months = Math.round((minutes / 43200) * 10) / 10;
      return `${months} months`;
    }
  },
  
  isCardDue(card) {
    if (!card.srs || !card.srs.nextReview) return true;
    
    const now = Date.now();
    const nextReviewTime = typeof card.srs.nextReview === 'string'
      ? new Date(card.srs.nextReview).getTime()
      : card.srs.nextReview;
      
    return now >= nextReviewTime;
  }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.VocabUtils = {
    generateUUID,
    DateUtils,
    StorageManager,
    VocabStorage,
    SRSAlgorithm,
    TextUtils,
    TimeUtils
  };
};
  },
  
  today() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  },
  
  addDays(dateStr, days) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  },
  
  isPastDue(dateStr) {
    return new Date(dateStr) <= new Date();
  },
  
  formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString();
  }
};

// Storage wrapper with sync/local fallback
const StorageManager = {
  async get(key) {
    try {
      // Try sync storage first
      const syncResult = await chrome.storage.sync.get(key);
      if (syncResult[key] !== undefined) {
        return syncResult[key];
      }
      
      // Fallback to local storage
      const localResult = await chrome.storage.local.get(key);
      return localResult[key];
    } catch (error) {
      console.error('Storage get error:', error);
      // Fallback to local storage
      const localResult = await chrome.storage.local.get(key);
      return localResult[key];
    }
  },
  
  async set(key, value) {
    try {
      // Try sync storage first (has quota limits)
      await chrome.storage.sync.set({ [key]: value });
      return true;
    } catch (error) {
      console.warn('Sync storage failed, using local storage:', error);
      // Fallback to local storage
      try {
        await chrome.storage.local.set({ [key]: value });
        return true;
      } catch (localError) {
        console.error('Local storage also failed:', localError);
        throw localError;
      }
    }
  },
  
  async remove(key) {
    try {
      await chrome.storage.sync.remove(key);
    } catch (error) {
      console.warn('Sync storage remove failed:', error);
    }
    
    try {
      await chrome.storage.local.remove(key);
    } catch (error) {
      console.error('Local storage remove failed:', error);
      throw error;
    }
  },
  
  async clear() {
    try {
      await chrome.storage.sync.clear();
    } catch (error) {
      console.warn('Sync storage clear failed:', error);
    }
    
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('Local storage clear failed:', error);
      throw error;
    }
  }
};

// Vocabulary storage operations
const VocabStorage = {
  VOCAB_KEY: 'vocab_words',
  
  async getAllWords() {
    try {
      const words = await StorageManager.get(this.VOCAB_KEY);
      return words || [];
    } catch (error) {
      console.error('Error getting all words:', error);
      return [];
    }
  },
  
  async addWord(wordData) {
    try {
      const words = await this.getAllWords();
      
      // Enhanced duplicate checking for both words and phrases
      const normalizedInput = window.VocabUtils.TextUtils.sanitizeText(wordData.word.toLowerCase());
      const existingWord = words.find(w => {
        const existingNormalized = window.VocabUtils.TextUtils.sanitizeText(w.word.toLowerCase());
        return existingNormalized === normalizedInput;
      });
      
      if (existingWord) {
        throw new Error(`"${wordData.word}" already exists in your dictionary`);
      }
      
      // Create word object preserving all provided data
      const newWord = {
        id: wordData.id || generateUUID(),
        word: window.VocabUtils.TextUtils.formatDisplayText(wordData.word), // Format for display
        meaning: wordData.meaning || '',
        example: wordData.example || '',
        phonetic: wordData.phonetic || '',
        audioUrl: wordData.audioUrl || null,
        
        // Enhanced metadata
        wordType: window.VocabUtils.TextUtils.isPhrase(wordData.word) ? 'phrase' : 'word',
        wordCount: window.VocabUtils.TextUtils.countWords(wordData.word),
        
        // Preserve or create SRS data
        srs: wordData.srs && typeof wordData.srs === 'object' ? {
          easiness: wordData.srs.easiness || 2.5,
          interval: wordData.srs.interval || 0,
          repetitions: wordData.srs.repetitions || 0,
          nextReview: wordData.srs.nextReview || DateUtils.now()
        } : {
          easiness: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: DateUtils.now()
        },
        
        // Preserve metadata
        createdAt: wordData.createdAt || DateUtils.now(),
        lastModified: DateUtils.now(),
        tags: wordData.tags || [],
        difficulty: wordData.difficulty || 'medium',
        source: wordData.source || 'manual'
      };
      
      console.log('Adding word to storage:', newWord);
      
      words.push(newWord);
      await StorageManager.set(this.VOCAB_KEY, words);
      
      console.log('Word added successfully:', newWord.word);
      return newWord;
    } catch (error) {
      console.error('Error adding word:', error);
      throw error;
    }
  },
  
  async updateWord(wordId, updates) {
    try {
      const words = await this.getAllWords();
      const wordIndex = words.findIndex(w => w.id === wordId);
      
      if (wordIndex === -1) {
        throw new Error('Word not found');
      }
      
      words[wordIndex] = { ...words[wordIndex], ...updates };
      await StorageManager.set(this.VOCAB_KEY, words);
      return words[wordIndex];
    } catch (error) {
      console.error('Error updating word:', error);
      throw error;
    }
  },
  
  async removeWord(wordId) {
    try {
      const words = await this.getAllWords();
      const filteredWords = words.filter(w => w.id !== wordId);
      await StorageManager.set(this.VOCAB_KEY, filteredWords);
      return true;
    } catch (error) {
      console.error('Error removing word:', error);
      throw error;
    }
  },
  
  async getDueWords() {
    try {
      const words = await this.getAllWords();
      const now = Date.now(); // Use millisecond timestamp for precision
      
      return words.filter(word => {
        if (!word.srs || !word.srs.nextReview) {
          return true; // New words are always due
        }
        
        // Support both ISO string and timestamp
        const nextReviewTime = typeof word.srs.nextReview === 'string' 
          ? new Date(word.srs.nextReview).getTime()
          : word.srs.nextReview;
          
        return now >= nextReviewTime;
      }).sort((a, b) => {
        // Sort by next review time (earliest first)
        const aTime = a.srs?.nextReview ? 
          (typeof a.srs.nextReview === 'string' ? new Date(a.srs.nextReview).getTime() : a.srs.nextReview) : 0;
        const bTime = b.srs?.nextReview ? 
          (typeof b.srs.nextReview === 'string' ? new Date(b.srs.nextReview).getTime() : b.srs.nextReview) : 0;
        return aTime - bTime;
      });
    } catch (error) {
      console.error('Error getting due words:', error);
      return [];
    }
  }
};

// Enhanced SRS (Spaced Repetition System) Algorithm
const SRSAlgorithm = {
  updateCard(srsData, quality, options = {}) {
    try {
      let updatedSRS;
      
      // Use advanced SRS algorithm if available and explicitly requested
      if (window.AdvancedSRSAlgorithm && options.useAdvanced === true) {
        const advancedSRS = new window.AdvancedSRSAlgorithm();
        const cardData = { 
          srs: srsData, 
          category: options.category,
          difficulty: options.difficulty,
          reviewHistory: options.reviewHistory || []
        };
        
        updatedSRS = advancedSRS.calculateNextReview(
          cardData, 
          quality, 
          options.responseTime, 
          options.userStats || {}
        );
        
        // Convert nextReview from timestamp to ISO string if needed
        if (typeof updatedSRS.nextReview === 'number') {
          updatedSRS.nextReview = new Date(updatedSRS.nextReview).toISOString();
        }
      } else {
        // Use fallback SM-2 algorithm
        updatedSRS = this.fallbackSM2Algorithm(srsData, quality);
      }
      
      // Ensure all required fields exist with proper types
      return this.normalizeSRSData(updatedSRS);
      
    } catch (error) {
      console.error('SRS algorithm error:', error);
      // Fallback to basic SM-2 if advanced fails
      return this.fallbackSM2Algorithm(srsData, quality);
    }
  },
  
  fallbackSM2Algorithm(srsData, quality) {
    // Clone the SRS data to avoid mutation
    const updatedSRS = { ...srsData };
    
    // Ensure required fields exist
    updatedSRS.repetitions = updatedSRS.repetitions || 0;
    updatedSRS.interval = updatedSRS.interval || 10; // Start with 10 minutes
    updatedSRS.easiness = updatedSRS.easiness || 2.5;
    updatedSRS.intervalUnit = updatedSRS.intervalUnit || 'minutes'; // Support minute-level precision
    
    // Enhanced SM-2 Algorithm with minute-level intervals
    if (quality >= 3) {
      // Successful review
      if (updatedSRS.repetitions === 0) {
        // First success: 1 hour based on quality
        updatedSRS.interval = quality === 5 ? 120 : quality === 4 ? 60 : 30; // 30min-2hrs
      } else if (updatedSRS.repetitions === 1) {
        // Second success: 6-12 hours based on quality  
        updatedSRS.interval = quality === 5 ? 720 : quality === 4 ? 480 : 360; // 6-12hrs
      } else if (updatedSRS.repetitions === 2) {
        // Third success: 1-2 days
        updatedSRS.interval = quality === 5 ? 2880 : quality === 4 ? 2160 : 1440; // 1-2 days in minutes
      } else {
        // Long-term: Use ease factor with minute precision
        updatedSRS.interval = Math.round(updatedSRS.interval * updatedSRS.easiness);
      }
      
      updatedSRS.repetitions += 1;
      updatedSRS.easiness = updatedSRS.easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      
      if (updatedSRS.easiness < 1.3) {
        updatedSRS.easiness = 1.3;
      }
    } else {
      // Failed review - progressive minute-based recovery
      updatedSRS.repetitions = 0;
      if (quality <= 1) {
        updatedSRS.interval = 10; // 10 minutes for complete failure
      } else if (quality === 2) {
        updatedSRS.interval = 30; // 30 minutes for partial failure  
      }
      updatedSRS.easiness = Math.max(1.3, updatedSRS.easiness - 0.2);
    }
    
    // Apply reasonable limits
    updatedSRS.interval = Math.max(10, updatedSRS.interval); // Minimum 10 minutes
    updatedSRS.interval = Math.min(525600, updatedSRS.interval); // Maximum 1 year in minutes
    
    // Set next review with minute precision
    const nextReviewTime = new Date(Date.now() + updatedSRS.interval * 60 * 1000);
    updatedSRS.nextReview = nextReviewTime.toISOString();
    
    return updatedSRS;
  },
  
  normalizeSRSData(srsData) {
    const normalized = {
      repetitions: Math.max(0, Math.floor(srsData.repetitions || 0)),
      interval: Math.max(1, Math.floor(srsData.interval || 1)),
      easiness: Math.max(1.3, Math.min(2.5, parseFloat(srsData.easiness || 2.5))),
      nextReview: srsData.nextReview || DateUtils.addDays(DateUtils.today(), 1),
      lastReviewedAt: srsData.lastReviewedAt || Date.now(),
      totalReviews: Math.max(0, Math.floor(srsData.totalReviews || 0)),
      reviewHistory: Array.isArray(srsData.reviewHistory) ? srsData.reviewHistory : []
    };
    
    // Ensure nextReview is ISO string format
    if (typeof normalized.nextReview === 'number') {
      normalized.nextReview = new Date(normalized.nextReview).toISOString();
    }
    
    // Ensure lastReviewedAt is a timestamp
    if (typeof normalized.lastReviewedAt === 'string') {
      normalized.lastReviewedAt = new Date(normalized.lastReviewedAt).getTime();
    }
    
    return normalized;
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
    TextUtils
  };
}
