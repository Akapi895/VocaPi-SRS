// Vocabulary storage operations using IndexedDB
// This file should be loaded after indexeddb.js

// Wait for IndexedDB to be available
function waitForIndexedDB() {
  return new Promise((resolve, reject) => {
    // Check if already initialized
    if (window.indexedDBManager && window.indexedDBManager.isInitialized) {
      console.log("✅ IndexedDB already initialized");
      resolve();
      return;
    }

    // Add timeout to prevent infinite waiting
    const timeout = setTimeout(() => {
      console.error("❌ IndexedDB initialization timeout after 10 seconds");
      reject(new Error("IndexedDB initialization timeout"));
    }, 10000);

    let attempts = 0;
    const maxAttempts = 100; // 10 seconds with 100ms intervals
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (window.indexedDBManager && window.indexedDBManager.isInitialized) {
        clearInterval(checkInterval);
        clearTimeout(timeout);
        console.log("✅ IndexedDB initialized successfully");
        resolve();
      } else if (window.indexedDBManager) {
        console.log(`⏳ Waiting for IndexedDB to initialize... (attempt ${attempts}/${maxAttempts})`);
        
        // Try to initialize manually after a few attempts
        if (attempts === 5) {
          try {
            console.log("🔄 Attempting manual IndexedDB initialization...");
            window.indexedDBManager.init().then(() => {
              clearInterval(checkInterval);
              clearTimeout(timeout);
              console.log("✅ IndexedDB manually initialized");
              resolve();
            }).catch(error => {
              console.error("❌ Manual IndexedDB init failed:", error);
            });
          } catch (error) {
            console.error("❌ Error calling IndexedDB init:", error);
          }
        }
      } else {
        console.log(`⏳ IndexedDBManager not found, waiting... (attempt ${attempts}/${maxAttempts})`);
      }
      
      // Stop checking after max attempts
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        clearTimeout(timeout);
        console.error("❌ Max attempts reached, IndexedDB not available");
        reject(new Error("IndexedDB not available after maximum attempts"));
      }
    }, 100);
  });
}

