// chuyên xử lý lịch trình review
import { calculateForgettingCurve, analyzeResponseTime, calculateQualityBonus, calculateConsistencyBonus } from "./utils.js";

export function scheduleNextReview(card, quality, responseTime, adaptiveFactor, userStats, DEFAULT_PARAMETERS) {
  const now = Date.now();
  const timeSinceLastReviewMs = card.srs.lastReviewedAt 
    ? (now - card.srs.lastReviewedAt)
    : 0;
  const timeSinceLastReviewMinutes = timeSinceLastReviewMs / (1000 * 60);

  let { interval, easeFactor, repetitions } = card.srs;
  const forgettingCurveAdjustment = calculateForgettingCurve(timeSinceLastReviewMinutes, interval, easeFactor);
  const responseTimeBonus = responseTime ? analyzeResponseTime(responseTime, card.difficulty) : 1.0;

  if (quality < 3) {
    repetitions = 0;
    if (quality <= 1) {
      interval = DEFAULT_PARAMETERS.minimumInterval;
    } else if (quality === 2) {
      interval = Math.max(30, Math.floor(interval * forgettingCurveAdjustment * 0.3));
    }
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = Math.ceil(60 * adaptiveFactor * (quality === 5 ? 4 : quality === 4 ? 2 : 1));
    } else if (repetitions === 2) {
      interval = Math.ceil(360 * adaptiveFactor * (quality === 5 ? 2 : 1));
    } else if (repetitions === 3) {
      interval = Math.ceil(1440 * adaptiveFactor * quality / 3);
    } else {
      const qualityBonus = calculateQualityBonus(quality);
      const consistencyBonus = calculateConsistencyBonus(card.reviewHistory || []);
      easeFactor = Math.min(2.5, easeFactor + qualityBonus + consistencyBonus);
      interval = Math.ceil(interval * easeFactor * adaptiveFactor * responseTimeBonus);
    }
  }

  interval = Math.max(DEFAULT_PARAMETERS.minimumInterval, interval);
  interval = Math.min(interval, DEFAULT_PARAMETERS.maximumInterval);

  const nextReviewDate = new Date(now + interval * 60 * 1000);

  return { interval, easeFactor, repetitions, nextReviewDate, forgettingCurveAdjustment, responseTimeBonus };
}
