// Vocab SRS Analytics System
class VocabAnalytics {
  constructor() {
    this.storageKey = 'vocabAnalytics';
    // Don't call init() in constructor to avoid async issues
    this.initPromise = null;
    
    // Initialize gamification system
    this.gamification = null;
    this.initGamification();
  }
  
  async initGamification() {
    if (typeof window !== 'undefined' && window.VocabGamification) {
      this.gamification = new window.VocabGamification();
      this.gamification.analytics = this; // Set reference
      await this.gamification.initializeGamification();
    }
  }
  
  async ensureInitialized() {
    if (!this.initPromise) {
      this.initPromise = this.init();
    }
    return this.initPromise;
  }
  
  async init() {
    if (window.VocabLogger) {
      window.VocabLogger.info('Initializing Vocab Analytics System with Gamification');
    }
    await this.initializeStorage();
    await this.initGamification();
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
    
    // Track study time for patterns analysis
    if (!data.studyTimes) {
      data.studyTimes = [];
    }
    data.studyTimes.push(sessionStart);
    
    // Keep only last 50 study sessions for pattern analysis
    if (data.studyTimes.length > 50) {
      data.studyTimes = data.studyTimes.slice(-50);
    }
    
    await this.saveAnalyticsData(data);
    console.log('Analytics: Study session started at', new Date(sessionStart).toLocaleString());
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
    const wordsReviewedThisSession = data.currentSession.wordsReviewed || 0;
    todayStats.wordsReviewed += wordsReviewedThisSession;
    todayStats.timeSpent += sessionDuration;
    todayStats.sessions += 1;
    
    // Calculate accuracy for this session
    if (wordsReviewedThisSession > 0) {
      const sessionAccuracy = (data.currentSession.correctAnswers / wordsReviewedThisSession) * 100;
      
      // Calculate weighted average accuracy for today
      const totalWordsToday = todayStats.wordsReviewed;
      const previousWords = totalWordsToday - wordsReviewedThisSession;
      
      if (previousWords === 0) {
        todayStats.accuracy = Math.round(sessionAccuracy);
      } else {
        // Weighted average based on word count
        const previousAccuracy = todayStats.accuracy || 0;
        todayStats.accuracy = Math.round(
          (previousAccuracy * previousWords + sessionAccuracy * wordsReviewedThisSession) / totalWordsToday
        );
      }
    }
    
    // Update global stats
    data.totalReviewSessions += 1;
    data.totalTimeSpent += sessionDuration;
    
    // Update streak (will only update if requirements are met)
    await this.updateStreak(data);
    
    // Check achievements
    await this.checkAchievements(data);
    
    // Update gamification challenges
    if (this.gamification) {
      await this.gamification.updateChallengeProgress('time_spent', sessionDuration);
      if (todayStats.accuracy === 100) {
        await this.gamification.updateChallengeProgress('accuracy', 100);
      }
      
      // Check for streak milestone challenges
      if (data.currentStreak >= 7) {
        await this.gamification.updateChallengeProgress('streak_week', data.currentStreak);
      }
    }
    
    // Session summary for logging
    const sessionSummary = {
      wordsReviewed: wordsReviewedThisSession,
      duration: sessionDuration,
      accuracy: wordsReviewedThisSession > 0 ? (data.currentSession.correctAnswers / wordsReviewedThisSession * 100) : 0,
      todayTotal: todayStats.wordsReviewed,
      currentStreak: data.currentStreak
    };
    
    // Clean up session
    delete data.currentSession;
    
    await this.saveAnalyticsData(data);
    console.log(`📊 Session ended:`, sessionSummary);
    
    return sessionSummary;
  }
  
