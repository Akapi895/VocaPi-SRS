// Vocab SRS Analytics System
class VocabAnalytics {
  constructor() {
    this.storageKey = 'vocabAnalytics';
    // Don't call init() in constructor to avoid async issues
    this.initPromise = null;
  }
  
  async ensureInitialized() {
    if (!this.initPromise) {
      this.initPromise = this.init();
    }
    return this.initPromise;
  }
  
  async init() {
    console.log('Initializing Vocab Analytics System');
    await this.initializeStorage();
  }
  
  async initializeStorage() {
    const existing = await this.getAnalyticsData();
    if (!existing || !existing.initialized) {
      const initialData = {
        initialized: true,
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        
        // Learning Statistics
        totalWordsLearned: 0,
        totalReviewSessions: 0,
        totalTimeSpent: 0, // in minutes
        
        // Streak Tracking
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
        
        // Daily Progress
        dailyStats: {}, // { "2025-08-11": { wordsReviewed: 10, timeSpent: 15, accuracy: 85 } }
        
        // Word Performance
        wordDifficulty: {}, // { wordId: { attempts: 5, successes: 3, avgQuality: 2.5 } }
        
        // Learning Patterns
        studyTimes: [], // Array of study session timestamps
        qualityDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        
        // Achievements
        achievements: [],
        totalXP: 0
      };
      
      await this.saveAnalyticsData(initialData);
      console.log('Analytics data initialized');
    }
  }
  
