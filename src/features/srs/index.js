import AdvancedSRSAlgorithm from "./advanced-srs.js";
import { scheduleNextReview } from "./scheduler.js";
import { TimeUtils, calculateForgettingCurve, analyzeResponseTime, calculateQualityBonus, calculateConsistencyBonus } from "./utils.js";

if (typeof window !== "undefined") {
  window.SRS = {
    AdvancedSRSAlgorithm,
    scheduleNextReview,
    TimeUtils,
    calculateForgettingCurve,
    analyzeResponseTime,
    calculateQualityBonus,
    calculateConsistencyBonus
  };
}