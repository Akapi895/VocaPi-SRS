// Advanced Analytics & Insights Manager
class AdvancedAnalyticsManager {
  constructor() {
    this.insights = [];
    this.metrics = new Map();
    this.trends = new Map();
    this.predictions = new Map();
    
    this.init();
  }

  async init() {
    await this.loadAnalyticsData();
    this.setupDataProcessing();
    this.generateInsights();
  }

  async loadAnalyticsData() {
    try {
      const data = await chrome.storage.local.get([
        'vocabWords',
        'analyticsData', 
        'gamificationData',
        'reviewHistory'
      ]);
      
      this.vocabWords = data.vocabWords || [];
      this.analyticsData = data.analyticsData || {};
      this.gamificationData = data.gamificationData || {};
      this.reviewHistory = data.reviewHistory || [];
      
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  }

  setupDataProcessing() {
    // Process data every hour for real-time insights
    setInterval(() => {
      this.generateInsights();
    }, 60 * 60 * 1000);
  }

  async generateInsights() {
    this.insights = [];
    
    // Generate various insight types
    await Promise.all([
      this.generateLearningPatternInsights(),
      this.generatePerformanceInsights(),
      this.generateRetentionInsights(),
      this.generateDifficultyInsights(),
      this.generateTimeBasedInsights(),
      this.generateCategoryInsights(),
      this.generatePredictiveInsights()
    ]);
    
    // Store insights for UI consumption
    await this.storeInsights();
  }

  async generateLearningPatternInsights() {
    const patterns = this.analyzeLearningPatterns();
    
    // Peak learning times
    if (patterns.peakHour) {
      this.insights.push({
        type: 'peak_time',
        title: 'Optimal Learning Time',
        message: `You learn best at ${patterns.peakHour}:00. Schedule your most challenging reviews during this time!`,
        data: patterns.hourlyPerformance,
        actionable: true,
        category: 'optimization'
      });
    }
    
    // Learning streaks
    if (patterns.longestStreak > 7) {
      this.insights.push({
        type: 'streak_achievement',
        title: 'Streak Master!',
        message: `Your longest learning streak was ${patterns.longestStreak} days. Keep building consistency!`,
        data: patterns.streakHistory,
        category: 'motivation'
      });
    }
    
    // Study session patterns
    if (patterns.optimalSessionLength) {
      this.insights.push({
        type: 'session_optimization',
        title: 'Perfect Session Length',
        message: `Your accuracy peaks at ${patterns.optimalSessionLength}-minute sessions. Try to maintain this duration.`,
        data: patterns.sessionPerformance,
        actionable: true,
        category: 'optimization'
      });
    }
  }

  async generatePerformanceInsights() {
    const performance = this.analyzePerformanceMetrics();
    
    // Accuracy trends
    if (performance.accuracyTrend === 'improving') {
      this.insights.push({
        type: 'performance_improving',
        title: 'Accuracy Improving!',
        message: `Your accuracy has improved by ${performance.accuracyImprovement.toFixed(1)}% this week. Excellent progress!`,
        data: performance.weeklyAccuracy,
        category: 'achievement'
      });
    }
    
    // Weak areas identification
    if (performance.weakCategories.length > 0) {
      this.insights.push({
        type: 'weak_areas',
        title: 'Focus Areas Identified',
        message: `Consider spending more time on: ${performance.weakCategories.join(', ')}`,
        data: performance.categoryPerformance,
        actionable: true,
        category: 'improvement'
      });
    }
    
    // Fast learner detection
    if (performance.averageMastery < 3) {
      this.insights.push({
        type: 'fast_learner',
        title: 'Quick Learner!',
        message: `You master words in just ${performance.averageMastery.toFixed(1)} reviews on average. Impressive!`,
        data: performance.masteryDistribution,
        category: 'achievement'
      });
    }
  }

  async generateRetentionInsights() {
    const retention = this.analyzeRetentionMetrics();
    
    // Forgetting curve analysis
    if (retention.forgettingCurve.length > 0) {
      this.insights.push({
        type: 'retention_curve',
        title: 'Memory Retention Pattern',
        message: `Your retention drops to ${retention.retentionAt24h}% after 24 hours. Consider shorter review intervals.`,
        data: retention.forgettingCurve,
        actionable: true,
        category: 'optimization'
      });
    }
    
    // Long-term retention
    if (retention.longTermRetention > 80) {
      this.insights.push({
        type: 'excellent_retention',
        title: 'Excellent Long-term Memory!',
        message: `You maintain ${retention.longTermRetention}% retention after 30 days. Your review strategy is working!`,
        data: retention.monthlyRetention,
        category: 'achievement'
      });
    }
  }

  async generateDifficultyInsights() {
    const difficulty = this.analyzeDifficultyProgression();
    
    // Difficulty sweet spot
    if (difficulty.optimalDifficulty) {
      this.insights.push({
        type: 'difficulty_optimization',
        title: 'Optimal Challenge Level',
        message: `You perform best with ${difficulty.optimalDifficulty} difficulty words. Balance your learning!`,
        data: difficulty.difficultyPerformance,
        actionable: true,
        category: 'optimization'
      });
    }
    
    // Challenge readiness
    if (difficulty.readyForChallenge) {
      this.insights.push({
        type: 'challenge_ready',
        title: 'Ready for More Challenge!',
        message: `Your performance suggests you can handle more difficult vocabulary. Time to level up!`,
        data: difficulty.progressionData,
        actionable: true,
        category: 'growth'
      });
    }
  }

  async generateTimeBasedInsights() {
    const timeAnalysis = this.analyzeTimePatterns();
    
    // Daily consistency
    if (timeAnalysis.consistencyScore > 0.8) {
      this.insights.push({
        type: 'consistency_champion',
        title: 'Consistency Champion!',
        message: `You maintain ${(timeAnalysis.consistencyScore * 100).toFixed(0)}% daily consistency. Habits are forming!`,
        data: timeAnalysis.dailyActivity,
        category: 'achievement'
      });
    }
    
    // Weekend learning
    if (timeAnalysis.weekendActivity < timeAnalysis.weekdayActivity * 0.5) {
      this.insights.push({
        type: 'weekend_opportunity',
        title: 'Weekend Learning Opportunity',
        message: `Your weekend activity is low. Even 10 minutes can maintain momentum!`,
        data: timeAnalysis.weeklyPattern,
        actionable: true,
        category: 'improvement'
      });
    }
  }

  async generateCategoryInsights() {
    const categoryAnalysis = this.analyzeCategoryPerformance();
    
    // Category mastery
    const masteredCategories = categoryAnalysis.categories.filter(c => c.mastery > 90);
    if (masteredCategories.length > 0) {
      this.insights.push({
        type: 'category_mastery',
        title: 'Category Mastered!',
        message: `You've mastered ${masteredCategories.map(c => c.name).join(', ')}! Time for new challenges.`,
        data: categoryAnalysis.masteryLevels,
        category: 'achievement'
      });
    }
    
    // Balanced learning
    const imbalance = categoryAnalysis.imbalanceScore;
    if (imbalance > 0.7) {
      this.insights.push({
        type: 'learning_imbalance',
        title: 'Diversify Your Learning',
        message: `You're focusing heavily on ${categoryAnalysis.topCategory}. Try mixing in other categories!`,
        data: categoryAnalysis.categoryDistribution,
        actionable: true,
        category: 'optimization'
      });
    }
  }

  async generatePredictiveInsights() {
    const predictions = this.generatePredictions();
    
    // Words likely to be forgotten
    if (predictions.forgettingRisk.length > 0) {
      this.insights.push({
        type: 'forgetting_prediction',
        title: 'Review Reminder',
        message: `${predictions.forgettingRisk.length} words are at risk of being forgotten. Review them soon!`,
        data: predictions.forgettingRisk,
        actionable: true,
        category: 'maintenance'
      });
    }
    
    // Learning velocity prediction
    if (predictions.learningVelocity) {
      this.insights.push({
        type: 'velocity_prediction',
        title: 'Learning Progress Forecast',
        message: `At your current pace, you'll master ${predictions.wordsPerWeek} new words per week.`,
        data: predictions.velocityTrend,
        category: 'progress'
      });
    }
    
    // Goal achievement prediction
    if (predictions.goalAchievement && predictions.goalAchievement.achievable) {
      this.insights.push({
        type: 'goal_prediction',
        title: 'Goal Achievement Forecast',
        message: `You're on track to reach your goal by ${predictions.goalAchievement.date}!`,
        data: predictions.goalProgress,
        category: 'motivation'
      });
    }
  }

  // Analysis Methods
  analyzeLearningPatterns() {
    const hourlyPerformance = new Array(24).fill(0).map((_, hour) => {
      const reviews = this.reviewHistory.filter(r => 
        new Date(r.timestamp).getHours() === hour
      );
      
      const accuracy = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + (r.quality >= 3 ? 1 : 0), 0) / reviews.length
        : 0;
        
      return { hour, reviews: reviews.length, accuracy };
    });
    
    const peakHour = hourlyPerformance.reduce((max, curr) => 
      curr.accuracy > max.accuracy ? curr : max
    ).hour;
    
    // Calculate session performance
    const sessions = this.groupReviewsIntoSessions();
    const sessionPerformance = this.analyzeSessionLengths(sessions);
    
    return {
      hourlyPerformance,
      peakHour,
      sessionPerformance,
      optimalSessionLength: sessionPerformance.optimal,
      streakHistory: this.calculateStreakHistory(),
      longestStreak: this.calculateLongestStreak()
    };
  }

