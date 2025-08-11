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
    return new Date().toISOString();
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
      
      // Check for duplicates
      const existingWord = words.find(w => w.word.toLowerCase() === wordData.word.toLowerCase());
      if (existingWord) {
        throw new Error('Word already exists in your dictionary');
      }
      
      // Create word object with SRS data
      const newWord = {
        id: generateUUID(),
        word: wordData.word,
        meaning: wordData.meaning,
        example: wordData.example || '',
        phonetic: wordData.phonetic || '',
        audioUrl: wordData.audioUrl || '',
        createdAt: DateUtils.now(),
        srs: {
          easiness: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: DateUtils.now()
        }
      };
      
      words.push(newWord);
      await StorageManager.set(this.VOCAB_KEY, words);
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
      const now = DateUtils.now();
      return words.filter(word => DateUtils.isPastDue(word.srs.nextReview))
                 .sort((a, b) => new Date(a.srs.nextReview) - new Date(b.srs.nextReview));
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
    updatedSRS.interval = updatedSRS.interval || 1;
    updatedSRS.easiness = updatedSRS.easiness || 2.5;
    
    // SM-2 Algorithm implementation
    if (quality >= 3) {
      // Successful review
      if (updatedSRS.repetitions === 0) {
        updatedSRS.interval = 1;
      } else if (updatedSRS.repetitions === 1) {
        updatedSRS.interval = 6;
      } else {
        updatedSRS.interval = Math.round(updatedSRS.interval * updatedSRS.easiness);
      }
      
      updatedSRS.repetitions += 1;
      updatedSRS.easiness = updatedSRS.easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      
      if (updatedSRS.easiness < 1.3) {
        updatedSRS.easiness = 1.3;
      }
    } else {
      // Failed review
      updatedSRS.repetitions = 0;
      updatedSRS.interval = 1;
    }
    
    // Set next review date as ISO string
    updatedSRS.nextReview = DateUtils.addDays(DateUtils.today(), updatedSRS.interval);
    
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
  isValidSingleWord(text) {
    if (!text || text.length === 0) return false;
    
    // Check for single word (no spaces, only letters and common word characters)
    const wordPattern = /^[a-zA-Z]+(?:[''-][a-zA-Z]+)*$/;
    const words = text.split(/\s+/);
    
    return words.length === 1 && wordPattern.test(words[0]);
  },
  
  sanitizeWord(word) {
    return word.trim().toLowerCase();
  },
  
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
