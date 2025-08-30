// Vocabulary storage operations using IndexedDB
// This file should be loaded after indexeddb.js

// Wait for IndexedDB to be available
function waitForIndexedDB() {
  return new Promise((resolve) => {
    if (window.indexedDBManager && window.indexedDBManager.isInitialized) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (window.indexedDBManager && window.indexedDBManager.isInitialized) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    }
  });
}

const VocabStorage = {
  VOCAB_KEY: "vocab_words",

  async getAllWords() {
    await waitForIndexedDB();
    try {
      const words = await window.indexedDBManager.getAll('vocabWords');
      return Array.isArray(words) ? words : [];
    } catch (error) {
      console.error('Error getting all words:', error);
      return [];
    }
  },

  async addWord(wordData) {
    await waitForIndexedDB();
    const words = await this.getAllWords();
    const normalizedInput = window.TextUtils.sanitizeText(wordData.word.toLowerCase());
    const exists = words.some(w => window.TextUtils.sanitizeText(w.word.toLowerCase()) === normalizedInput);
    if (exists) throw new Error(`"${wordData.word}" already exists in your dictionary`);

    const newWord = {
      id: wordData.id || window.IDUtils.generateUUID(),
      word: window.TextUtils.formatDisplayText(wordData.word),
      meaning: wordData.meaning || "",
      example: wordData.example || "",
      phonetic: wordData.phonetic || "",
      audioUrl: wordData.audioUrl || null,
      wordType: window.TextUtils.isPhrase(wordData.word) ? "phrase" : "word",
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

    try {
      await window.indexedDBManager.add('vocabWords', newWord);
      return newWord;
    } catch (error) {
      console.error('Error adding word to IndexedDB:', error);
      throw error;
    }
  },

  async updateWord(id, updates) {
    await waitForIndexedDB();
    const words = await this.getAllWords();
    const idx = words.findIndex(w => w.id === id);
    if (idx === -1) throw new Error("Word not found");
    
    const updatedWord = { ...words[idx], ...updates, lastModified: window.DateUtils.now() };
    await window.indexedDBManager.set('vocabWords', updatedWord);
    return updatedWord;
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

