// Enhanced Vocab SRS Analytics System
class VocabAnalytics {
  constructor() {
    this.storageKey = 'vocabAnalytics';
    this.initPromise = null;
    this.gamification = null;
    
    // Initialize gamification system
    this.initGamification();
  }
  
  async initGamification() {
    if (typeof window !== 'undefined') {
      // Wait for VocabGamification to be available
      await this.waitForGamification();
      if (window.VocabGamification) {
        console.log('🎮 Initializing gamification system...');
        this.gamification = new window.VocabGamification();
        this.gamification.analytics = this; // Set reference
        await this.gamification.initializeGamification();
        console.log('✅ Gamification system initialized successfully');
      }
    }
  }
  
  async waitForGamification(maxAttempts = 50) {
    for (let i = 0; i < maxAttempts; i++) {
      if (typeof window !== 'undefined' && window.VocabGamification) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.warn('⚠️ VocabGamification not available after waiting');
    return false;
  }

  async ensureInitialized() {
    if (!this.initPromise) {
      this.initPromise = this.initializeAnalytics();
    }
    return this.initPromise;
  }

  async initializeAnalytics() {
    console.log('🚀 Initializing analytics system...');
    const data = await this.getAnalyticsData();
    if (Object.keys(data).length === 0) {
      console.log('📊 Initializing analytics data structure...');
      const defaultData = this.getDefaultAnalyticsData();
      await this.saveAnalyticsData(defaultData);
    }
  }
  
  getDefaultAnalyticsData() {
    return {
      totalWordsLearned: 0,
      totalReviewSessions: 0,
      totalTimeSpent: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      totalXP: 0,
      achievements: [],
      
      // Essential data structures that were causing null errors
      wordDifficulty: {}, // { wordId: { attempts: 5, successes: 3, avgQuality: 2.5 } }
      dailyStats: {}, // { '2024-01-01': { wordsReviewed: 10, timeSpent: 600000, sessions: 2, accuracy: 85 } }
      qualityDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      
      // Session tracking
      currentSession: null,
      studyTimes: [],
      sessionLengths: []
    };
  }

  async getAnalyticsData() {
    return new Promise(async (resolve) => {
      try {
        console.log('📊 Getting analytics data...');
        
        // Get vocab words from storage using StorageManager
        const vocabWords = await StorageManager.get('vocab_words') || [];
        console.log('📚 Found vocab words:', vocabWords.length);
        
        // Calculate real statistics from vocab words
        const stats = this.calculateRealStats(vocabWords);
        
        // Get any stored analytics data for additional info
        const storedData = await StorageManager.get(this.storageKey) || {};
        
        // Merge real stats with stored data
        const analyticsData = {
          ...this.getDefaultAnalyticsData(),
          ...storedData,
          // Override with real calculated stats
          totalWordsLearned: stats.totalWords,
          totalReviews: stats.totalReviews,
          correctAnswers: stats.correctAnswers,
          qualityDistribution: stats.qualityDistribution,
          masteredWords: stats.masteredWords,
          studyStreak: stats.studyStreak,
          accuracyRate: stats.accuracyRate,
          wordsThisWeek: stats.wordsThisWeek,
          level: Math.floor(stats.totalWords / 50) + 1,
          progressToNextLevel: stats.totalWords % 50
        };
        
        console.log('📊 Final analytics data:', analyticsData);
        resolve(analyticsData);
      } catch (error) {
        console.error('❌ Error getting analytics data:', error);
        resolve(this.getDefaultAnalyticsData());
      }
    });
  }

  calculateRealStats(vocabWords) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let totalReviews = 0;
    let correctAnswers = 0;
    let qualityDistribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let masteredWords = 0;
    let wordsThisWeek = 0;
    let studyStreak = 0;
    
    console.log('🔍 Analyzing', vocabWords.length, 'words...');
    
    // Analyze each word
    vocabWords.forEach(word => {
      // Count total reviews
      totalReviews += word.reviewCount || 0;
      
      // Count words added this week
      if (word.addedDate && new Date(word.addedDate) >= weekAgo) {
        wordsThisWeek++;
      }
      
      // Analyze SRS data if available
      if (word.srs) {
        const quality = word.srs.quality || 0;
        qualityDistribution[quality] = (qualityDistribution[quality] || 0) + 1;
        
        // Count correct answers (quality >= 3)
        if (quality >= 3 && word.reviewCount > 0) {
          correctAnswers += word.reviewCount;
        }
        
        // Count mastered words (quality >= 4)
        if (quality >= 4) {
          masteredWords++;
        }
      }
    });
    
    // Calculate accuracy rate
    const accuracyRate = totalReviews > 0 ? ((correctAnswers / totalReviews) * 100).toFixed(1) : 0;
    
    // Calculate study streak (simplified - based on recent activity)
    studyStreak = this.calculateStudyStreakFromWords(vocabWords);
    
    const stats = {
      totalWords: vocabWords.length,
      totalReviews,
      correctAnswers,
      qualityDistribution,
      masteredWords,
      studyStreak,
      accuracyRate: parseFloat(accuracyRate),
      wordsThisWeek
    };
    
    console.log('📈 Calculated stats:', stats);
    return stats;
  }
  