const VocabStorage = {
  VOCAB_KEY: "vocab_words",

  // Method to check IndexedDB status
  getIndexedDBStatus() {
    return {
      indexedDBManagerExists: !!window.indexedDBManager,
      indexedDBManagerType: typeof window.indexedDBManager,
      isInitialized: window.indexedDBManager?.isInitialized || false,
      hasInitMethod: typeof window.indexedDBManager?.init === 'function'
    };
  },

  async getAllWords() {
    try {
      await waitForIndexedDB();
      const words = await window.indexedDBManager.getAll('vocabWords');
      return Array.isArray(words) ? words : [];
    } catch (error) {
        console.error('❌ IndexedDB failed, falling back to Chrome Storage:', error);
        
        // Fallback to Chrome Storage
        try {
          const response = await chrome.runtime.sendMessage({ action: 'getWords' });
          if (response && response.success) {
              return response.words || [];
            }
        } catch (fallbackError) {
          console.error('❌ Chrome Storage fallback also failed:', fallbackError);
        }
        
      return [];
    }
  },

  async addWord(wordData) {
    console.log("🔍 VocabStorage.addWord called with:", wordData);
    
    try {
      console.log("⏳ Waiting for IndexedDB...");
      await waitForIndexedDB();
      console.log("✅ IndexedDB ready, getting all words...");
      
      const words = await this.getAllWords();
      console.log("✅ Got all words, count:", words.length);
      
      const normalizedInput = window.TextUtils.sanitizeText(wordData.word.toLowerCase());
      console.log("✅ Text sanitized:", normalizedInput);
      
      const exists = words.some(w => window.TextUtils.sanitizeText(w.word.toLowerCase()) === normalizedInput);
      if (exists) throw new Error(`"${wordData.word}" already exists in your dictionary`);
      console.log("✅ Word doesn't exist, creating new word...");

      const newWord = {
        id: wordData.id || window.IDUtils.generateUUID(),
        word: window.TextUtils.formatDisplayText(wordData.word),
        meaning: wordData.meaning || "",
        example: wordData.example || "",
        phonetic: wordData.phonetic || "",
        audioUrl: wordData.audioUrl || null,
        wordType: wordData.wordType || (window.TextUtils.isPhrase(wordData.word) ? "phrase" : "word"),
        wordCount: window.TextUtils.countWords(wordData.word),
        srs: wordData.srs && typeof wordData.srs === "object"
          ? {
              easeFactor: wordData.srs.easeFactor || 2.5,
              interval: wordData.srs.interval || 0,
              repetitions: wordData.srs.repetitions || 0,
              nextReview: wordData.srs.nextReview || window.DateUtils.now()
            }
          : { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: window.DateUtils.now() },
        createdAt: wordData.createdAt || window.DateUtils.now(),
        lastModified: window.DateUtils.now(),
        tags: wordData.tags || [],
        difficulty: wordData.difficulty || "medium",
        source: wordData.source || "manual"
      };
      
      console.log("✅ New word object created:", newWord);
      console.log("⏳ Adding to IndexedDB...");

      try {
        const result = await window.indexedDBManager.add('vocabWords', newWord);
        console.log("✅ Word added to IndexedDB, result:", result);
        return newWord;
      } catch (indexedDBError) {
        console.warn("⚠️ IndexedDB failed, falling back to localStorage:", indexedDBError);
        
        // Fallback to localStorage
        const existingWords = JSON.parse(localStorage.getItem('vocabWords') || '[]');
        existingWords.push(newWord);
        localStorage.setItem('vocabWords', JSON.stringify(existingWords));
        console.log("✅ Word saved to localStorage fallback");
        return newWord;
      }
      
    } catch (error) {
      console.error('❌ Error in VocabStorage.addWord:', error);
      
      // Final fallback - try to save to localStorage directly
      try {
        const newWord = {
          id: wordData.id || window.IDUtils.generateUUID(),
          word: wordData.word,
          meaning: wordData.meaning || "",
          example: wordData.example || "",
          phonetic: wordData.phonetic || "",
          audioUrl: wordData.audioUrl || null,
          wordType: wordData.wordType || "word",
          wordCount: 1,
          srs: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: new Date().toISOString() },
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          tags: [],
          difficulty: "medium",
          source: "manual"
        };
        
        const existingWords = JSON.parse(localStorage.getItem('vocabWords') || '[]');
        existingWords.push(newWord);
        localStorage.setItem('vocabWords', JSON.stringify(existingWords));
        console.log("✅ Word saved to localStorage as final fallback");
        return newWord;
      } catch (fallbackError) {
        console.error('❌ All fallbacks failed:', fallbackError);
        throw error; // Throw original error
      }
    }
  },

  async updateWord(id, updates) {
    try {
        console.log(' Updating word with id:', id);
        console.log(' Updates:', updates);
        
        await waitForIndexedDB();
        const words = await this.getAllWords();
        console.log('📚 Total words in IndexedDB:', words.length);
        
        // Search by id in IndexedDB
        const idx = words.findIndex(w => w.id === id);
        if (idx === -1) {
            console.log('⚠️ Word not found in IndexedDB, trying Chrome Storage fallback...');
            
            // Fallback to Chrome Storage
            try {
                const response = await chrome.runtime.sendMessage({ action: 'getWords' });
                if (response && response.success && response.words.length > 0) {
                    const chromeWords = response.words;
                    console.log('📚 Found words in Chrome Storage:', chromeWords.length);
                    
                    // Find word in Chrome Storage
                    const chromeWord = chromeWords.find(w => w.id === id);
                    if (chromeWord) {
                        console.log('✅ Found word in Chrome Storage, updating there...');
                        
                        // Update word in Chrome Storage
                        const updatedChromeWords = chromeWords.map(w => 
                            w.id === id ? { ...w, ...updates, lastModified: window.DateUtils.now() } : w
                        );
                        
                        // Save back to Chrome Storage
                        await chrome.runtime.sendMessage({ 
                            action: 'saveAllWords', 
                            words: updatedChromeWords 
                        });
                        
                        console.log('✅ Word updated in Chrome Storage successfully');
                        
                        // Try to sync to IndexedDB
                        try {
                            await window.indexedDBManager.set('vocabWords', { ...chromeWord, ...updates, lastModified: window.DateUtils.now() });
                            console.log('✅ Word also synced to IndexedDB');
                        } catch (indexedDBError) {
                            console.warn('⚠️ Failed to sync to IndexedDB:', indexedDBError);
                        }
                        
                        return { ...chromeWord, ...updates, lastModified: window.DateUtils.now() };
                    } else {
                        throw new Error(`Word not found in Chrome Storage either: ${id}`);
                    }
                } else {
                    throw new Error('No words found in Chrome Storage');
                }
            } catch (chromeError) {
                console.error('❌ Chrome Storage fallback failed:', chromeError);
                throw new Error(`Word not found by id: ${id}`);
            }
        }
        
        // Update in IndexedDB
        const updatedWord = { ...words[idx], ...updates, lastModified: window.DateUtils.now() };
        await window.indexedDBManager.set('vocabWords', updatedWord);
        console.log('✅ Word updated successfully in IndexedDB:', updatedWord);
        return updatedWord;
    } catch (error) {
        console.error('❌ Error updating word:', error);
        throw error;
    }
  },

  async removeWord(id) {
    await waitForIndexedDB();
    try {
      await window.indexedDBManager.remove('vocabWords', id);
      return true;
    } catch (error) {
      console.error('Error removing word:', error);
      throw error;
    }
  },

  async getWord(id) {
    await waitForIndexedDB();
    try {
      return await window.indexedDBManager.get('vocabWords', id);
    } catch (error) {
      console.error('Error getting word:', error);
      return null;
    }
  },

  async getDueWords() {
    await waitForIndexedDB();
    const words = await this.getAllWords();
    const now = Date.now();
    return words
      .filter(w => {
        const nr = w.srs?.nextReview;
        if (!nr) return true;
        const time = typeof nr === "string" ? new Date(nr).getTime() : nr;
        return now >= time;
      })
      .sort((a, b) => {
        const at = a.srs?.nextReview ? (typeof a.srs.nextReview === "string" ? new Date(a.srs.nextReview).getTime() : a.srs.nextReview) : 0;
        const bt = b.srs?.nextReview ? (typeof b.srs.nextReview === "string" ? new Date(b.srs.nextReview).getTime() : b.srs.nextReview) : 0;
        return at - bt;
      });
  }
};

