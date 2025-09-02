class VocabAnalytics {
  constructor() {
    this.initialized = false;
    this.data = {
      wordsLearned: {},
      reviewSessions: [],
      dailyStats: {},
      totalWords: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastReviewDate: null,
      totalTimeSpent: 0,
      accuracyHistory: []
    };
    this.gamification = null;
  }

  async ensureInitialized() {
    if (this.initialized) return;
    
    try {
      console.log('🔄 Re-initializing analytics...');
      
      if (window.AnalyticsStorage) {
        // ✅ THÊM: Debug để kiểm tra tất cả storage
        const allStorage = await chrome.storage.local.get(null);
        console.log(' All Chrome storage keys:', Object.keys(allStorage));
        console.log('🔍 vocabAnalytics in storage:', allStorage.vocabAnalytics);
        
        const result = await window.AnalyticsStorage.getData();
        console.log('📊 Analytics data loaded from storage:', result);
        
        if (result) {
          // ✅ Ưu tiên analytics data từ storage
          this.data = { ...this.data, ...result };
          console.log('📊 Analytics data merged from storage:', this.data);
        } else {
          console.log('⚠️ No analytics data found in storage');
          
          // ✅ FALLBACK: Tạo từ VocabStorage nếu chưa có analytics data
          if (window.VocabStorage) {
            const allWords = await window.VocabStorage.getAllWords();
            console.log(' VocabStorage has', allWords.length, 'words');
            
            if (allWords.length > 0) {
              console.log('🔍 Sample words:', allWords.slice(0, 3).map(w => ({ id: w.id, word: w.word })));
              
              // ✅ Tạo analytics data từ VocabStorage
              this.data.totalWords = allWords.length;
              this.data.wordsLearned = {};
              
              allWords.forEach(word => {
                this.data.wordsLearned[word.id] = {
                  firstReviewed: word.createdAt || new Date().toISOString(),
                  reviewCount: word.srs?.repetitions || 0,
                  correctCount: word.srs?.repetitions || 0,
                  totalTimeSpent: 0,
                  averageQuality: word.srs?.easeFactor ? Math.min(5, Math.max(1, word.srs.easeFactor)) : 3,
                  lastReviewed: word.lastModified || word.createdAt || new Date().toISOString()
                };
              });
              
              console.log('📊 Analytics data created from VocabStorage:', this.data);
            }
          }
        }
      } else {
        console.log('❌ AnalyticsStorage not available');
      }
      this.initialized = true;
    } catch (error) {
      console.warn('Analytics initialization error:', error);
      this.initialized = true;
    }
  }

  async _withInit(fn) {
    await this.ensureInitialized();
    return fn();
  }

  setGamification(gamification) {
    this.gamification = gamification;
  }

  async recordWordReview(wordId, userAnswer, correctAnswer, quality, timeSpent) {
    return this._withInit(async () => {
      console.log('🔍 VocabAnalytics.recordWordReview called with:', {
        wordId,
        userAnswer,
        correctAnswer,
        quality,
        timeSpent
      });
      
      // Record analytics
      const result = await window.recordWordReview(
        this.data,
        wordId,
        userAnswer,
        correctAnswer,
        quality,
        timeSpent,
        this.gamification,
        async (data) => {
          console.log(' saveFn called with data:', data);
          if (window.AnalyticsStorage) {
            if (data && typeof data === 'object') {
              console.log('💾 Saving analytics data:', data);
              await window.AnalyticsStorage.saveData(data);
            } else {
              console.error('❌ Invalid data for saving:', data);
            }
          }
        }
      );
      
      // ✅ THÊM: Update gamification
      if (this.gamification && typeof this.gamification.handleWordReview === 'function') {
        try {
          const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
          await this.gamification.handleWordReview(wordId, isCorrect, quality, timeSpent);
          console.log('🎮 Gamification updated from analytics');
        } catch (gamificationError) {
          console.error('❌ Failed to update gamification from analytics:', gamificationError);
        }
      }
      
      return result;
    });
  }

  async getAnalyticsData() {
    return this._withInit(() => ({ ...this.data }));
  }

  async getWeeklyProgress() {
    return this._withInit(async () => {
      if (window.AnalyticsStats) {
        return await window.AnalyticsStats.getWeeklyProgress(this.data);
      }
      return [];
    });
  }

  async getDashboardStats() {
    return this._withInit(async () => {
      if (window.AnalyticsStats) {
        console.log('📊 Getting dashboard stats from data:', this.data);
        console.log('🔍 Data review sessions:', this.data.reviewSessions?.length);
        console.log('🔍 Data daily stats:', this.data.dailyStats);
        console.log('🔍 Data total words:', this.data.totalWords);
        console.log('🔍 Data current streak:', this.data.currentStreak);
        
        const stats = await window.AnalyticsStats.getDashboardStats(this.data, this.gamification);
        console.log('📊 Dashboard stats generated:', stats);
        return stats;
      }
      return {};
    });
  }

  async getDifficultWords() {
    return this._withInit(async () => {
      if (window.AnalyticsStats) {
        return await window.AnalyticsStats.getDifficultWords(this.data);
      }
      return [];
    });
  }
}

// Export for use in extension
if (typeof window !== 'undefined') {
  window.VocabAnalytics = VocabAnalytics;
}
