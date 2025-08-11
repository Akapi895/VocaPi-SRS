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

// SRS (Spaced Repetition System) Algorithm - SM-2
const SRSAlgorithm = {
  updateCard(srsData, quality) {
    // Clone the SRS data to avoid mutation
    const updatedSRS = { ...srsData };
    
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
    
    // Set next review date
    updatedSRS.nextReview = DateUtils.addDays(DateUtils.today(), updatedSRS.interval);
    
    return updatedSRS;
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