const GamificationStorage = {
  KEY: "vocabGamification",

  async getData() {
    await waitForIndexedDB();
    try {
      const data = await window.indexedDBManager.getAll('gamification');
      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error getting gamification data:', error);
      return null;
    }
  },

  async saveData(data) {
    await waitForIndexedDB();
    try {
      await window.indexedDBManager.set('gamification', data);
      return true;
    } catch (error) {
      console.error('Error saving gamification data:', error);
      throw error;
    }
  },

  async clear() {
    await waitForIndexedDB();
    try {
      await window.indexedDBManager.clear('gamification');
    } catch (error) {
      console.error('Error clearing gamification data:', error);
    }
  }
};

const AnalyticsStorage = {
  KEY: "vocabAnalytics",

  async getData() {
    await waitForIndexedDB();
    try {
      const data = await window.indexedDBManager.getAll('analytics');
      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error getting analytics data:', error);
      return null;
    }
  },

  async saveData(data) {
    await waitForIndexedDB();
    try {
      await window.indexedDBManager.set('analytics', data);
      return true;
    } catch (error) {
      console.error('Error saving analytics data:', error);
      throw error;
    }
  },

  async clear() {
    await waitForIndexedDB();
    try {
      await window.indexedDBManager.clear('analytics');
    } catch (error) {
      console.error('Error clearing analytics data:', error);
    }
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.VocabStorage = VocabStorage;
  window.GamificationStorage = GamificationStorage;
  window.AnalyticsStorage = AnalyticsStorage;
}

