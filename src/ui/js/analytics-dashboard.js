// analytics-dashboard.js - Main dashboard controller


class AnalyticsDashboard {
  constructor() {
    this.handleWordReview = this.handleWordReview.bind(this);
    window.addEventListener('wordReviewed', this.handleWordReview);

    window.addEventListener('wordReviewed', (event) => {
      this.loadDashboard();
    });

    // Wait for dependencies to be available
    this.waitForDependencies().then(() => {
      this.initializeComponents();
      this.init();
    }).catch(error => {
      this.showFallbackError(error);
    });
  }

  async waitForDependencies() {
    const maxWaitTime = 2000;
    const checkInterval = 100;
    let elapsed = 0;

    while (elapsed < maxWaitTime) {
      if (this.areDependenciesReady()) {
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
      elapsed += checkInterval;
    }

    return false;
  }

  areDependenciesReady() {
    const required = [
      'DashboardState',
      'DashboardCharts', 
      'DashboardHandlers',
      'DashboardUI'
    ];

    const hasAnalytics = window.VocabAnalytics || window.vocabAnalytics || window.VocabAnalyticsInstance;

    return required.every(component => window[component]) && hasAnalytics;
  }

  async initGamificationUI() {
    try {
      if (window.GamificationUI && typeof window.GamificationUI === 'function') {
        this.gamificationUI = new window.GamificationUI();
        await this.gamificationUI.init();
      }
    } catch (error) {
      console.error('Failed to initialize GamificationUI:', error);
    }
  }

  initializeComponents() {
    try {
      if (window.DashboardState) {
        this.state = new window.DashboardState();
      }
      
      if (window.DashboardCharts) {
        this.charts = new window.DashboardCharts();
      }
      
      if (window.DashboardUI) {
        this.ui = new window.DashboardUI();
      }
      
      if (window.DashboardHandlers) {
        this.handlers = new window.DashboardHandlers(this);
      }
    } catch (error) {
      console.error('Failed to initialize components:', error);
    }
  }

  async init() {
    try {
      let analyticsInstance = window.vocabAnalytics || window.VocabAnalyticsInstance;
      
      if (!analyticsInstance) {
        if (window.VocabAnalytics && typeof window.VocabAnalytics === 'function') {
          analyticsInstance = new window.VocabAnalytics();
          window.vocabAnalytics = analyticsInstance;
        }
      }
      
      if (!analyticsInstance || typeof analyticsInstance.ensureInitialized !== 'function') {
        throw new Error('VocabAnalytics not properly initialized');
      }

      await analyticsInstance.ensureInitialized();

      if (window.VocabGamification && typeof window.VocabGamification === 'function') {
        const gamificationInstance = new window.VocabGamification();
        await gamificationInstance.initializeGamification();
        analyticsInstance.setGamification(gamificationInstance);
      }

      await this.initGamificationUI();
      await this.loadDashboard();

      if (this.handlers && typeof this.handlers.bindEvents === 'function') {
        this.handlers.bindEvents();
      }
    } catch (error) {
      console.error('Failed to initialize Analytics Dashboard:', error);
      this.showInitializationError(error);
    }
  }

  showInitializationError(error) {
    if (this.ui && typeof this.ui.showError === 'function') {
      this.ui.showError('Failed to initialize analytics: ' + error.message);
    } else {
      this.showFallbackError(error);
    }
  }

  showFallbackError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 16px;
      border-radius: 8px;
      z-index: 10000;
      max-width: 300px;
      font-family: Arial, sans-serif;
    `;
    errorDiv.innerHTML = `
      <h4>Analytics Error</h4>
      <p>${error.message}</p>
      <button onclick="this.parentElement.remove()" style="
        background: white;
        color: #ef4444;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 8px;
      ">Close</button>
    `;
    document.body.appendChild(errorDiv);
  }

  async loadDashboard() {
    try {
      if (this.ui && typeof this.ui.showLoading === 'function') {
        this.ui.showLoading();
      }

      await this.renderGamificationDashboard();

      const analyticsInstance = window.vocabAnalytics || window.VocabAnalyticsInstance;
      
      if (analyticsInstance && typeof analyticsInstance.ensureInitialized === 'function') {
        analyticsInstance.initialized = false;
        await analyticsInstance.ensureInitialized();
      }
      
      let gamificationData = null;
      let allAchievements = [];
      
      if (window.VocabGamification && typeof window.VocabGamification === 'function') {
        try {
          const gamificationInstance = new window.VocabGamification();
          await gamificationInstance.initializeGamification();
          
          gamificationInstance.analytics = analyticsInstance;
          
          gamificationData = await gamificationInstance.getPlayerStats();
          allAchievements = await gamificationInstance.getAllAchievements();
        } catch (error) {
          console.error('Failed to load gamification data:', error);
        }
      }
      
      const [dashboardStats, weeklyProgress, difficultWords] = await Promise.all([
        analyticsInstance.getDashboardStats().catch(err => {
          console.warn('Failed to get dashboard stats:', err);
          return this.getFallbackStats();
        }),
        analyticsInstance.getWeeklyProgress().catch(err => {
          console.warn('Failed to get weekly progress:', err);
          return this.getFallbackWeeklyProgress();
        }),
        analyticsInstance.getDifficultWords().catch(err => {
          console.warn('Failed to get difficult words:', err);
          return [];
        })
      ]);

      if (gamificationData) {
        dashboardStats.totalXP = gamificationData.currentXP || 0;
        dashboardStats.achievementCount = gamificationData.achievementCount || 0;
        dashboardStats.level = gamificationData.level || 1;
        dashboardStats.title = gamificationData.title || 'Beginner';
      }

      const hasData = this.checkDataAvailability(dashboardStats, weeklyProgress);

      if (!hasData) {
        await this.showEmptyState(dashboardStats);
      } else {
        await this.renderDashboardData(dashboardStats, weeklyProgress, difficultWords, allAchievements);
      }

      if (this.ui && typeof this.ui.hideLoading === 'function') {
        this.ui.hideLoading();
      }
    } catch (error) {
      console.error('Error loading analytics dashboard:', error);
      await this.showFallbackAnalytics();
    }
  }

  async renderGamificationDashboard() {
    try {
      const container = document.getElementById('gamification-dashboard');
      if (!container) {
        return;
      }

      if (this.gamificationUI && typeof this.gamificationUI.renderDashboard === 'function') {
        await this.gamificationUI.renderDashboard(container);
      } else {
        container.innerHTML = `
          <div class="gamification-placeholder">
            <div class="placeholder-content">
              <div class="placeholder-icon">🎮</div>
              <h3>Gamification Dashboard</h3>
              <p>Complete some word reviews to unlock gamification data!</p>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error rendering gamification dashboard:', error);
      const container = document.getElementById('gamification-dashboard');
      if (container) {
        container.innerHTML = `
          <div class="gamification-error">
            <span class="error-icon">⚠️</span>
            <p>Unable to load gamification data</p>
            <small>${error.message}</small>
          </div>
        `;
      }
    }
  }

  checkDataAvailability(dashboardStats, weeklyProgress) {
    return (
      (dashboardStats && dashboardStats.totalWordsLearned > 0) ||
      (weeklyProgress && weeklyProgress.some(day => day.words > 0)) ||
      (dashboardStats && dashboardStats.totalWords > 0)
    );
  }

  async showEmptyState(dashboardStats) {
    if (this.ui && typeof this.ui.showEmptyState === 'function') {
      await this.ui.showEmptyState(dashboardStats);
    } else {
      this.showFallbackEmptyState();
    }
  }

  showFallbackEmptyState() {
    const container = document.querySelector('.analytics-container') || document.body;
    const emptyDiv = document.createElement('div');
    emptyDiv.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <h3>No Analytics Data Yet</h3>
        <p>Complete some word reviews to see your learning analytics!</p>
      </div>
    `;
    container.appendChild(emptyDiv);
  }

  async renderDashboardData(dashboardStats, weeklyProgress, difficultWords, achievements = []) {
    try {
      if (this.ui && typeof this.ui.renderOverviewStats === 'function') {
        this.ui.renderOverviewStats(dashboardStats);
      }
      
      if (this.ui && typeof this.ui.updateXPDisplay === 'function') {
        this.ui.updateXPDisplay(dashboardStats.totalXP);
      }
      
      if (this.charts && typeof this.charts.createWeeklyProgressChart === 'function') {
        this.charts.createWeeklyProgressChart(weeklyProgress);
      }
      
      if (this.charts && typeof this.charts.createQualityDistributionChart === 'function') {
        this.charts.createQualityDistributionChart(dashboardStats.qualityDistribution || {});
      }
      
      if (this.ui && typeof this.ui.loadAchievements === 'function') {
        this.ui.loadAchievements(achievements);
      }
      
      if (this.ui && typeof this.ui.loadDifficultWords === 'function') {
        this.ui.loadDifficultWords(difficultWords);
      }
      
      if (this.ui && typeof this.ui.loadLearningPatterns === 'function') {
        this.ui.loadLearningPatterns(dashboardStats, weeklyProgress);
      }
      
    } catch (error) {
      console.error('Error rendering dashboard data:', error);
    }
  }

  async showFallbackAnalytics() {
    if (this.ui && typeof this.ui.showFallbackAnalytics === 'function') {
      await this.ui.showFallbackAnalytics();
    } else {
      this.showFallbackError(new Error('Analytics system unavailable'));
    }
  }

  getFallbackStats() {
    return {
      totalWordsLearned: 0,
      currentStreak: 0,
      totalTimeSpent: 0,
      todayAccuracy: 0,
      totalXP: 0,
      achievementCount: 0,
      weeklyProgress: this.getFallbackWeeklyProgress(),
      qualityDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      bestStudyTime: 'No data',
      mostActiveDay: 'No data',
      avgSessionLength: 0,
      overallAccuracy: 0
    };
  }

  getFallbackWeeklyProgress() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      date: new Date().toDateString(),
      words: 0,
      time: 0
    }));
  }

  destroy() {
    window.removeEventListener('wordReviewed', this.handleWordReview);
    if (this.handlers && typeof this.handlers.cleanup === 'function') {
      this.handlers.cleanup();
    }
    if (this.charts && typeof this.charts.destroyAll === 'function') {
      this.charts.destroyAll();
    }
  }

  handleWordReview(event) {
    this.loadDashboard();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.analyticsDashboard = new AnalyticsDashboard();
  });
} else {
  window.analyticsDashboard = new AnalyticsDashboard();
}

if (typeof window !== 'undefined') {
  window.AnalyticsDashboard = AnalyticsDashboard;
}