  analyzePerformanceMetrics() {
    const weeklyAccuracy = this.calculateWeeklyAccuracy();
    const accuracyTrend = this.calculateTrend(weeklyAccuracy.map(w => w.accuracy));
    const accuracyImprovement = weeklyAccuracy.length >= 2 
      ? weeklyAccuracy[weeklyAccuracy.length - 1].accuracy - weeklyAccuracy[weeklyAccuracy.length - 2].accuracy
      : 0;
    
    const categoryPerformance = this.calculateCategoryPerformance();
    const weakCategories = categoryPerformance
      .filter(c => c.accuracy < 70)
      .map(c => c.name);
    
    const masteryDistribution = this.calculateMasteryDistribution();
    const averageMastery = masteryDistribution.average;
    
    return {
      weeklyAccuracy,
      accuracyTrend: accuracyImprovement > 2 ? 'improving' : 'stable',
      accuracyImprovement,
      categoryPerformance,
      weakCategories,
      masteryDistribution,
      averageMastery
    };
  }

  analyzeRetentionMetrics() {
    const forgettingCurve = this.calculateForgettingCurve();
    const retentionAt24h = forgettingCurve.find(f => f.hours === 24)?.retention || 0;
    const monthlyRetention = this.calculateMonthlyRetention();
    const longTermRetention = monthlyRetention[monthlyRetention.length - 1]?.retention || 0;
    
    return {
      forgettingCurve,
      retentionAt24h: Math.round(retentionAt24h),
      monthlyRetention,
      longTermRetention: Math.round(longTermRetention)
    };
  }