  calculateStudyStreakFromWords(vocabWords) {
    // Simple streak calculation based on consecutive days with activity
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      // Check if any word was reviewed on this date
      const hasActivity = vocabWords.some(word => 
        word.lastReviewed && word.lastReviewed.startsWith(dateStr)
      );
      
      if (hasActivity) {
        streak++;
      } else if (i > 0) { // Don't break on first day (today) if no activity yet
        break;
      }
    }
    
    return streak;
  }
        
  // Calculation methods for enhanced analytics
  calculateStudyStreak(dailyStats) {
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let currentDate = new Date(today);
    
    while (true) {
      const dateKey = currentDate.toISOString().split('T')[0];
      if (dailyStats[dateKey] && dailyStats[dateKey].wordsReviewed > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }
  
  calculateRecentPerformance(data) {
    const dailyStats = data.dailyStats || {};
    const last7Days = this.getLast7Days();
    
    let totalAccuracy = 0;
    let daysWithData = 0;
    
    last7Days.forEach(date => {
      if (dailyStats[date] && typeof dailyStats[date].accuracy === 'number') {
        totalAccuracy += dailyStats[date].accuracy;
        daysWithData++;
      }
    });
    
    return daysWithData > 0 ? (totalAccuracy / daysWithData).toFixed(1) : 0;
  }
  
  calculateWeeklyStats(dailyStats) {
    const last7Days = this.getLast7Days();
    let totalWords = 0;
    let totalTime = 0;
    let totalSessions = 0;
    
    last7Days.forEach(date => {
      if (dailyStats[date]) {
        totalWords += dailyStats[date].wordsReviewed || 0;
        totalTime += dailyStats[date].timeSpent || 0;
        totalSessions += dailyStats[date].sessions || 0;
      }
    });
    
    return {
      wordsReviewed: totalWords,
      timeSpent: totalTime,
      sessions: totalSessions,
      averageWordsPerDay: (totalWords / 7).toFixed(1)
    };
  }
  
  calculateTotalReviews(qualityDistribution) {
    return Object.values(qualityDistribution).reduce((sum, count) => sum + count, 0);
  }
  
  calculateCorrectAnswers(qualityDistribution) {
    return (qualityDistribution[3] || 0) + (qualityDistribution[4] || 0) + (qualityDistribution[5] || 0);
  }
  
  getLast7Days() {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }
  
  async getGamificationData() {
    if (this.gamification) {
      try {
        return await this.gamification.getStats();
      } catch (error) {
        console.warn('⚠️ Error getting gamification data:', error);
      }
    }
    return {
      level: 1,
      xp: 0,
      achievements: [],
      badges: []
    };
  }

  async saveAnalyticsData(data) {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage not available');
        resolve();
        return;
      }
      
      chrome.storage.local.set({ [this.storageKey]: data }, () => {
        console.log('💾 Analytics data saved');
        resolve();
      });
    });
  }

  async startSession() {
    console.log('🎯 Starting analytics session...');
    try {
      const data = await this.getAnalyticsData();
      
      data.currentSession = {
        startTime: Date.now(),
        wordsReviewed: 0,
        correctAnswers: 0,
        totalAnswers: 0
      };
      
      await this.saveAnalyticsData(data);
      console.log('✅ Analytics session started successfully');
    } catch (error) {
      console.error('Error starting session:', error);
    }
  }

  async endSession() {
    console.log('⏹️ Ending analytics session...');
    try {
      const data = await this.getAnalyticsData();
      
      if (!data.currentSession) {
        console.warn('⚠️ No active session to end');
        return;
      }
      
      const sessionDuration = Date.now() - data.currentSession.startTime;
      data.totalReviewSessions += 1;
      data.totalTimeSpent += sessionDuration;
      
      data.currentSession = null;
      await this.saveAnalyticsData(data);
      
      console.log(`📊 Session ended. Duration: ${Math.round(sessionDuration / 1000)}s`);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  async recordWordReview(wordId, userAnswer, correctAnswer, quality, timeSpent = 0) {
    console.log(`🔍 [Analytics] recordWordReview called with:`, { wordId, quality, timeSpent });
    
    try {
      const data = await this.getAnalyticsData();
      
      // Ensure data object is valid and has all required properties
      if (!data || typeof data !== 'object') {
        console.error('❌ Invalid analytics data structure:', data);
        const defaultData = this.getDefaultAnalyticsData();
        await this.saveAnalyticsData(defaultData);
        return;
      }
      
      // Ensure required properties exist (fix the null error)
      if (!data.wordDifficulty) data.wordDifficulty = {};
      if (!data.dailyStats) data.dailyStats = {};
      if (!data.qualityDistribution) data.qualityDistribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      
      const today = new Date().toISOString().split('T')[0];
      const isCorrect = userAnswer?.toLowerCase().trim() === correctAnswer?.toLowerCase().trim();
      const reviewQuality = quality !== undefined ? quality : (isCorrect ? 4 : 1);
      
      // Update word difficulty tracking
      if (!data.wordDifficulty[wordId]) {
        data.wordDifficulty[wordId] = {
          attempts: 0,
          successes: 0,
          avgQuality: 0,
          lastReviewed: today,
          totalQuality: 0
        };
      }
      
      const wordData = data.wordDifficulty[wordId];
      wordData.attempts += 1;
      wordData.totalQuality += reviewQuality;
      wordData.avgQuality = wordData.totalQuality / wordData.attempts;
      wordData.lastReviewed = today;
      
      if (reviewQuality >= 3) {
        wordData.successes += 1;
      }
      
      // Update daily stats
      if (!data.dailyStats[today]) {
        data.dailyStats[today] = {
          wordsReviewed: 0,
          timeSpent: 0,
          sessions: 0,
          accuracy: 0,
          totalQuality: 0
        };
      }
      
      const dailyData = data.dailyStats[today];
      dailyData.wordsReviewed += 1;
      dailyData.timeSpent += timeSpent;
      dailyData.totalQuality += reviewQuality;
      dailyData.accuracy = ((dailyData.accuracy * (dailyData.wordsReviewed - 1) + (reviewQuality >= 3 ? 100 : 0)) / dailyData.wordsReviewed);
      
      // Update quality distribution
      if (reviewQuality >= 0 && reviewQuality <= 5) {
        data.qualityDistribution[reviewQuality] = (data.qualityDistribution[reviewQuality] || 0) + 1;
      }
      
      // Get actual vocab count from VocabStorage instead of counting wordDifficulty
      try {
        const vocabData = await new Promise((resolve) => {
          chrome.storage.local.get('vocab_words', (result) => {
            resolve(result['vocab_words'] || []);
          });
        });
        data.totalWordsLearned = Array.isArray(vocabData) ? vocabData.length : 0;
      } catch (error) {
        console.warn('Could not get vocab count, using wordDifficulty length');
        data.totalWordsLearned = Object.keys(data.wordDifficulty).length;
      }
      
      // Update streak
      this.updateStudyStreak(data, today);
      
      // Trigger gamification if available
      if (this.gamification) {
        try {
          await this.gamification.handleWordReview(wordId, reviewQuality, isCorrect);
        } catch (error) {
          console.warn('⚠️ Gamification error:', error);
        }
      }
      
      await this.saveAnalyticsData(data);
      
      console.log('✅ Analytics updated successfully:', {
        wordId,
        quality: reviewQuality,
        totalWords: data.totalWordsLearned,
        todayWords: dailyData.wordsReviewed
      });
      
    } catch (error) {
      console.error('❌ Error recording word review:', error);
    }
  }

  updateStudyStreak(data, today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // If today is first study or consecutive day
    if (!data.lastStudyDate || data.lastStudyDate === yesterdayStr) {
      if (data.lastStudyDate === yesterdayStr) {
        data.currentStreak += 1;
      } else {
        data.currentStreak = 1;
      }
    } else {
      // Streak broken
      data.currentStreak = 1;
    }
    
    data.lastStudyDate = today;
    data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
  }

  calculateXP(quality, timeSpent) {
    const baseXP = quality * 10;
    const timeBonus = Math.min(Math.floor(timeSpent / 1000), 30);
    return baseXP + timeBonus;
  }

  async getDashboardStats() {
    const data = await this.getAnalyticsData();
    
    // Get current vocabulary count
    const vocabWords = await this.getVocabWords();
    const totalWords = Array.isArray(vocabWords) ? vocabWords.length : 0;
    
    return {
      totalWords: totalWords,
      totalSessions: data.totalReviewSessions,
      totalTime: data.totalTimeSpent,
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      level: data.level,
      xp: data.totalXP,
      accuracyRate: data.accuracyRate,
      weeklyStats: data.weeklyStats,
      recentPerformance: data.recentPerformance,
      totalReviews: data.totalReviews,
      correctAnswers: data.correctAnswers
    };
  }

  async getVocabWords() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        resolve([]);
        return;
      }
      
      chrome.storage.local.get('vocab_words', (result) => {
        resolve(result['vocab_words'] || []);
      });
    });
  }

  async getWeeklyProgress() {
    const data = await this.getAnalyticsData();
    const last7Days = this.getLast7Days();
    
    return last7Days.map(date => {
      const dayData = data.dailyStats[date] || { wordsReviewed: 0, accuracy: 0, timeSpent: 0 };
      return {
        date,
        words: dayData.wordsReviewed,
        accuracy: dayData.accuracy,
        time: dayData.timeSpent
      };
    });
  }

  async getDifficultWords(limit = 10) {
    const data = await this.getAnalyticsData();
    
    return Object.entries(data.wordDifficulty)
      .filter(([_, wordData]) => wordData.attempts >= 3)
      .sort(([_, a], [__, b]) => a.avgQuality - b.avgQuality)
      .slice(0, limit)
      .map(([wordId, wordData]) => ({
        wordId,
        attempts: wordData.attempts,
        successRate: (wordData.successes / wordData.attempts * 100).toFixed(1),
        avgQuality: wordData.avgQuality.toFixed(2)
      }));
  }

  async getRecentAchievements(limit = 5) {
    const data = await this.getAnalyticsData();
    return data.achievements.slice(-limit).reverse();
  }
}

// Export for use in extension
if (typeof window !== 'undefined') {
  window.VocabAnalytics = VocabAnalytics;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VocabAnalytics;
}
