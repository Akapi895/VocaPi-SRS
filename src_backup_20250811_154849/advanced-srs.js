// Advanced SRS Algorithm with Adaptive Learning
class AdvancedSRSAlgorithm {
  constructor() {
    this.DEFAULT_PARAMETERS = {
      requestRetention: 0.9, // Target retention rate
      maximumInterval: 36500, // 100 years in days
      w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]
    };
  }

  /**
   * Enhanced SM-2+ algorithm with adaptive parameters
   */
  calculateNextReview(card, quality, responseTime = null, userStats = {}) {
    const now = Date.now();
    const timeSinceLastReview = card.srs.lastReviewedAt 
      ? (now - card.srs.lastReviewedAt) / (1000 * 60 * 60 * 24) // days
      : 0;

    // Adaptive difficulty factor based on user performance
    const adaptiveFactor = this.calculateAdaptiveFactor(userStats, card.category);
    
    // Time-based forgetting curve adjustment
    const forgettingCurveAdjustment = this.calculateForgettingCurve(
      timeSinceLastReview, 
      card.srs.interval, 
      card.srs.easeFactor
    );

    // Response time analysis (if available)
    const responseTimeBonus = responseTime ? this.analyzeResponseTime(responseTime, card.difficulty) : 1.0;

    let { interval, easeFactor, repetitions } = card.srs;

    // Quality-based adjustments
    if (quality < 3) {
      // Failed recall - apply forgetting curve and reset
      repetitions = 0;
      interval = Math.max(1, Math.floor(interval * forgettingCurveAdjustment * 0.5));
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else {
      // Successful recall
      repetitions += 1;
      
      if (repetitions === 1) {
        interval = Math.ceil(1 * adaptiveFactor);
      } else if (repetitions === 2) {
        interval = Math.ceil(6 * adaptiveFactor);
      } else {
        // Enhanced ease factor calculation
        const qualityBonus = this.calculateQualityBonus(quality);
        const consistencyBonus = this.calculateConsistencyBonus(card.reviewHistory || []);
        
        easeFactor = Math.min(2.5, easeFactor + qualityBonus + consistencyBonus);
        interval = Math.ceil(interval * easeFactor * adaptiveFactor * responseTimeBonus);
      }
    }

    // Apply maximum interval limit
    interval = Math.min(interval, this.DEFAULT_PARAMETERS.maximumInterval);

    // Calculate optimal review time based on circadian rhythm
    const optimalReviewTime = this.calculateOptimalReviewTime(userStats.preferredTimes);
    const nextReviewDate = new Date(now + interval * 24 * 60 * 60 * 1000);
    
    // Adjust to optimal time
    if (optimalReviewTime) {
      nextReviewDate.setHours(optimalReviewTime.hour, optimalReviewTime.minute, 0, 0);
    }

    // Update review history
    const reviewEntry = {
      date: now,
      quality,
      responseTime,
      interval: card.srs.interval,
      newInterval: interval,
      easeFactor,
      timeSinceLastReview
    };

    return {
      interval,
      repetitions,
      easeFactor: Number(easeFactor.toFixed(2)),
      nextReview: nextReviewDate.getTime(),
      lastReviewedAt: now,
      reviewHistory: [...(card.srs.reviewHistory || []), reviewEntry].slice(-20), // Keep last 20 reviews
      totalReviews: (card.srs.totalReviews || 0) + 1,
      metadata: {
        adaptiveFactor,
        forgettingCurveAdjustment,
        responseTimeBonus,
        optimalReviewTime
      }
    };
  }

  /**
   * Calculate adaptive factor based on user's overall performance
   */
  calculateAdaptiveFactor(userStats, category) {
    const overallAccuracy = userStats.accuracy || 0.8;
    const categoryAccuracy = userStats.categoryAccuracy?.[category] || overallAccuracy;
    const streakBonus = Math.min(0.2, (userStats.streak || 0) * 0.01);
    
    // More difficult if user is performing well, easier if struggling
    let factor = 1.0;
    
    if (categoryAccuracy > 0.9) {
      factor = 1.2 + streakBonus; // Increase difficulty
    } else if (categoryAccuracy < 0.7) {
      factor = 0.8; // Decrease difficulty
    }
    
    return factor;
  }

  /**
   * Calculate forgetting curve adjustment
   */
  calculateForgettingCurve(timeSinceLastReview, scheduledInterval, easeFactor) {
    if (timeSinceLastReview <= 0 || scheduledInterval <= 0) return 1.0;
    
    const overdueRatio = timeSinceLastReview / scheduledInterval;
    
    if (overdueRatio <= 1.0) {
      return 1.0; // On time or early
    }
    
    // Apply exponential decay for overdue reviews
    const forgettingRate = 1 / easeFactor;
    return Math.exp(-forgettingRate * (overdueRatio - 1));
  }

  /**
   * Analyze response time to determine confidence
   */
  analyzeResponseTime(responseTime, difficulty = 'medium') {
    const expectedTimes = {
      easy: 3000,    // 3 seconds
      medium: 5000,  // 5 seconds
      hard: 8000     // 8 seconds
    };
    
    const expected = expectedTimes[difficulty] || expectedTimes.medium;
    const ratio = responseTime / expected;
    
    if (ratio < 0.5) return 1.1; // Very fast = confident
    if (ratio < 1.0) return 1.05; // Fast = somewhat confident
    if (ratio < 2.0) return 1.0; // Normal speed
    return 0.95; // Slow = less confident
  }

  /**
   * Calculate quality bonus based on response quality
   */
  calculateQualityBonus(quality) {
    const bonusMap = {
      0: -0.8,  // Complete failure
      1: -0.54, // Incorrect
      2: -0.32, // Incorrect but remembered after hint
      3: -0.14, // Correct with difficulty
      4: 0,     // Correct
      5: 0.15   // Perfect/easy
    };
    
    return bonusMap[quality] || 0;
  }

  /**
   * Calculate consistency bonus
   */
  calculateConsistencyBonus(reviewHistory) {
    if (reviewHistory.length < 5) return 0;
    
    const recentReviews = reviewHistory.slice(-5);
    const avgQuality = recentReviews.reduce((sum, r) => sum + r.quality, 0) / recentReviews.length;
    
    if (avgQuality >= 4.0) return 0.05; // Very consistent high performance
    if (avgQuality >= 3.5) return 0.02; // Good consistency
    return 0;
  }

  /**
   * Calculate optimal review time based on user's historical performance
   */
  calculateOptimalReviewTime(preferredTimes) {
    if (!preferredTimes || preferredTimes.length === 0) {
      // Default optimal times based on research
      return { hour: 9, minute: 0 }; // Morning learning is generally most effective
    }
    
    // Use user's most successful review times
    const bestTime = preferredTimes.reduce((best, time) => 
      time.accuracy > best.accuracy ? time : best
    );
    
    return { hour: bestTime.hour, minute: bestTime.minute };
  }

  /**
   * Predict user performance and suggest optimal batch size
   */
  suggestOptimalBatchSize(userStats, timeAvailable) {
    const baseTime = 30; // seconds per word
    const accuracyFactor = Math.max(0.5, userStats.accuracy || 0.8);
    const timeFactor = timeAvailable / (baseTime * 1000); // Convert to seconds
    
    const suggestedSize = Math.floor(timeFactor * accuracyFactor);
    return Math.min(Math.max(5, suggestedSize), 50); // Between 5-50 words
  }

  /**
   * Analyze learning patterns and suggest improvements
   */
  generateLearningInsights(userStats, reviewHistory) {
    const insights = [];
    
    // Time-based patterns
    if (userStats.morningAccuracy > userStats.eveningAccuracy + 0.1) {
      insights.push({
        type: 'timing',
        message: 'You learn better in the morning! Consider scheduling more reviews before noon.',
        priority: 'high'
      });
    }
    
    // Difficulty patterns
    const failureRate = reviewHistory.filter(r => r.quality < 3).length / reviewHistory.length;
    if (failureRate > 0.3) {
      insights.push({
        type: 'difficulty',
        message: 'Consider reducing daily review count to improve retention.',
        priority: 'medium'
      });
    }
    
    // Consistency patterns
    const streak = userStats.streak || 0;
    if (streak > 7) {
      insights.push({
        type: 'motivation',
        message: `Amazing! You've maintained a ${streak}-day streak. Keep it up!`,
        priority: 'low'
      });
    }
    
    return insights;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.AdvancedSRSAlgorithm = AdvancedSRSAlgorithm;
}
