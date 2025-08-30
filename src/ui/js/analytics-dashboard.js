import { DashboardState } from '../../features/analytics/dashboard/state.js';
import { DashboardCharts } from '../../features/analytics/dashboard/charts.js';
import { DashboardHandlers } from '../../features/analytics/dashboard/handlers.js';
import { DashboardUI } from '../../features/analytics/dashboard/ui-components.js';
import { VocabAnalytics } from '../../features/analytics/core/vocab-analytics.js';

class AnalyticsDashboard {
  constructor() {
    console.log('🚀 Initializing Analytics Dashboard');
    this.state = new DashboardState();
    this.charts = new DashboardCharts();
    this.ui = new DashboardUI();
    this.handlers = new DashboardHandlers(this);

    this.init();
  }

  async init() {
    try {
      // Đảm bảo hệ thống analytics có sẵn
      if (!window.VocabAnalytics) {
        window.VocabAnalytics = new VocabAnalytics();
      }
      await window.VocabAnalytics.ensureInitialized();

      // Load data lần đầu
      await this.loadDashboard();

      // Bind sự kiện
      this.handlers.bindEvents();

      console.log('✅ Analytics Dashboard initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Analytics Dashboard:', error);
      this.ui.showError('Failed to initialize analytics: ' + error.message);
    }
  }

  async loadDashboard() {
    try {
      this.ui.showLoading();

      const [dashboardStats, weeklyProgress, difficultWords] = await Promise.all([
        window.VocabAnalytics.getDashboardStats(),
        window.VocabAnalytics.getWeeklyProgress(),
        window.VocabAnalytics.getDifficultWords()
      ]);

      const hasData =
        dashboardStats.totalWordsLearned > 0 ||
        weeklyProgress.some(day => day.words > 0);

      if (!hasData) {
        // await this.ui.showEmptyAnalyticsState(dashboardStats);
      } else {
        this.ui.renderOverviewStats(dashboardStats);
        this.charts.createWeeklyProgressChart(weeklyProgress);
        this.charts.createQualityDistributionChart(dashboardStats.qualityDistribution);
        this.ui.loadAchievements(dashboardStats.achievements || []);
        this.ui.loadDifficultWords(difficultWords);
        this.ui.loadLearningPatterns(dashboardStats, weeklyProgress);
      }

      this.ui.hideLoading();
      console.log('✅ Dashboard data loaded');
    } catch (error) {
      console.error('❌ Error loading analytics dashboard:', error);
      // await this.ui.showFallbackAnalytics();
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AnalyticsDashboard();
});
