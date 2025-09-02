// analytics-dashboard.js - Main dashboard controller
console.log('📊 analytics-dashboard.js loaded');

class AnalyticsDashboard {
  constructor() {
    console.log('🚀 Initializing Analytics Dashboard');
    
    // ✅ Thêm event listener để refresh khi có review mới
    this.handleWordReview = this.handleWordReview.bind(this);
    window.addEventListener('wordReviewed', this.handleWordReview);

    // ✅ Thêm debug để xem có event listener nào không
    console.log('🔍 Checking for analytics events...');
    window.addEventListener('wordReviewed', (event) => {
      console.log('📊 Word reviewed event received:', event.detail);
      this.loadDashboard(); // Refresh dashboard
    });

    // Wait for dependencies to be available
    this.waitForDependencies().then(() => {
      this.initializeComponents();
      this.init();
    }).catch(error => {
      console.error('❌ Failed to wait for dependencies:', error);
      // Show fallback error instead of infinite loop
      this.showFallbackError(error);
    });
  }

  async waitForDependencies() {
    const maxWaitTime = 2000; // Giảm xuống 2 giây
    const checkInterval = 100; // Giảm interval xuống 100ms
    let elapsed = 0;

    while (elapsed < maxWaitTime) {
      // Check if all required components are available
      if (this.areDependenciesReady()) {
        console.log('✅ All dependencies are ready');
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
      elapsed += checkInterval;
      
      // Log progress every 500ms
      if (elapsed % 500 === 0) {
        console.log(`⏳ Waiting for dependencies... ${elapsed/1000}s elapsed`);
      }
    }

    // Thay vì throw error, return false để có thể handle gracefully
    console.warn('⚠️ Timeout waiting for dependencies, proceeding with available components');
    return false;
  }

  areDependenciesReady() {
    // Chỉ check các components thực sự cần thiết cho analytics
    const required = [
      'DashboardState',
      'DashboardCharts', 
      'DashboardHandlers',
      'DashboardUI'
    ];

    // VocabAnalytics có thể là class hoặc instance
    const hasAnalytics = window.VocabAnalytics || window.vocabAnalytics || window.VocabAnalyticsInstance;

    // Log để debug
    const missingComponents = required.filter(comp => !window[comp]);
    if (missingComponents.length > 0) {
      console.log(' Missing components:', missingComponents);
      console.log('🔍 Available components:', required.filter(comp => window[comp]));
    }

    return required.every(component => window[component]) && hasAnalytics;
  }

  async initGamificationUI() {
    try {
      if (window.GamificationUI && typeof window.GamificationUI === 'function') {
        this.gamificationUI = new window.GamificationUI();
        await this.gamificationUI.init();
        console.log('✅ GamificationUI initialized');
      } else {
        console.warn('⚠️ GamificationUI not available');
      }
    } catch (error) {
      console.error('❌ Failed to initialize GamificationUI:', error);
    }
  }

  initializeComponents() {
    try {
      // Check if components exist before initializing
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
      
      console.log('✅ Dashboard components initialized');
    } catch (error) {
      console.error('❌ Failed to initialize components:', error);
      // Don't throw, just log the error
    }
  }

  async init() {
    try {
      // Ensure analytics system is available - check for instance first
      let analyticsInstance = window.vocabAnalytics || window.VocabAnalyticsInstance;
      
      if (!analyticsInstance) {
        // If no instance exists, create one from class
        if (window.VocabAnalytics && typeof window.VocabAnalytics === 'function') {
          analyticsInstance = new window.VocabAnalytics();
          window.vocabAnalytics = analyticsInstance; // Cache the instance
        }
      }
      
      if (!analyticsInstance || typeof analyticsInstance.ensureInitialized !== 'function') {
        throw new Error('VocabAnalytics not properly initialized');
      }

      await analyticsInstance.ensureInitialized();

      // ✅ THÊM: Kết nối gamification với analytics
      if (window.VocabGamification && typeof window.VocabGamification === 'function') {
        const gamificationInstance = new window.VocabGamification();
        await gamificationInstance.initializeGamification();
        analyticsInstance.setGamification(gamificationInstance);
        console.log('✅ Gamification connected to analytics');
      }

      await this.initGamificationUI();

      // Load initial data
      await this.loadDashboard();

      // Bind events if handlers are available
      if (this.handlers && typeof this.handlers.bindEvents === 'function') {
        this.handlers.bindEvents();
      }

      console.log('✅ Analytics Dashboard initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Analytics Dashboard:', error);
      this.showInitializationError(error);
    }
  }

  showInitializationError(error) {
    // Show error in UI if available
    if (this.ui && typeof this.ui.showError === 'function') {
      this.ui.showError('Failed to initialize analytics: ' + error.message);
    } else {
      // Fallback error display
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
      <h4>❌ Analytics Error</h4>
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
      // Check if UI methods exist before calling
      if (this.ui && typeof this.ui.showLoading === 'function') {
        this.ui.showLoading();
      }

      await this.renderGamificationDashboard();

      // Get analytics instance
      const analyticsInstance = window.vocabAnalytics || window.VocabAnalyticsInstance;
      
      // ✅ THÊM: Force refresh analytics data
      if (analyticsInstance && typeof analyticsInstance.ensureInitialized === 'function') {
        console.log('🔄 Force refreshing analytics data...');
        // Reset initialization to force reload from storage
        analyticsInstance.initialized = false;
        await analyticsInstance.ensureInitialized();
        console.log('✅ Analytics data refreshed');
      }
      
      // ✅ THÊM: Lấy gamification data
      let gamificationData = null;
      let allAchievements = [];
      
      if (window.VocabGamification && typeof window.VocabGamification === 'function') {
        try {
          const gamificationInstance = new window.VocabGamification();
          await gamificationInstance.initializeGamification();
          
          // ✅ SỬA: Kết nối analytics với gamification TRƯỚC KHI gọi methods
          gamificationInstance.analytics = analyticsInstance;
          console.log('🔗 Analytics connected to gamification:', !!gamificationInstance.analytics);
          
          // ✅ THÊM: Verify analytics connection
          if (gamificationInstance.analytics) {
            const testData = await gamificationInstance.analytics.getAnalyticsData();
            console.log('🔍 Analytics test data:', {
              totalWords: testData?.totalWords,
              currentStreak: testData?.currentStreak,
              hasDailyStats: !!testData?.dailyStats
            });
          }
          
          gamificationData = await gamificationInstance.getPlayerStats();
          
          // ✅ THÊM: Debug logs
          console.log('🔍 Calling getAllAchievements...');
          allAchievements = await gamificationInstance.getAllAchievements();
          console.log(' getAllAchievements result:', allAchievements);
          console.log(' Achievements count:', allAchievements.length);
          console.log('🔍 Unlocked count:', allAchievements.filter(a => a.unlocked).length);
          
          console.log('🎮 Gamification data loaded:', gamificationData);
          console.log('🏆 All achievements loaded:', allAchievements);
        } catch (error) {
          console.error('❌ Failed to load gamification data:', error);
        }
      } else {
        console.warn('⚠️ VocabGamification not available');
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

      // ✅ THÊM: Merge gamification data vào dashboard stats
      if (gamificationData) {
        dashboardStats.totalXP = gamificationData.currentXP || 0;
        dashboardStats.achievementCount = gamificationData.achievementCount || 0;
        dashboardStats.level = gamificationData.level || 1;
        dashboardStats.title = gamificationData.title || 'Beginner';
      }

      console.log('📊 Dashboard data loaded:', {
        totalWords: dashboardStats.totalWordsLearned,
        currentStreak: dashboardStats.currentStreak,
        todayAccuracy: dashboardStats.todayAccuracy,
        totalXP: dashboardStats.totalXP,
        achievements: allAchievements.length
      });

      const hasData = this.checkDataAvailability(dashboardStats, weeklyProgress);

      if (!hasData) {
        await this.showEmptyState(dashboardStats);
      } else {
        await this.renderDashboardData(dashboardStats, weeklyProgress, difficultWords, allAchievements);
      }

      if (this.ui && typeof this.ui.hideLoading === 'function') {
        this.ui.hideLoading();
      }
      console.log('✅ Dashboard data loaded');
    } catch (error) {
      console.error('❌ Error loading analytics dashboard:', error);
      await this.showFallbackAnalytics();
    }
  }

  async renderGamificationDashboard() {
    try {
      const container = document.getElementById('gamification-dashboard');
      if (!container) {
        console.warn('⚠️ gamification-dashboard container not found');
        return;
      }

      if (this.gamificationUI && typeof this.gamificationUI.renderDashboard === 'function') {
        await this.gamificationUI.renderDashboard(container);
        console.log('✅ Gamification dashboard rendered');
      } else {
        // Fallback gamification display
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
      console.error('❌ Error rendering gamification dashboard:', error);
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
      (dashboardStats && dashboardStats.totalWords > 0)  // ✅ Thêm check totalWords
    );
  }

  async showEmptyState(dashboardStats) {
    console.log('📊 Showing empty analytics state');
    // Show empty state UI - check if method exists
    if (this.ui && typeof this.ui.showEmptyState === 'function') {
      await this.ui.showEmptyState(dashboardStats);
    } else {
      // Fallback empty state
      this.showFallbackEmptyState();
    }
  }

  showFallbackEmptyState() {
    const container = document.querySelector('.analytics-container') || document.body;
    const emptyDiv = document.createElement('div');
    emptyDiv.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <h3>📊 No Analytics Data Yet</h3>
        <p>Complete some word reviews to see your learning analytics!</p>
      </div>
    `;
    container.appendChild(emptyDiv);
  }

  async renderDashboardData(dashboardStats, weeklyProgress, difficultWords, achievements = []) {
    try {
      console.log('🔍 renderDashboardData called with:', {
        dashboardStats,
        weeklyProgress: weeklyProgress?.length,
        difficultWords: difficultWords?.length,
        achievements: achievements?.length
      });

      // Check if UI methods exist before calling
      if (this.ui && typeof this.ui.renderOverviewStats === 'function') {
        this.ui.renderOverviewStats(dashboardStats);
      }
      
      // ✅ THÊM: Cập nhật XP display riêng biệt
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
      
      // ✅ THÊM: Debug cho learning patterns
      if (this.ui && typeof this.ui.loadLearningPatterns === 'function') {
        console.log('🔍 Calling loadLearningPatterns with:', {
          bestStudyTime: dashboardStats.bestStudyTime,
          mostActiveDay: dashboardStats.mostActiveDay,
          avgSessionLength: dashboardStats.avgSessionLength,
          overallAccuracy: dashboardStats.overallAccuracy
        });
        this.ui.loadLearningPatterns(dashboardStats, weeklyProgress);
      } else {
        console.warn('⚠️ loadLearningPatterns method not available');
      }
      
    } catch (error) {
      console.error('❌ Error rendering dashboard data:', error);
    }
  }

  async showFallbackAnalytics() {
    console.log('📊 Showing fallback analytics');
    // Show fallback UI with basic stats
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

  // Cleanup method
  destroy() {
    window.removeEventListener('wordReviewed', this.handleWordReview);
    if (this.handlers && typeof this.handlers.cleanup === 'function') {
      this.handlers.cleanup();
    }
    if (this.charts && typeof this.charts.destroyAll === 'function') {
      this.charts.destroyAll();
    }
    console.log('🧹 Analytics Dashboard cleaned up');
  }

  // Thêm hàm xử lý sự kiện wordReviewed
  handleWordReview(event) {
    console.log('📊 Dashboard received word review event:', event.detail);
    // Refresh dashboard data
    this.loadDashboard();
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.analyticsDashboard = new AnalyticsDashboard();
  });
} else {
  // DOM already loaded
  window.analyticsDashboard = new AnalyticsDashboard();
}

// Export for use in extension
if (typeof window !== 'undefined') {
  window.AnalyticsDashboard = AnalyticsDashboard;
}
