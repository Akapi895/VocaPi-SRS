import { AnalyticsStorage } from "../../../core/storage.js";
import { recordWordReview } from "./word-tracking.js";
import * as Stats from "./stats.js";

export default class VocabAnalytics {
  constructor() {
    this.initialized = false;
    this.data = {
      wordsLearned: {},
      reviewSessions: [],
      dailyStats: {},
      totalWords: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastReviewDate: null,
      totalTimeSpent: 0,
      // ⚠️ accuracyHistory có thể bỏ nếu chưa dùng
      accuracyHistory: []
    };
    this.gamification = null;
  }

  async ensureInitialized() {
    if (this.initialized) return;
    const result = await AnalyticsStorage.getData(AnalyticsStorage.KEY);
    if (result) this.data = { ...this.data, ...result };
    this.initialized = true;
  }

  async _withInit(fn) {
    await this.ensureInitialized();
    return fn();
  }

  setGamification(gamification) {
    this.gamification = gamification;
  }

  async recordWordReview(wordId, userAnswer, correctAnswer, quality, timeSpent) {
    return this._withInit(() =>
      recordWordReview(
        this.data,
        wordId,
        userAnswer,
        correctAnswer,
        quality,
        timeSpent,
        this.gamification,
        async (_, data) => AnalyticsStorage.saveData(AnalyticsStorage.KEY, data)
      )
    );
  }

  async getAnalyticsData() {
    return this._withInit(() => ({ ...this.data }));
  }

  async getWeeklyProgress() {
    return this._withInit(() => Stats.getWeeklyProgress(this.data));
  }

  async getDashboardStats() {
    return this._withInit(() => Stats.getDashboardStats(this.data, this.gamification));
  }

  async getDifficultWords() {
    return this._withInit(() => Stats.getDifficultWords(this.data));
  }
}