  async getAnalyticsData() {
    return new Promise((resolve, reject) => {
      try {
        if (typeof chrome === 'undefined' || !chrome.storage) {
          console.error('Chrome storage not available');
          resolve(null);
          return;
        }
        
        chrome.storage.local.get([this.storageKey], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Chrome storage error:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(result[this.storageKey] || null);
        });
      } catch (error) {
        console.error('Error accessing chrome storage:', error);
        resolve(null);
      }
    });
  }
  
  async saveAnalyticsData(data) {
    return new Promise((resolve, reject) => {
      try {
        if (typeof chrome === 'undefined' || !chrome.storage) {
          console.error('Chrome storage not available');
          resolve();
          return;
        }
        
        chrome.storage.local.set({ [this.storageKey]: data }, () => {
          if (chrome.runtime.lastError) {
            console.error('Chrome storage save error:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      } catch (error) {
        console.error('Error saving to chrome storage:', error);
        resolve();
      }
    });
  }
  
  // Learning Session Tracking
  async startSession() {
    const data = await this.getAnalyticsData();
    const sessionStart = Date.now();
    
    data.currentSession = {
      startTime: sessionStart,
      wordsReviewed: 0,
      correctAnswers: 0,
      qualityRatings: []
    };
    
    await this.saveAnalyticsData(data);
    console.log('Analytics: Study session started');
    return sessionStart;
  }
  
  async endSession(sessionStats = {}) {
    const data = await this.getAnalyticsData();
    
    if (!data.currentSession) {
      console.warn('No active session to end');
      return;
    }
    
    const sessionDuration = Math.round((Date.now() - data.currentSession.startTime) / 60000); // minutes
    const today = new Date().toISOString().split('T')[0];
    
    // Update daily stats
    if (!data.dailyStats[today]) {
      data.dailyStats[today] = { wordsReviewed: 0, timeSpent: 0, sessions: 0, accuracy: 0 };
    }
    
    const todayStats = data.dailyStats[today];
    todayStats.wordsReviewed += data.currentSession.wordsReviewed;
    todayStats.timeSpent += sessionDuration;
    todayStats.sessions += 1;
    
    // Calculate accuracy for this session
    if (data.currentSession.wordsReviewed > 0) {
      const sessionAccuracy = (data.currentSession.correctAnswers / data.currentSession.wordsReviewed) * 100;
      todayStats.accuracy = Math.round((todayStats.accuracy + sessionAccuracy) / 2);
    }
    
    // Update global stats
    data.totalReviewSessions += 1;
    data.totalTimeSpent += sessionDuration;
    data.totalWordsLearned += data.currentSession.wordsReviewed;
    
    // Update streak
    await this.updateStreak();
    
    // Check achievements
    await this.checkAchievements(data);
    
    // Clean up session
    delete data.currentSession;
    
    await this.saveAnalyticsData(data);
    console.log(`Analytics: Session ended - ${sessionDuration}min, ${data.currentSession?.wordsReviewed || 0} words`);
  }
  
  async recordWordReview(wordId, userAnswer, correctAnswer, quality, timeSpent) {
    const data = await this.getAnalyticsData();
    
    // Update current session
    if (data.currentSession) {
      data.currentSession.wordsReviewed += 1;
      if (userAnswer.toLowerCase() === correctAnswer.toLowerCase() && quality >= 3) {
        data.currentSession.correctAnswers += 1;
      }
      data.currentSession.qualityRatings.push(quality);
    }
    
    // Update word difficulty tracking
    if (!data.wordDifficulty[wordId]) {
      data.wordDifficulty[wordId] = {
        attempts: 0,
        successes: 0,
        totalQuality: 0,
        avgQuality: 0,
        lastReview: null
      };
    }
    
    const wordStats = data.wordDifficulty[wordId];
    wordStats.attempts += 1;
    wordStats.totalQuality += quality;
    wordStats.avgQuality = wordStats.totalQuality / wordStats.attempts;
    wordStats.lastReview = new Date().toISOString();
    
    if (quality >= 3) {
      wordStats.successes += 1;
    }
    
    // Update quality distribution
    data.qualityDistribution[quality] = (data.qualityDistribution[quality] || 0) + 1;
    
    // Award XP
    const xpGained = this.calculateXP(quality, timeSpent);
    data.totalXP += xpGained;
    
    await this.saveAnalyticsData(data);
    console.log(`Analytics: Word review recorded - ${wordId}, Quality: ${quality}, XP: +${xpGained}`);
  }
  
  calculateXP(quality, timeSpent) {
    const baseXP = {
      0: 1,   // Blackout
      1: 2,   // Incorrect
      2: 5,   // Hard
      3: 10,  // Correct
      4: 15,  // Easy
      5: 25   // Perfect
    };
    
    let xp = baseXP[quality] || 0;
    
    // Bonus for quick correct answers
    if (quality >= 4 && timeSpent < 5000) {
      xp += 5;
    }
    
    return xp;
  }
  
  async updateStreak() {
    const data = await this.getAnalyticsData();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Check if user studied today
    if (data.dailyStats[today] && data.dailyStats[today].wordsReviewed > 0) {
      if (data.lastStudyDate === yesterday) {
        // Continuing streak
        data.currentStreak += 1;
      } else if (data.lastStudyDate !== today) {
        // New streak or broken streak
        data.currentStreak = 1;
      }
      
      data.lastStudyDate = today;
      
      // Update longest streak
      if (data.currentStreak > data.longestStreak) {
        data.longestStreak = data.currentStreak;
      }
    }
    
    await this.saveAnalyticsData(data);
  }
  
  async checkAchievements(data) {
    const achievements = [
      {
        id: 'first_word',
        name: 'First Step',
        description: 'Added your first word',
        condition: () => data.totalWordsLearned >= 1,
        icon: '📝',
        xp: 50
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: '7-day learning streak',
        condition: () => data.currentStreak >= 7,
        icon: '🔥',
        xp: 200
      },
      {
        id: 'words_100',
        name: 'Century Club',
        description: 'Reviewed 100 words',
        condition: () => data.totalWordsLearned >= 100,
        icon: '💯',
        xp: 500
      },
      {
        id: 'perfect_session',
        name: 'Perfectionist',
        description: 'Perfect session (100% accuracy)',
        condition: () => {
          const today = new Date().toISOString().split('T')[0];
          return data.dailyStats[today]?.accuracy === 100;
        },
        icon: '⭐',
        xp: 100
      }
    ];
    
    for (const achievement of achievements) {
      if (!data.achievements.find(a => a.id === achievement.id) && achievement.condition()) {
        data.achievements.push({
          ...achievement,
          unlockedAt: new Date().toISOString()
        });
        data.totalXP += achievement.xp;
        console.log(`🏆 Achievement unlocked: ${achievement.name}`);
        
        // Show notification
        this.showAchievementNotification(achievement);
      }
    }
  }
  
  showAchievementNotification(achievement) {
    // Create achievement notification
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '🏆 Achievement Unlocked!',
        message: `${achievement.name}: ${achievement.description}`,
        priority: 1
      });
    }
  }
  
  // Analytics Queries
  async getDashboardStats() {
    await this.ensureInitialized();
    const data = await this.getAnalyticsData();
    const today = new Date().toISOString().split('T')[0];
    const todayStats = data.dailyStats[today] || { wordsReviewed: 0, timeSpent: 0, accuracy: 0 };
    
    console.log('Raw analytics data for dashboard:', {
      data,
      today,
      todayStats
    });
    
    const stats = {
      // Main metrics (matching UI element IDs)
      totalWordsLearned: data?.totalWordsLearned || 0,
      totalWords: data?.totalWordsLearned || 0, // alias
      totalTime: data?.totalTimeSpent || 0,
      totalSessions: data?.totalReviewSessions || 0,
      
      // Today's metrics
      todayWords: todayStats.wordsReviewed || 0,
      todayTime: todayStats.timeSpent || 0,
      todayAccuracy: todayStats.accuracy || 0,
      
      // Streak metrics  
      currentStreak: data?.currentStreak || 0,
      longestStreak: data?.longestStreak || 0,
      
      // XP & Achievements
      totalXP: data?.totalXP || 0,
      achievementCount: data?.achievements?.length || 0,
      
      // Quality Distribution
      qualityDistribution: data?.qualityDistribution || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
    
    console.log('Processed dashboard stats:', stats);
    return stats;
  }
  
  async getWeeklyProgress() {
    await this.ensureInitialized();
    const data = await this.getAnalyticsData();
    const weeklyData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayStats = (data?.dailyStats && data.dailyStats[dateStr]) || { wordsReviewed: 0, timeSpent: 0, accuracy: 0 };
      
      weeklyData.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        words: dayStats.wordsReviewed || 0,
        time: dayStats.timeSpent || 0,
        accuracy: dayStats.accuracy || 0
      });
    }
    
    return weeklyData;
  }
  
  async getDifficultWords(limit = 10) {
    await this.ensureInitialized();
    const data = await this.getAnalyticsData();
    const wordStats = Object.entries(data?.wordDifficulty || {})
      .map(([wordId, stats]) => ({
        wordId,
        ...stats,
        difficultyScore: stats.attempts > 0 ? (stats.attempts - stats.successes) / stats.attempts : 1
      }))
      .sort((a, b) => b.difficultyScore - a.difficultyScore)
      .slice(0, limit);
    
    return wordStats;
  }
  
  async getRecentAchievements(limit = 5) {
    await this.ensureInitialized();
    const data = await this.getAnalyticsData();
    return (data?.achievements || [])
      .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
      .slice(0, limit);
  }
}

// Global Analytics Instance
console.log('Analytics.js loading...');

if (typeof window !== 'undefined') {
  // Delay initialization to ensure chrome is ready
  if (typeof chrome !== 'undefined' && chrome.storage) {
    window.VocabAnalytics = new VocabAnalytics();
    console.log('VocabAnalytics initialized globally with chrome storage');
  } else {
    // Wait for chrome to be available
    console.log('Chrome not ready, waiting...');
    const checkChrome = () => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        window.VocabAnalytics = new VocabAnalytics();
        console.log('VocabAnalytics initialized globally (delayed)');
      } else {
        setTimeout(checkChrome, 100);
      }
    };
    setTimeout(checkChrome, 100);
  }
} else {
  console.warn('Window object not available for VocabAnalytics');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VocabAnalytics;
}
