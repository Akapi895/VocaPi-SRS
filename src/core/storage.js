// Vocabulary storage operations using Chrome Storage only
const VocabStorage = {
  VOCAB_KEY: "vocab_words",

  async getAllWords() {
    try {
      // Luôn dùng Chrome Storage
      const response = await chrome.runtime.sendMessage({ action: 'getWords' });
      if (response && response.success) {
        const words = response.words || [];

        return words;
      }

      return [];
    } catch (error) {
      console.error('VocabStorage: Error getting words:', error);
      return [];
    }
  },

  async addWord(wordData) {

    
    try {
      // Validate required fields
      if (!wordData.word || !wordData.meaning) {
        throw new Error('Word and meaning are required');
      }

      // Gửi trực tiếp đến service worker để lưu vào Chrome Storage
      const response = await chrome.runtime.sendMessage({ 
        action: 'saveWord', 
        data: wordData 
      });
      
      if (response && response.success) {

        return response.word;
      } else {
        throw new Error(response?.error || 'Failed to save word');
      }
      
    } catch (error) {
      console.error('❌ [VocabStorage] Error in addWord:', error);
      throw error;
    }
  },

  async updateWord(id, updates) {
    try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Service worker timeout')), 5000);
        });
        
        const messagePromise = chrome.runtime.sendMessage({ 
            action: 'updateWord', 
            id, 
            updates 
        });
        
        const response = await Promise.race([messagePromise, timeoutPromise]);
        
        if (response && response.success) {

            return response.word;
        } else {
            throw new Error(response?.error || 'Failed to update word');
        }
        
    } catch (error) {
        console.error('❌ [VocabStorage] Error updating word:', error);
        throw error;
    }
  },

  async removeWord(id) {
    try {
      // Gửi đến service worker để xóa
      const response = await chrome.runtime.sendMessage({ 
        action: 'deleteWord', 
        wordId: id 
      });
      
      if (response && response.success) {

        return true;
      } else {
        throw new Error(response?.error || 'Failed to remove word');
      }
      
    } catch (error) {
      console.error('❌ [VocabStorage] Error removing word:', error);
      throw error;
    }
  },

  async getWord(id) {
    try {
      const allWords = await this.getAllWords();
      const word = allWords.find(w => w.id === id);
      
      if (word) {

        return word;
      } else {

        return null;
      }
      
    } catch (error) {
      console.error('VocabStorage: Error getting word:', error);
      return null;
    }
  },

  async getDueWords() {
    try {
      const allWords = await this.getAllWords();
      const now = Date.now();
      
      const dueWords = allWords
          .filter(w => {
              try {
                  if (!w.srs || !w.srs.nextReview) return true;
                  const time = typeof w.srs.nextReview === "string" ? new Date(w.srs.nextReview).getTime() : w.srs.nextReview;
                  return now >= time;
              } catch (dateError) {
                  console.warn('⚠️ [VocabStorage] Date parsing error for word:', w?.word, dateError);
                  return true; // Treat as due if date parsing fails
              }
          })
          .sort((a, b) => {
              // Sort by nextReview: earliest first (most urgent)
              const aTime = a.srs?.nextReview ? 
                  (typeof a.srs.nextReview === "string" ? new Date(a.srs.nextReview).getTime() : a.srs.nextReview) : 0;
              const bTime = b.srs?.nextReview ? 
                  (typeof b.srs.nextReview === "string" ? new Date(b.srs.nextReview).getTime() : b.srs.nextReview) : 0;
              
              // If both have nextReview, sort by time (earliest first)
              if (aTime > 0 && bTime > 0) {
                  return aTime - bTime;
              }
              
              // If only one has nextReview, prioritize the one without (new words)
              if (aTime === 0 && bTime > 0) return -1;
              if (aTime > 0 && bTime === 0) return 1;
              
              // If neither has nextReview, sort by creation date (newest first)
              const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return bCreated - aCreated;
          });
      
      return dueWords;
        
    } catch (error) {
        console.error('❌ [VocabStorage] Error getting due words:', error);
        return [];
    }
}
};

const GamificationStorage = {
  KEY: "vocabGamification",

  async getData() {
    try {
      const result = await chrome.storage.local.get(['vocabGamification']);
      return result.vocabGamification || null;
    } catch (error) {
      console.error('❌ [GamificationStorage] Error getting data:', error);
      return null;
    }
  },

  async saveData(data) {
    try {
      await chrome.storage.local.set({ vocabGamification: data });
      return true;
    } catch (error) {
      console.error('❌ [GamificationStorage] Error saving data:', error);
      throw error;
    }
  },

  async clear() {
    try {
      await chrome.storage.local.remove(['vocabGamification']);
    } catch (error) {
      console.error('❌ [GamificationStorage] Error clearing data:', error);
    }
  }
};

const AnalyticsStorage = {
  KEY: "vocabAnalytics",

  async getData() {
    try {
      const result = await chrome.storage.local.get(['vocabAnalytics']);
      return result.vocabAnalytics || null;
    } catch (error) {
      console.error('❌ [AnalyticsStorage] Error getting data:', error);
      return null;
    }
  },

  async saveData(data) {
    try {
      if (!data || typeof data !== 'object') {
        console.error('Invalid data for saveData:', data);
        throw new Error('Data must be an object');
      }
      
      await chrome.storage.local.set({ vocabAnalytics: data });
      
      // Verify save
      const result = await chrome.storage.local.get(['vocabAnalytics']);
      
      return true;
    } catch (error) {
      console.error('AnalyticsStorage: Error saving data:', error);
      throw error;
    }
  },

  async clear() {
    try {
      await chrome.storage.local.remove(['vocabAnalytics']);
    } catch (error) {
      console.error('❌ [AnalyticsStorage] Error clearing data:', error);
    }
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.VocabStorage = VocabStorage;
  window.GamificationStorage = GamificationStorage;
  window.AnalyticsStorage = AnalyticsStorage;
}

