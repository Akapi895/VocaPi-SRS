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
      if (window.AnalyticsStorage) {
        const result = await window.AnalyticsStorage.getData();
        
        if (result) {
          this.data = { ...this.data, ...result };
        } else {
          if (window.VocabStorage) {
            const allWords = await window.VocabStorage.getAllWords();
            
            if (allWords.length > 0) {
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
            }
          }
        }
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
      const result = await window.recordWordReview(
        this.data,
        wordId,
        userAnswer,
        correctAnswer,
        quality,
        timeSpent,
        this.gamification,
        async (data) => {
          if (window.AnalyticsStorage) {
            if (data && typeof data === 'object') {
              await window.AnalyticsStorage.saveData(data);
            } else {
              console.error('Invalid data for saving:', data);
            }
          }
        }
      );
      
      if (this.gamification && typeof this.gamification.handleWordReview === 'function') {
        try {
          const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
          await this.gamification.handleWordReview(wordId, isCorrect, quality, timeSpent);
        } catch (gamificationError) {
          console.error('Failed to update gamification from analytics:', gamificationError);
        }
      }
      
      return result;
    });
  }

  async getAnalyticsData() {
    return this._withInit(async () => {
      let overallAccuracy = 0;
      if (window.AnalyticsStats && typeof window.AnalyticsStats.getOverallAccuracy === 'function') {
        overallAccuracy = window.AnalyticsStats.getOverallAccuracy(this.data);
      }
      
      return { 
        ...this.data, 
        overallAccuracy: overallAccuracy 
      };
    });
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
        const stats = await window.AnalyticsStats.getDashboardStats(this.data, this.gamification);
        return stats;
      }
      return {};
    });
  }

  async getDifficultWords() {
    return this._withInit(async () => {
      if (window.AnalyticsStats && window.AnalyticsStats.getDifficultWords) {
        return window.AnalyticsStats.getDifficultWords(this.data);
      }
      return [];
    });
  }
}

if (typeof window !== 'undefined') {
  window.VocabAnalytics = VocabAnalytics;
}