  async recordWordReview(wordId, userAnswer, correctAnswer, quality, timeSpent) {
    const data = await this.getAnalyticsData();
    
    // Track if this is the first time reviewing this word
    const isNewWord = !data.wordDifficulty[wordId];
    
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
    
    // Only increment totalWordsLearned for new words
    if (isNewWord) {
      data.totalWordsLearned += 1;
    }
    
    // Award XP with gamification system
    let xpGained = this.calculateXP(quality, timeSpent);
    data.totalXP += xpGained;
    
    // Enhanced XP with gamification bonuses
    if (this.gamification) {
      const context = {
        perfectAnswer: quality === 5,
        fastAnswer: timeSpent < 3000,
        difficultWord: wordStats.avgQuality < 3,
        firstTime: isNewWord
      };
      
      const bonusXP = await this.gamification.awardXP(xpGained, context);
      if (bonusXP > xpGained) {
        data.totalXP += (bonusXP - xpGained); // Add bonus difference
      }
      
      // Update challenge progress
      await this.gamification.updateChallengeProgress('review_count', 1);
    }
    
    await this.saveAnalyticsData(data);
    
    // Notify UI components that data has changed
    this.notifyDataUpdated();
    
    if (window.VocabLogger) {
      window.VocabLogger.debug(`Word review recorded - ${wordId}, Quality: ${quality}, XP: +${xpGained}, New Word: ${isNewWord}`);
    }
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
  
  async updateStreak(data) {
    // Accept data parameter to avoid race condition
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Constants for streak requirements
    const MIN_WORDS_FOR_STREAK = 5;
    const MIN_ACCURACY_FOR_STREAK = 60; // Optional: minimum accuracy requirement
    
    // Check if user studied enough today to maintain/increase streak
    const todayStats = data.dailyStats[today];
    const qualifiesForStreak = todayStats && 
                              todayStats.wordsReviewed >= MIN_WORDS_FOR_STREAK &&
                              (todayStats.accuracy >= MIN_ACCURACY_FOR_STREAK || todayStats.accuracy === 0); // Allow 0 for new users
    
    if (qualifiesForStreak) {
      // Only update streak if it hasn't been updated today already
      if (data.lastStudyDate !== today) {
        if (data.lastStudyDate === yesterday) {
          // Continuing streak - user studied yesterday and qualifies today
          data.currentStreak += 1;
        } else {
          // Starting new streak - either first time or streak was broken
          data.currentStreak = 1;
        }
        
        data.lastStudyDate = today;
        
        // Update longest streak
        if (data.currentStreak > data.longestStreak) {
          data.longestStreak = data.currentStreak;
        }
        
        console.log(`📅 Streak updated: ${data.currentStreak} days (reviewed ${todayStats.wordsReviewed} words)`);
      } else {
        console.log(`📅 Streak already updated today: ${data.currentStreak} days`);
      }
    } else if (todayStats && todayStats.wordsReviewed > 0) {
      // User studied but didn't meet minimum requirements
      console.log(`📅 Studied ${todayStats.wordsReviewed} words today but need ${MIN_WORDS_FOR_STREAK} minimum for streak`);
    }
    
    // Don't save here - will be saved by caller to avoid multiple saves
  }
  
  async checkStreakBreak() {
    // Helper function to check if streak should be broken
    const data = await this.getAnalyticsData();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const MIN_WORDS_FOR_STREAK = 5;
    
    // If user has a streak but didn't study yesterday (and it's past the day)
    if (data.currentStreak > 0 && data.lastStudyDate !== today) {
      const yesterdayStats = data.dailyStats[yesterday];
      
      // Check if yesterday's activity qualifies for streak
      const yesterdayQualifies = yesterdayStats && 
                                yesterdayStats.wordsReviewed >= MIN_WORDS_FOR_STREAK;
      
      // If last study date is older than yesterday, or yesterday didn't qualify, break streak
      if (data.lastStudyDate !== yesterday || !yesterdayQualifies) {
        const oldStreak = data.currentStreak;
        data.currentStreak = 0;
        await this.saveAnalyticsData(data);
        
        console.log(`💔 Streak broken! Was ${oldStreak} days. Last qualifying study: ${data.lastStudyDate}`);
        
        // Show streak break notification
        this.showStreakBreakNotification(oldStreak);
        return true;
      }
    }
    
    return false;
  }
  
  showStreakBreakNotification(oldStreak) {
    // Show streak break notification
    if (typeof chrome !== 'undefined' && chrome.notifications && oldStreak >= 3) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon48.png',
        title: '💔 Streak Broken!',
        message: `Your ${oldStreak}-day streak ended. Start a new one by reviewing 5+ words today!`,
        priority: 1
      });
    }
  }
  
  // Utility function to get today's progress towards streak requirement
  async getTodayStreakProgress() {
    const data = await this.getAnalyticsData();
    const today = new Date().toISOString().split('T')[0];
    const todayStats = data.dailyStats[today] || { wordsReviewed: 0, timeSpent: 0, accuracy: 0 };
    
    const MIN_WORDS_FOR_STREAK = 5;
    const progress = Math.min(todayStats.wordsReviewed, MIN_WORDS_FOR_STREAK);
    const percentage = Math.round((progress / MIN_WORDS_FOR_STREAK) * 100);
    
    return {
      wordsReviewed: todayStats.wordsReviewed,
      wordsNeeded: Math.max(0, MIN_WORDS_FOR_STREAK - todayStats.wordsReviewed),
      percentage: percentage,
      qualifiesForStreak: todayStats.wordsReviewed >= MIN_WORDS_FOR_STREAK,
      currentStreak: data.currentStreak,
      canIncreaseStreak: todayStats.wordsReviewed >= MIN_WORDS_FOR_STREAK && data.lastStudyDate !== today
    };
  }
  
  async checkAchievements(data) {
    // Use gamification system if available, otherwise fall back to basic achievements
    if (this.gamification) {
      try {
        const newAchievements = await this.gamification.checkAchievements(data);
        
        if (newAchievements.length > 0) {
          // Update analytics achievements array for backward compatibility
          data.achievements = data.achievements || [];
          newAchievements.forEach(achievement => {
            if (!data.achievements.find(a => a.id === achievement.id)) {
              data.achievements.push(achievement);
            }
          });
        }
        
        return newAchievements;
      } catch (error) {
        console.error('Gamification achievements error, using fallback:', error);
        // Continue to fallback system
      }
    }
    
    // Fallback basic achievement system
    const basicAchievements = [
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
        condition: () => {
          // Use total quality distribution count instead of totalWordsLearned
          const totalReviews = Object.values(data.qualityDistribution || {}).reduce((sum, count) => sum + count, 0);
          return totalReviews >= 100;
        },
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
    
    const newAchievements = [];
    for (const achievement of basicAchievements) {
      if (!data.achievements.find(a => a.id === achievement.id) && achievement.condition()) {
        const unlockedAchievement = {
          ...achievement,
          unlockedAt: new Date().toISOString()
        };
        data.achievements.push(unlockedAchievement);
        newAchievements.push(unlockedAchievement);
        data.totalXP += achievement.xp;
        console.log(`🏆 Achievement unlocked: ${achievement.name}`);
        
        // Show notification
        this.showAchievementNotification(achievement);
      }
    }
    
    return newAchievements;
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
    const todayStats = data.dailyStats?.[today] || { wordsReviewed: 0, timeSpent: 0, accuracy: 0 };
    
    if (window.VocabLogger) {
      window.VocabLogger.debug('📊 Getting dashboard stats - RAW data:', { data, today, todayStats });
    }
    
    // Calculate actual metrics from real data only
    const totalReviews = Object.values(data.qualityDistribution || {}).reduce((sum, count) => sum + count, 0);
    const uniqueWordsReviewed = Object.keys(data.wordDifficulty || {}).length;
    
    const stats = {
      // Main metrics (only from actual reviews)
      totalWordsLearned: uniqueWordsReviewed, // Only count words that have been actually reviewed
      totalWords: uniqueWordsReviewed, // alias
      totalTime: data?.totalTimeSpent || 0,
      totalSessions: data?.totalReviewSessions || 0,
      
      // Today's metrics (from actual sessions)
      todayWords: todayStats.wordsReviewed || 0,
      todayTime: todayStats.timeSpent || 0,
      todayAccuracy: todayStats.accuracy || 0,
      
      // Streak metrics (based on real daily minimums)
      currentStreak: data?.currentStreak || 0,
      longestStreak: data?.longestStreak || 0,
      
      // XP & Achievements (from real activities)
      totalXP: data?.totalXP || 0,
      achievementCount: data?.achievements?.length || 0,
      
      // Quality Distribution (from actual reviews)
      qualityDistribution: data?.qualityDistribution || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      
      // Additional real data metrics
      totalReviews: totalReviews,
      isDataReal: totalReviews > 0 || uniqueWordsReviewed > 0 || (data?.totalReviewSessions || 0) > 0
    };
    
    if (window.VocabLogger) {
      window.VocabLogger.debug('📊 Processed dashboard stats - REAL ONLY:', stats);
    }
    
    console.log('📊 Analytics Dashboard Stats (REAL DATA ONLY):', {
      uniqueWords: uniqueWordsReviewed,
      totalReviews: totalReviews,
      sessions: stats.totalSessions,
      streak: stats.currentStreak,
      xp: stats.totalXP,
      isReal: stats.isDataReal
    });
    
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
  
  // Notify all UI components that analytics data has been updated
  notifyDataUpdated() {
    // Dispatch custom event to notify UI components
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('vocabAnalyticsUpdated', {
        detail: { timestamp: Date.now() }
      });
      window.dispatchEvent(event);
      
      // Also trigger refresh for specific components if they exist
      if (window.analyticsUI && typeof window.analyticsUI.refreshStatsFromStorage === 'function') {
        window.analyticsUI.refreshStatsFromStorage();
      }
      
      console.log('📊 Analytics data updated - UI components notified');
    }
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
