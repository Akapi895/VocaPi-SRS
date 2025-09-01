window.AdvancedSRSAlgorithm = class AdvancedSRSAlgorithm {
  constructor() {
    this.DEFAULT_PARAMETERS = {
      requestRetention: 0.9,
      maximumInterval: 525600,
      minimumInterval: 10,
      intervalUnit: 'minutes',
      w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]
    };
  }

  calculateNextReview(card, quality, responseTime = null, userStats = {}) {
    const adaptiveFactor = this.calculateAdaptiveFactor(userStats, card.category);
    const { interval, easeFactor, repetitions, nextReviewDate, forgettingCurveAdjustment, responseTimeBonus } =
      window.scheduleNextReview(card, quality, responseTime, adaptiveFactor, userStats, this.DEFAULT_PARAMETERS);

    const now = Date.now();
    const reviewEntry = {
      date: now, quality, responseTime,
      interval: card.srs.interval || 0,
      newInterval: interval,
      easeFactor, intervalUnit: 'minutes'
    };

    return {
      interval, repetitions,
      easeFactor: Number(easeFactor.toFixed(2)),
      nextReview: nextReviewDate.getTime(),
      lastReviewedAt: now,
      reviewHistory: [...(card.srs.reviewHistory || []), reviewEntry].slice(-20),
      totalReviews: (card.srs.totalReviews || 0) + 1,
      intervalUnit: 'minutes',
      metadata: { adaptiveFactor, forgettingCurveAdjustment, responseTimeBonus }
    };
  }

  calculateAdaptiveFactor(userStats, category) {
    const overallAccuracy = userStats.accuracy || 0.8;
    const categoryAccuracy = userStats.categoryAccuracy?.[category] || overallAccuracy;
    const streakBonus = Math.min(0.2, (userStats.streak || 0) * 0.01);
    let factor = 1.0;
    if (categoryAccuracy > 0.9) factor = 1.2 + streakBonus;
    else if (categoryAccuracy < 0.7) factor = 0.8;
    return factor;
  }
};