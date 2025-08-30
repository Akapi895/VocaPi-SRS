import { DateUtils } from "./date.js";
import { StorageManager, VocabStorage } from "./storage.js";
import { TextUtils } from "./text.js";
import {
  AdvancedSRSAlgorithm,
  scheduleNextReview,
  TimeUtils as SRSTimeUtils,
  calculateForgettingCurve,
  analyzeResponseTime,
  calculateQualityBonus,
  calculateConsistencyBonus
} from "../features/srs/index.js";

export const SRSAlgorithm = {
  updateCard(srsData, quality, options = {}) {
    try {
      if (options.useAdvanced) {
        const advanced = new AdvancedSRSAlgorithm();
        const card = {
          srs: srsData,
          category: options.category,
          difficulty: options.difficulty,
          reviewHistory: options.reviewHistory || []
        };
        const updated = advanced.calculateNextReview(
          card, quality, options.responseTime, options.userStats || {}
        );
        const norm = this.normalizeSRSData(
          typeof updated.nextReview === "number"
            ? { ...updated, nextReview: new Date(updated.nextReview).toISOString() }
            : updated
        );
        return norm;
      }
      return this.fallbackSM2Algorithm(srsData, quality);
    } catch (e) {
      console.error("SRSAlgorithm error:", e);
      return this.fallbackSM2Algorithm(srsData, quality);
    }
  },

  fallbackSM2Algorithm(srsData, quality) {
    let u = { ...srsData };
    u.repetitions = u.repetitions || 0;
    u.interval = u.interval || 10;
    u.easeFactor = u.easeFactor || 2.5;

    if (quality >= 3) {
      u.repetitions += 1;
      u.interval = Math.round(u.interval * u.easeFactor);
      u.easeFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
      if (u.easeFactor < 1.3) u.easeFactor = 1.3;
    } else {
      u.repetitions = 0;
      u.interval = quality <= 1 ? 10 : 30;
      u.easeFactor = Math.max(1.3, u.easeFactor - 0.2);
    }

    u.interval = Math.max(10, Math.min(525600, u.interval));
    u.nextReview = new Date(Date.now() + u.interval * 60000).toISOString();
    return u;
  },

  normalizeSRSData(srs) {
    return {
      repetitions: Math.max(0, srs.repetitions || 0),
      interval: Math.max(1, srs.interval || 1),
      easeFactor: Math.max(1.3, Math.min(2.5, srs.easeFactor || 2.5)),
      nextReview: typeof srs.nextReview === "number"
        ? new Date(srs.nextReview).toISOString()
        : srs.nextReview,
      lastReviewedAt: srs.lastReviewedAt || Date.now(),
      totalReviews: Math.max(0, srs.totalReviews || 0),
      reviewHistory: Array.isArray(srs.reviewHistory) ? srs.reviewHistory : []
    };
  }
};

export function calculateAccuracy(reviewed, correct) {
  if (!reviewed || reviewed === 0) return 0;
  return Math.round((correct / reviewed) * 100);
}

export { DateUtils, StorageManager, VocabStorage, TextUtils, SRSTimeUtils, calculateAccuracy };