  analyzeDifficultyProgression() {
    const difficultyPerformance = this.calculateDifficultyPerformance();
    const optimalDifficulty = difficultyPerformance.reduce((max, curr) => 
      curr.accuracy > max.accuracy ? curr : max
    ).difficulty;
    
    const currentPerformance = this.getCurrentPerformanceLevel();
    const readyForChallenge = currentPerformance.accuracy > 85 && currentPerformance.consistency > 0.8;
    
    return {
      difficultyPerformance,
      optimalDifficulty,
      readyForChallenge,
      progressionData: this.calculateProgressionReadiness()
    };
  }

  analyzeTimePatterns() {
    const dailyActivity = this.calculateDailyActivity();
    const consistencyScore = this.calculateConsistencyScore(dailyActivity);
    const weeklyPattern = this.calculateWeeklyPattern();
    
    const weekdayActivity = weeklyPattern.slice(1, 6).reduce((sum, day) => sum + day.activity, 0) / 5;
    const weekendActivity = (weeklyPattern[0].activity + weeklyPattern[6].activity) / 2;
    
    return {
      dailyActivity,
      consistencyScore,
      weeklyPattern,
      weekdayActivity,
      weekendActivity
    };
  }

  analyzeCategoryPerformance() {
    const categories = this.groupWordsByCategory();
    const categoryStats = categories.map(category => {
      const words = category.words;
      const mastery = words.reduce((sum, word) => sum + this.calculateWordMastery(word), 0) / words.length;
      const accuracy = this.calculateCategoryAccuracy(category.name);
      
      return {
        name: category.name,
        wordCount: words.length,
        mastery: Math.round(mastery),
        accuracy: Math.round(accuracy)
      };
    });
    
    const total = categoryStats.reduce((sum, cat) => sum + cat.wordCount, 0);
    const imbalanceScore = this.calculateImbalanceScore(categoryStats);
    const topCategory = categoryStats.reduce((max, curr) => 
      curr.wordCount > max.wordCount ? curr : max
    ).name;
    
    return {
      categories: categoryStats,
      masteryLevels: categoryStats.map(c => ({ name: c.name, mastery: c.mastery })),
      categoryDistribution: categoryStats.map(c => ({ name: c.name, percentage: c.wordCount / total * 100 })),
      imbalanceScore,
      topCategory
    };
  }

