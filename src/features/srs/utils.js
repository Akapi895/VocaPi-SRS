// Time formatting utilities for SRS
export const TimeUtils = {
  formatTimeUntilReview(nextReview) {
    if (!nextReview) return 'Ready now';
    
    const now = Date.now();
    const nextReviewTime = typeof nextReview === 'string' 
      ? new Date(nextReview).getTime() 
      : nextReview;
    
    if (nextReviewTime <= now) return 'Ready now';
    
    const diffMs = nextReviewTime - now;
    const minutes = Math.ceil(diffMs / (1000 * 60));
    
    return this.formatInterval(minutes);
  },
  
  formatInterval(minutes) {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes < 1440) { // Less than 1 day
      const hours = Math.round((minutes / 60) * 10) / 10;
      return `${hours} hours`;
    } else if (minutes < 10080) { // Less than 1 week  
      const days = Math.round((minutes / 1440) * 10) / 10;
      return `${days} days`;
    } else if (minutes < 43200) { // Less than 1 month
      const weeks = Math.round((minutes / 10080) * 10) / 10;
      return `${weeks} weeks`;
    } else {
      const months = Math.round((minutes / 43200) * 10) / 10;
      return `${months} months`;
    }
  },
  
  isCardDue(card) {
    if (!card.srs || !card.srs.nextReview) return true;
    
    const now = Date.now();
    const nextReviewTime = typeof card.srs.nextReview === 'string'
      ? new Date(card.srs.nextReview).getTime()
      : card.srs.nextReview;
      
    return now >= nextReviewTime;
  }
};

// SRS utility functions
export function calculateForgettingCurve(timeSinceLastReview, scheduledInterval, easeFactor) {
  if (timeSinceLastReview <= 0 || scheduledInterval <= 0) return 1.0;
  const overdueRatio = timeSinceLastReview / scheduledInterval;
  if (overdueRatio <= 1.0) return 1.0;
  const forgettingRate = 1 / easeFactor;
  return Math.exp(-forgettingRate * (overdueRatio - 1));
}

export function analyzeResponseTime(responseTime, difficulty = 'medium') {
  const expectedTimes = { easy: 3000, medium: 5000, hard: 8000 };
  const expected = expectedTimes[difficulty] || expectedTimes.medium;
  const ratio = responseTime / expected;
  if (ratio < 0.5) return 1.1;
  if (ratio < 1.0) return 1.05;
  if (ratio < 2.0) return 1.0;
  return 0.95;
}

export function calculateQualityBonus(quality) {
  const bonusMap = { 0: -0.8, 1: -0.54, 2: -0.32, 3: -0.14, 4: 0, 5: 0.15 };
  return bonusMap[quality] || 0;
}

export function calculateConsistencyBonus(reviewHistory) {
  if (reviewHistory.length < 5) return 0;
  const recentReviews = reviewHistory.slice(-5);
  const avgQuality = recentReviews.reduce((sum, r) => sum + r.quality, 0) / recentReviews.length;
  if (avgQuality >= 4.0) return 0.05;
  if (avgQuality >= 3.5) return 0.02;
  return 0;
}