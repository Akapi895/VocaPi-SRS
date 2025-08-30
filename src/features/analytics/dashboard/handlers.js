import { DashboardUI } from './ui-components.js';
import { DashboardCharts } from './charts.js';

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export class DashboardHandlers {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.charts = new DashboardCharts();
  }

  bindEvents() {
    window.addEventListener('vocabAnalyticsUpdated',
      debounce(event => this.handleAnalyticsUpdate(event), 250)
    );

    const actions = {
      'back-to-main': () => history.back(),
      'refresh-analytics': () => this.dashboard.loadDashboard(),
      'retry-analytics': () => this.dashboard.init()
    };

    Object.entries(actions).forEach(([id, handler]) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', handler);
    });
  }

  async handleAnalyticsUpdate(event) {
    console.log('📊 Dashboard received update event', event.detail);
    try {
      const [stats, weeklyProgress, difficultWords] = await Promise.all([
        window.VocabAnalytics.getDashboardStats().catch(() => ({})),
        window.VocabAnalytics.getWeeklyProgress().catch(() => []),
        window.VocabAnalytics.getDifficultWords().catch(() => [])
      ]);

      DashboardUI.renderOverviewStats(stats);
      this.charts.updateWeeklyChart(weeklyProgress);
      this.charts.updateQualityChart(stats.qualityDistribution || {});
      DashboardUI.loadLearningPatterns(stats, weeklyProgress);
      DashboardUI.renderDifficultWords(difficultWords);
    } catch (error) {
      console.warn('⚠️ Failed to update dashboard:', error);
    }
  }

  async handleRefresh() {
    console.log('🔄 Refreshing dashboard');
    await this.dashboard.loadDashboard();
  }
}
