function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

class DashboardHandlers {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.charts = new window.DashboardCharts();
    this.boundHandleAnalyticsUpdate = this.handleAnalyticsUpdate.bind(this);
    this.boundHandleRefresh = this.handleRefresh.bind(this);
  }

  bindEvents() {
    window.addEventListener('vocabAnalyticsUpdated',
      debounce(this.boundHandleAnalyticsUpdate, 250)
    );

    const actions = {
      'back-to-main': () => history.back(),
      'refresh-analytics': this.boundHandleRefresh,
      'retry-analytics': () => this.dashboard.init()
    };

    Object.entries(actions).forEach(([id, handler]) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', handler);
    });
  }

  // Cleanup method to prevent memory leaks
  cleanup() {
    window.removeEventListener('vocabAnalyticsUpdated', this.boundHandleAnalyticsUpdate);
    if (this.charts) {
      this.charts.destroyAll();
    }
  }

  async handleAnalyticsUpdate(event) {
    console.log('📊 Dashboard received update event', event.detail);
    try {
      const [stats, weeklyProgress, difficultWords] = await Promise.all([
        window.VocabAnalytics.getDashboardStats().catch(() => ({})),
        window.VocabAnalytics.getWeeklyProgress().catch(() => []),
        window.VocabAnalytics.getDifficultWords().catch(() => [])
      ]);

      if (window.DashboardUI) {
        window.DashboardUI.renderOverviewStats(stats);
        window.DashboardUI.loadLearningPatterns(stats, weeklyProgress);
        window.DashboardUI.renderDifficultWords(difficultWords);
      }
      
      this.charts.updateWeeklyChart(weeklyProgress);
      this.charts.updateQualityChart(stats.qualityDistribution || {});
    } catch (error) {
      console.warn('⚠️ Failed to update dashboard:', error);
    }
  }

  async handleRefresh() {
    console.log('🔄 Refreshing dashboard');
    await this.dashboard.loadDashboard();
  }
}

// Export for use in extension
if (typeof window !== 'undefined') {
  window.DashboardHandlers = DashboardHandlers;
}