  generatePredictions() {
    // Predict words at risk of being forgotten
    const forgettingRisk = this.vocabWords
      .filter(word => this.calculateForgettingRisk(word) > 0.7)
      .map(word => ({
        word: word.word,
        risk: this.calculateForgettingRisk(word),
        nextReview: this.calculateNextOptimalReview(word)
      }));
    
    // Calculate learning velocity
    const recentReviews = this.reviewHistory.filter(r => 
      Date.now() - new Date(r.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
    );
    const wordsPerWeek = recentReviews.length / 7;
    const velocityTrend = this.calculateVelocityTrend();
    
    // Goal achievement prediction (if user has set goals)
    const goalAchievement = this.predictGoalAchievement();
    
    return {
      forgettingRisk,
      learningVelocity: true,
      wordsPerWeek: Math.round(wordsPerWeek),
      velocityTrend,
      goalAchievement
    };
  }

  // Helper Methods (simplified implementations)
  calculateWeeklyAccuracy() {
    const weeks = [];
    const now = new Date();
    
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const weekReviews = this.reviewHistory.filter(r => {
        const reviewDate = new Date(r.timestamp);
        return reviewDate >= weekStart && reviewDate < weekEnd;
      });
      
      const accuracy = weekReviews.length > 0
        ? weekReviews.reduce((sum, r) => sum + (r.quality >= 3 ? 1 : 0), 0) / weekReviews.length * 100
        : 0;
      
      weeks.push({ week: i, accuracy: Math.round(accuracy) });
    }
    
    return weeks;
  }

  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    const recent = values.slice(-2);
    return recent[1] > recent[0] + 2 ? 'improving' : 'stable';
  }

  calculateForgettingRisk(word) {
    if (!word.reviews || word.reviews.length === 0) return 0;
    
    const lastReview = word.reviews[word.reviews.length - 1];
    const daysSinceReview = (Date.now() - new Date(lastReview.date).getTime()) / (24 * 60 * 60 * 1000);
    const averageQuality = word.reviews.reduce((sum, r) => sum + r.quality, 0) / word.reviews.length;
    
    // Higher risk if more days passed and lower average quality
    return Math.min(1, (daysSinceReview / 30) * (1 - averageQuality / 5));
  }

  async storeInsights() {
    try {
      await chrome.storage.local.set({ 
        advancedInsights: this.insights,
        lastInsightGeneration: Date.now()
      });
    } catch (error) {
      console.error('Failed to store insights:', error);
    }
  }

  // Public API methods
  async getInsights(category = null) {
    await this.loadAnalyticsData();
    await this.generateInsights();
    
    if (category) {
      return this.insights.filter(insight => insight.category === category);
    }
    
    return this.insights;
  }

  async getActionableInsights() {
    const insights = await this.getInsights();
    return insights.filter(insight => insight.actionable);
  }

  async getAchievementInsights() {
    return await this.getInsights('achievement');
  }

  async getOptimizationInsights() {
    return await this.getInsights('optimization');
  }

  // Simplified helper methods (would be fully implemented)
  groupReviewsIntoSessions() { return []; }
  analyzeSessionLengths(sessions) { return { optimal: 15 }; }
  calculateStreakHistory() { return []; }
  calculateLongestStreak() { return this.analyticsData.longestStreak || 0; }
  calculateCategoryPerformance() { return []; }
  calculateMasteryDistribution() { return { average: 3.5 }; }
  calculateForgettingCurve() { return []; }
  calculateMonthlyRetention() { return []; }
  calculateDifficultyPerformance() { return []; }
  getCurrentPerformanceLevel() { return { accuracy: 80, consistency: 0.7 }; }
  calculateProgressionReadiness() { return {}; }
  calculateDailyActivity() { return []; }
  calculateConsistencyScore(activity) { return 0.8; }
  calculateWeeklyPattern() { return Array(7).fill({ activity: 10 }); }
  groupWordsByCategory() { return []; }
  calculateWordMastery(word) { return 75; }
  calculateCategoryAccuracy(category) { return 80; }
  calculateImbalanceScore(stats) { return 0.5; }
  calculateNextOptimalReview(word) { return new Date(Date.now() + 24 * 60 * 60 * 1000); }
  calculateVelocityTrend() { return []; }
  predictGoalAchievement() { return null; }
}

// Initialize advanced analytics
if (typeof window !== 'undefined') {
  window.AdvancedAnalyticsManager = AdvancedAnalyticsManager;
  window.advancedAnalytics = new AdvancedAnalyticsManager();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedAnalyticsManager;
}
