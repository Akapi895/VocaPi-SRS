window.TimeUtils = {
    formatTimeUntilReview(isoString) {
        const now = new Date();
        const reviewTime = new Date(isoString);
        const diffMs = reviewTime.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) return 'now';
        if (diffDays === 1) return 'tomorrow';
        if (diffDays < 7) return `in ${diffDays} days`;
        if (diffDays < 30) return `in ${Math.ceil(diffDays / 7)} weeks`;
        return `in ${Math.ceil(diffDays / 30)} months`;
    },
  
  formatInterval(minutes) {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes < 1440) {
      const hours = Math.round((minutes / 60) * 10) / 10;
      return `${hours} hours`;
    } else if (minutes < 10080) {
      const days = Math.round((minutes / 1440) * 10) / 10;
      return `${days} days`;
    } else if (minutes < 43200) {
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

window.calculateForgettingCurve = function(timeSinceLastReview, scheduledInterval, easeFactor) {
  if (timeSinceLastReview <= 0 || scheduledInterval <= 0) return 1.0;
  const overdueRatio = timeSinceLastReview / scheduledInterval;
  if (overdueRatio <= 1.0) return 1.0;
  const forgettingRate = 1 / easeFactor;
  return Math.exp(-forgettingRate * (overdueRatio - 1));
};

window.analyzeResponseTime = function(responseTime, difficulty = 'medium') {
  const expectedTimes = { easy: 3000, medium: 5000, hard: 8000 };
  const expected = expectedTimes[difficulty] || expectedTimes.medium;
  const ratio = responseTime / expected;
  if (ratio < 0.5) return 1.1;
  if (ratio < 1.0) return 1.05;
  if (ratio < 2.0) return 1.0;
  return 0.95;
};

window.calculateQualityBonus = function(quality) {
  const bonusMap = { 0: -0.8, 1: -0.54, 2: -0.32, 3: -0.14, 4: 0, 5: 0.15 };
  return bonusMap[quality] || 0;
};

window.calculateConsistencyBonus = function(reviewHistory) {
  if (reviewHistory.length < 5) return 0;
  const recentReviews = reviewHistory.slice(-5);
  const avgQuality = recentReviews.reduce((sum, r) => sum + r.quality, 0) / recentReviews.length;
  if (avgQuality >= 4.0) return 0.05;
  if (avgQuality >= 3.5) return 0.02;
  return 0;
};