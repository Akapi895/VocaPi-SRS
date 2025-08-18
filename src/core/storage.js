import { DateUtils } from "./date.js";

// Storage wrapper with sync/local fallback
const StorageManager = {
  async get(key) {
    try {
      // Check if chrome.storage is available
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage not available');
        return undefined;
      }
      
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
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          const localResult = await chrome.storage.local.get(key);
          return localResult[key];
        }
      } catch (localError) {
        console.error('Local storage also failed:', localError);
      }
      return undefined;
    }
  },
  
  async set(key, value) {
    try {
      // Check if chrome.storage is available
      if (typeof chrome === 'undefined' || !chrome.storage) {
        throw new Error('Chrome storage not available');
      }
      
      // Try sync storage first (has quota limits)
      await chrome.storage.sync.set({ [key]: value });
      return true;
    } catch (error) {
      console.warn('Sync storage failed, using local storage:', error);
      // Fallback to local storage
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          await chrome.storage.local.set({ [key]: value });
          return true;
        } else {
          throw new Error('Local storage also not available');
        }
      } catch (localError) {
        console.error('Local storage also failed:', localError);
        throw localError;
      }
    }
  },
  
  async remove(key) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
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
      } else {
        throw new Error('Chrome storage not available');
      }
    } catch (error) {
      console.error('Storage remove failed:', error);
      throw error;
    }
  },
  
  async clear() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
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
      } else {
        throw new Error('Chrome storage not available');
      }
    } catch (error) {
      console.error('Storage clear failed:', error);
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
      return Array.isArray(words) ? words : [];
    } catch (error) {
      console.error('Error getting all words:', error);
      return [];
    }
  },
  
  async addWord(wordData) {
    try {
      const words = await this.getAllWords();
      
      // Enhanced duplicate checking for both words and phrases
      const normalizedInput = TextUtils.sanitizeText(wordData.word.toLowerCase());
      const existingWord = words.find(w => {
        const existingNormalized = TextUtils.sanitizeText(w.word.toLowerCase());
        return existingNormalized === normalizedInput;
      });
      
      if (existingWord) {
        throw new Error(`"${wordData.word}" already exists in your dictionary`);
      }
      
      // Create word object preserving all provided data
      const newWord = {
        id: wordData.id || generateUUID(),
        word: TextUtils.formatDisplayText(wordData.word), // Format for display
        meaning: wordData.meaning || '',
        example: wordData.example || '',
        phonetic: wordData.phonetic || '',
        audioUrl: wordData.audioUrl || null,
        
        // Enhanced metadata
        wordType: TextUtils.isPhrase(wordData.word) ? 'phrase' : 'word',
        wordCount: TextUtils.countWords(wordData.word),
        
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
      
      words[wordIndex] = { ...words[wordIndex], ...updates, lastModified: DateUtils.now() };
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
  
  async getWord(wordId) {
    try {
      const words = await this.getAllWords();
      return words.find(w => w.id === wordId) || null;
    } catch (error) {
      console.error('Error getting word:', error);
      return null;
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

if (typeof window !== "undefined") {
  window.StorageManager = StorageManager;
  window.VocabStorage = VocabStorage;
}

export { StorageManager, VocabStorage };
