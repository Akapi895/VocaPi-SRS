class DashboardState {
  constructor() {
    this.data = { stats: null, weeklyProgress: null, difficultWords: null };
  }

  async loadInitialState() {
    try {
      const [stats, weeklyProgress, difficultWords] = await Promise.all([
        window.VocabAnalytics.getDashboardStats(),
        window.VocabAnalytics.getWeeklyProgress(),
        window.VocabAnalytics.getDifficultWords()
      ]);
      this.data = { stats, weeklyProgress, difficultWords };
      return this.data;
    } catch (err) {
      console.error('❌ Failed to load initial state:', err);
      return this.data;
    }
  }

  async refreshState() {
    try {
      const stats = await window.VocabAnalytics.getDashboardStats();
      const weeklyProgress = await window.VocabAnalytics.getWeeklyProgress();
      const difficultWords = await window.VocabAnalytics.getDifficultWords();
      this.data = { stats, weeklyProgress, difficultWords };
      return this.data;
    } catch (error) {
      console.error('⚠️ Error refreshing dashboard state:', error);
      return this.data;
    }
  }

  updateState(partialData) {
    this.data = { ...this.data, ...partialData };
    if (this.data.stats && window.DashboardUI) {
      window.DashboardUI.renderOverviewStats(this.data.stats);
    }
  }
}

// Export for use in extension
if (typeof window !== 'undefined') {
  window.DashboardState = DashboardState;
}
