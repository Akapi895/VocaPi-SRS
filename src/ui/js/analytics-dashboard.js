// Analytics Dashboard JavaScript
class AnalyticsDashboard {
  constructor() {
    this.charts = {};
    this.gamificationUI = null;
    
    // Ensure analytics is available before continuing
    if (!this.ensureAnalyticsAvailable()) {
      return; // Stop initialization if analytics not available
    }
    
    this.init();
  }
  
  ensureAnalyticsAvailable() {
    // Comprehensive check and fix
    console.log('🔍 Ensuring analytics availability...');
    
    // Check 1: VocabAnalytics class (main requirement)
    if (typeof VocabAnalytics === 'undefined') {
      console.error('❌ VocabAnalytics class not found');
      this.showErrorMessage('Analytics system not loaded. Please check if scripts are loaded correctly.');
      return false;
    }
    
    // Check 2: VocabGamification class (for XP and achievements)
    if (typeof VocabGamification === 'undefined') {
      console.warn('⚠️ VocabGamification class not found - XP and achievements may not work');
    }
    
    // Check 3: Global instance
    if (!window.VocabAnalytics) {
      console.log('📊 Creating VocabAnalytics instance...');
      try {
        window.VocabAnalytics = new VocabAnalytics();
        console.log('✅ VocabAnalytics instance created successfully');
      } catch (error) {
        console.error('❌ Failed to create VocabAnalytics instance:', error);
        this.showErrorMessage('Failed to initialize analytics system: ' + error.message);
        return false;
      }
    }
    
    // Check 4: Link VocabGamification if available
    if (typeof VocabGamification !== 'undefined' && !window.VocabGamification) {
      console.log('🎮 Creating VocabGamification instance...');
      try {
        window.VocabGamification = new VocabGamification();
        // Link the systems
        window.VocabAnalytics.gamification = window.VocabGamification;
        window.VocabGamification.analytics = window.VocabAnalytics;
        console.log('✅ VocabGamification instance created and linked');
      } catch (error) {
        console.warn('⚠️ Failed to create VocabGamification instance:', error);
      }
    }
    
    console.log('✅ Analytics availability check passed');
    return true;
  }
  
  showErrorMessage(message) {
    const container = document.querySelector('.analytics-container');
    if (container) {
      container.innerHTML = `
        <div class="error-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; text-align: center;">
          <div class="error-icon" style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
          <h3 style="color: #ef4444; margin-bottom: 1rem;">Analytics System Error</h3>
          <p style="color: #6b7280; margin-bottom: 2rem; max-width: 500px;">${message}</p>
          <button onclick="location.reload()" class="btn btn-primary">Refresh Page</button>
        </div>
      `;
    }
  }
  
  async init() {
    console.log('🚀 Initializing Analytics Dashboard');
    
    try {
      // Initialize both analytics and gamification systems
      if (window.VocabAnalytics && window.VocabAnalytics.ensureInitialized) {
        await window.VocabAnalytics.ensureInitialized();
        console.log('✅ Analytics system initialized');
      }
      
      if (window.VocabGamification && window.VocabGamification.initializeGamification) {
        await window.VocabGamification.initializeGamification();
        console.log('✅ Gamification system initialized');
      }
      
      // Initialize gamification UI if available
      if (typeof GamificationUI !== 'undefined') {
        this.gamificationUI = new GamificationUI();
        await this.gamificationUI.init();
        console.log('✅ Gamification UI initialized');
      }
      
      await this.loadDashboard();
      console.log('✅ Analytics Dashboard loaded successfully');
      
      // Bind events after successful initialization
      this.bindEvents();
    } catch (error) {
      console.error('❌ Failed to initialize Analytics Dashboard:', error);
      this.showErrorMessage('Failed to initialize analytics: ' + error.message);
    }
  }

  async loadDashboard() {
    try {
      this.showLoading();
      console.log('🔄 Loading analytics dashboard...');
      
      // Ensure DOM is ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }
      
      // Verify required DOM elements exist
      const requiredElements = ['weekly-progress-chart', 'quality-chart', 'total-words', 'current-streak'];
      const missingElements = requiredElements.filter(id => !document.getElementById(id));
      
      if (missingElements.length > 0) {
        console.error('Missing required DOM elements:', missingElements);
        throw new Error(`Required elements not found: ${missingElements.join(', ')}`);
      }
      
      // Clear any existing charts to prevent conflicts
      if (this.charts.weeklyProgress) {
        this.charts.weeklyProgress.destroy();
        this.charts.weeklyProgress = null;
      }
      if (this.charts.qualityDistribution) {
        this.charts.qualityDistribution.destroy();
        this.charts.qualityDistribution = null;
      }
      
      // Ensure VocabAnalytics is initialized
      if (!window.VocabAnalytics) {
        console.log('⚙️ Initializing VocabAnalytics...');
        if (typeof VocabAnalytics === 'undefined') {
          throw new Error('VocabAnalytics class not loaded. Please check script loading order.');
        }
        window.VocabAnalytics = new VocabAnalytics();
      }
      
      // Ensure analytics is properly initialized
      await window.VocabAnalytics.ensureInitialized();
      console.log('✅ VocabAnalytics initialized');
      
      console.log('📊 Loading analytics data...');
      
      // Load analytics data with timeout and error handling
      const loadWithTimeout = (promise, timeout = 10000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Operation timed out')), timeout)
          )
        ]);
      };
      
      const [dashboardStats, weeklyProgress, difficultWords, recentAchievements] = await Promise.all([
        loadWithTimeout(window.VocabAnalytics.getDashboardStats().catch(err => {
          console.warn('Dashboard stats failed:', err);
          return this.getDefaultDashboardStats();
        })),
        loadWithTimeout(window.VocabAnalytics.getWeeklyProgress().catch(err => {
          console.warn('Weekly progress failed:', err);
          return this.getDefaultWeeklyProgress();
        })),
        loadWithTimeout(window.VocabAnalytics.getDifficultWords(8).catch(err => {
          console.warn('Difficult words failed:', err);
          return [];
        })),
        loadWithTimeout(window.VocabAnalytics.getRecentAchievements(6).catch(err => {
          console.warn('Recent achievements failed:', err);
          return [];
        }))
      ]);
      
      console.log('📊 Analytics data loaded:', { dashboardStats, weeklyProgress });
      
      // Check if we have meaningful data
      const hasData = dashboardStats.totalWords > 0 || 
                     dashboardStats.totalSessions > 0 ||
                     dashboardStats.totalTime > 0 ||
                     dashboardStats.totalXP > 0 ||
                     weeklyProgress.some(day => day.words > 0);
      
      console.log('📊 Has meaningful data:', hasData);
      
      if (!hasData) {
        console.log('📊 No analytics data found - showing empty state');
        // Instead of creating fake data, just show empty state with real vocabulary count
        await this.showEmptyAnalyticsState(dashboardStats);
      } else {
        console.log('📊 Displaying real analytics data');
        // Update UI with real data
        this.updateOverviewStats(dashboardStats);
        
        // Create charts with real data
        try {
          this.createWeeklyProgressChart(weeklyProgress);
          console.log('✅ Weekly progress chart created');
        } catch (error) {
          console.error('❌ Failed to create weekly progress chart:', error);
        }
        
        try {
          this.createQualityDistributionChart(dashboardStats.qualityDistribution || {});
          console.log('✅ Quality distribution chart created');
        } catch (error) {
          console.error('❌ Failed to create quality distribution chart:', error);
        }
        
        this.loadAchievements(recentAchievements);
        this.loadDifficultWords(difficultWords);
        this.loadLearningPatterns(dashboardStats, weeklyProgress);
        
        // Load gamification dashboard
        await this.loadGamificationDashboard();
      }
      
      // Add debug info
      this.addDebugInfo(dashboardStats);
      
      this.hideLoading();
      console.log('✅ Dashboard loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading analytics dashboard:', error);
      
      // Try fallback to show basic analytics
      try {
        console.log('🔄 Attempting fallback analytics...');
        await this.showFallbackAnalytics();
      } catch (fallbackError) {
        console.error('❌ Fallback analytics also failed:', fallbackError);
        
        let errorMessage = 'Failed to load analytics data. ';
        
        if (!window.chrome || !window.chrome.storage) {
          errorMessage += 'Chrome storage not available. ';
        } else if (typeof VocabAnalytics === 'undefined') {
          errorMessage += 'Analytics system not loaded. ';
        } else if (!window.VocabAnalytics) {
          errorMessage += 'Analytics instance not created. ';
        } else {
          errorMessage += `Error: ${error.message} `;
        }
        
        errorMessage += 'Please try refreshing.';
        
        this.showError(errorMessage);
      }
    }
  }
  
  getDefaultDashboardStats() {
    return {
      totalWords: 0,
      totalTime: 0,
      totalSessions: 0,
      todayWords: 0,
      todayTime: 0,
      todayAccuracy: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalXP: 0,
      achievementCount: 0,
      qualityDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
  
  getDefaultWeeklyProgress() {
    const today = new Date();
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      weeklyProgress.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toISOString().split('T')[0],
        words: 0,
        time: 0
      });
    }
    return weeklyProgress;
  }

  async loadGamificationDashboard() {
    if (!this.gamificationUI) return;
    
    try {
      const container = document.getElementById('gamification-dashboard');
      if (container) {
        await this.gamificationUI.renderDashboard(container);
        console.log('✅ Gamification dashboard rendered');
      }
    } catch (error) {
      console.error('❌ Error loading gamification dashboard:', error);
    }
  }
  // DEPRECATED: No longer creating fake data, showing real data only
  /*
  async populateFromVocabularyData(currentStats) {
    try {
      console.log('Populating analytics from vocabulary data...');
      
      // Get vocabulary data
      const vocabData = await new Promise((resolve) => {
        if (chrome && chrome.storage) {
          chrome.storage.local.get(['vocabWords'], (result) => {
            resolve(result.vocabWords || []);
          });
        } else {
          resolve([]);
        }
      });
      
      if (!vocabData || vocabData.length === 0) {
        console.log('No vocabulary data found, creating minimal sample data...');
        await this.createMinimalSampleData();
        return;
      }
      
      console.log(`Found ${vocabData.length} vocabulary words`);
      
      // Calculate stats from vocabulary data
      const analyticsData = await window.VocabAnalytics.getDashboardStats();
      
      // Update stats based on vocabulary - but don't override totalWordsLearned
      // totalWordsLearned should only be updated when words are actually reviewed
      // Set it to number of unique words that have been reviewed (have wordDifficulty entries)
      const reviewedUniqueWords = Object.keys(analyticsData.wordDifficulty || {}).length;
      analyticsData.totalWordsLearned = Math.max(reviewedUniqueWords, analyticsData.totalWordsLearned || 0);
      
      // Create some realistic historical data
      const today = new Date().toISOString().split('T')[0];
      const reviewedWords = vocabData.filter(word => 
        word.reviewHistory && word.reviewHistory.length > 0
      );
      
      if (reviewedWords.length > 0) {
        // Set some basic stats
        analyticsData.totalReviewSessions = Math.max(1, Math.floor(reviewedWords.length / 3));
        analyticsData.totalTimeSpent = reviewedWords.length * 2; // 2 min per word
        
        // Create today's stats if user has reviewed words
        if (!analyticsData.dailyStats[today]) {
          analyticsData.dailyStats[today] = {
            wordsReviewed: Math.min(reviewedWords.length, 10),
            timeSpent: Math.min(reviewedWords.length * 2, 20),
            sessions: 1,
            accuracy: 75 + Math.floor(Math.random() * 20) // 75-95%
          };
        }
        
        // Set streak based on activity
        analyticsData.currentStreak = reviewedWords.length > 5 ? Math.floor(reviewedWords.length / 5) : 0;
        analyticsData.longestStreak = Math.max(analyticsData.currentStreak, Math.floor(reviewedWords.length / 3));
        analyticsData.lastStudyDate = today;
        
        // Create quality distribution based on word difficulty
        reviewedWords.forEach(word => {
          const quality = word.difficulty || 3;
          analyticsData.qualityDistribution[quality] = (analyticsData.qualityDistribution[quality] || 0) + 1;
        });
        
        // Add some XP and achievements
        analyticsData.totalXP = reviewedWords.length * 15 + vocabData.length * 5;
        
        if (!analyticsData.achievements.find(a => a.id === 'first_word')) {
          analyticsData.achievements.push({
            id: 'first_word',
            name: 'First Step',
            description: 'Added your first word',
            icon: '📝',
            xp: 50,
            unlockedAt: new Date().toISOString()
          });
        }
        
        if (vocabData.length >= 10 && !analyticsData.achievements.find(a => a.id === 'vocab_10')) {
          analyticsData.achievements.push({
            id: 'vocab_10',
            name: 'Growing Collection',
            description: 'Added 10 words to your vocabulary',
            icon: '📚',
            xp: 100,
            unlockedAt: new Date().toISOString()
          });
        }
      }
      
      // Save updated analytics data
      await window.VocabAnalytics.saveAnalyticsData(analyticsData);
      console.log('Analytics data populated from vocabulary successfully');
      
    } catch (error) {
      console.error('Error populating from vocabulary data:', error);
    }
  }
  
  async createMinimalSampleData() {
    console.log('Creating minimal sample data...');
    
    const analyticsData = await window.VocabAnalytics.getDashboardStats();
    const today = new Date().toISOString().split('T')[0];
    
    // Set minimal but realistic data
    analyticsData.totalWordsLearned = 5;
    analyticsData.totalReviewSessions = 2;
    analyticsData.totalTimeSpent = 10;
    analyticsData.currentStreak = 1;
    analyticsData.longestStreak = 1;
    analyticsData.lastStudyDate = today;
    analyticsData.totalXP = 100;
    
    // Today's stats
    analyticsData.dailyStats[today] = {
      wordsReviewed: 3,
      timeSpent: 8,
      sessions: 1,
      accuracy: 80
    };
    
    // Basic quality distribution
    analyticsData.qualityDistribution = { 0: 0, 1: 1, 2: 1, 3: 2, 4: 1, 5: 0 };
    
    // First achievement
    analyticsData.achievements = [{
      id: 'first_word',
      name: 'First Step',
      description: 'Added your first word',
      icon: '📝',
      xp: 50,
      unlockedAt: new Date().toISOString()
    }];
    
    await window.VocabAnalytics.saveAnalyticsData(analyticsData);
    console.log('Minimal sample data created');
  }
  */
  // END DEPRECATED METHODS
  
  async showEmptyAnalyticsState(stats) {
    console.log('Showing empty analytics state with real vocabulary count...');
    
    // Get actual vocabulary count from storage
    let vocabCount = 0;
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await new Promise((resolve) => {
          chrome.storage.local.get(['vocabWords'], (data) => {
            resolve(data);
          });
        });
        
        if (result.vocabWords && Array.isArray(result.vocabWords)) {
          vocabCount = result.vocabWords.length;
        }
      }
    } catch (error) {
      console.warn('Could not get vocabulary count:', error);
    }
    
    // Show stats with real vocab count but zero analytics
    const emptyStats = {
      totalWordsLearned: vocabCount, // Show actual vocabulary count
      totalWords: vocabCount,
      totalTime: 0,
      totalSessions: 0,
      todayWords: 0,
      todayTime: 0,
      todayAccuracy: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalXP: 0,
      achievementCount: 0,
      qualityDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
    
    this.updateOverviewStats(emptyStats);
    
    // Create empty charts
    this.createWeeklyProgressChart([]);
    this.createQualityDistributionChart(emptyStats.qualityDistribution);
    
    // Show empty sections with helpful messages
    this.loadAchievements([]);
    this.loadDifficultWords([]);
    this.loadLearningPatterns(emptyStats, []);
    
    this.hideLoading();
    
    // Show informative message
    setTimeout(() => {
      const messageDiv = document.createElement('div');
      messageDiv.innerHTML = `
        <div style="
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #60a5fa;
          padding: 20px;
          margin: 20px;
          border-radius: 12px;
          text-align: center;
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
          <h3 style="margin: 0 0 12px 0; color: white;">Start Your Learning Journey!</h3>
          <p style="margin: 0 0 16px 0; opacity: 0.8;">
            You have ${vocabCount} word${vocabCount !== 1 ? 's' : ''} in your vocabulary.
            ${vocabCount > 0 ? 'Start reviewing them to see your progress analytics!' : 'Add some words and start reviewing to track your progress!'}
          </p>
          <div style="font-size: 14px; opacity: 0.7;">
            💡 Tip: Review at least 5 words daily to build your learning streak
          </div>
        </div>
      `;
      
      const container = document.querySelector('.analytics-container');
      if (container && !container.querySelector('.empty-state-message')) {
        messageDiv.className = 'empty-state-message';
        container.appendChild(messageDiv);
      }
    }, 500);
  }
  
  async showFallbackAnalytics() {
    console.log('Showing fallback analytics without fake data...');
    
    // Show basic stats with zeros
    const fallbackStats = {
      totalWords: 0,
      totalTime: 0,
      totalSessions: 0,
      todayWords: 0,
      todayTime: 0,
      todayAccuracy: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalXP: 0,
      achievementCount: 0,
      qualityDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
    
    // Get actual vocab count if available
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        const result = await new Promise((resolve) => {
          chrome.storage.local.get(['vocabWords'], (data) => {
            resolve(data);
          });
        });
        
        if (result.vocabWords && Array.isArray(result.vocabWords)) {
          fallbackStats.totalWords = result.vocabWords.length;
          console.log(`Found ${result.vocabWords.length} words in vocabulary`);
        }
      } catch (error) {
        console.warn('Could not load word count:', error);
      }
    }
    
    this.updateOverviewStats(fallbackStats);
    
    // Create empty charts
    this.createWeeklyProgressChart([]);
    this.createQualityDistributionChart(fallbackStats.qualityDistribution);
    
    // Show empty sections
    this.loadAchievements([]);
    this.loadDifficultWords([]);
    this.loadLearningPatterns(fallbackStats, []);
    
    this.hideLoading();
    
    // Show warning message about system availability
    setTimeout(() => {
      const warningDiv = document.createElement('div');
      warningDiv.innerHTML = `
        <div style="
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          color: #f59e0b;
          padding: 15px;
          margin: 20px;
          border-radius: 8px;
          text-align: center;
        ">
          ⚠️ Analytics system is not fully available. This may be because:
          <ul style="text-align: left; margin-top: 10px;">
            <li>Chrome extension context is not loaded</li>
            <li>Analytics data hasn't been initialized</li>
            <li>No review sessions have been completed yet</li>
          </ul>
          Try refreshing or start reviewing words to activate analytics.
        </div>
      `;
      document.querySelector('.analytics-container').appendChild(warningDiv);
    }, 500);
  }
  
  updateOverviewStats(stats) {
    console.log('Updating overview stats with:', stats);
    
    // Force refresh data from storage before updating UI
    this.refreshStatsFromStorage().then(freshStats => {
      const statsToUse = freshStats || stats;
      console.log('Using fresh stats:', statsToUse);
      this.renderOverviewStats(statsToUse);
    }).catch(error => {
      console.warn('Failed to get fresh stats, using provided:', error);
      this.renderOverviewStats(stats);
    });
  }
  
  async refreshStatsFromStorage() {
    try {
      // Get fresh data directly from chrome storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await new Promise((resolve) => {
          chrome.storage.local.get(['vocabAnalytics', 'vocabWords', 'vocabGamification'], (data) => {
            resolve(data);
          });
        });
        
        console.log('Fresh storage data:', result);
        
        // Prepare gamification merge if available
        let gamificationMerge = { totalXP: 0, achievements: [], achievementCount: 0, level: 1 };
        if (result.vocabGamification) {
          const gam = result.vocabGamification;

          // Map unlocked achievements to definitions if VocabGamification class available
          let fullAchievements = [];
          const unlockedIds = gam.unlockedAchievements || [];
          if (typeof VocabGamification !== 'undefined' && VocabGamification.ACHIEVEMENTS) {
            fullAchievements = unlockedIds.map(id => {
              const def = VocabGamification.ACHIEVEMENTS[id];
              if (!def) return null;
              return {
                ...def,
                unlockedAt: gam.achievementTimestamps?.[id] || new Date().toISOString()
              };
            }).filter(Boolean);
          } else {
            // Fallback simple objects
            fullAchievements = unlockedIds.map(id => ({
              id,
              name: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              icon: '🏆',
              xp: 50,
              unlockedAt: gam.achievementTimestamps?.[id] || new Date().toISOString()
            }));
          }
          gamificationMerge = {
            totalXP: gam.xp || 0,
            achievements: fullAchievements,
            achievementCount: fullAchievements.length,
            level: gam.level || 1,
            perfectSessions: gam.perfectSessions || 0
          };
        }

        if (result.vocabAnalytics) {
          const analyticsData = result.vocabAnalytics;          
          const today = new Date().toISOString().split('T')[0];
          const todayStats = analyticsData.dailyStats?.[today] || { wordsReviewed: 0, timeSpent: 0, accuracy: 0 };
          
          // Calculate actual total reviews from quality distribution
          const totalReviews = Object.values(analyticsData.qualityDistribution || {})
            .reduce((sum, count) => sum + count, 0);
          
          // Convert time from milliseconds to minutes for proper display
          const totalTimeMinutes = Math.floor((analyticsData.totalTimeSpent || 0) / 60000);
          const todayTimeMinutes = Math.floor((todayStats.timeSpent || 0) / 60000);
          
          return {
            totalWordsLearned: analyticsData.totalWordsLearned || 0,
            totalWords: analyticsData.totalWordsLearned || 0,
            totalTime: totalTimeMinutes,
            totalSessions: analyticsData.totalReviewSessions || 0,
            todayWords: todayStats.wordsReviewed || 0,
            todayTime: todayTimeMinutes,
            todayAccuracy: Math.round(todayStats.accuracy || 0),
            currentStreak: analyticsData.currentStreak || 0,
            longestStreak: analyticsData.longestStreak || 0,
            // Prefer gamification storage XP/achievements if available
            totalXP: gamificationMerge.totalXP || analyticsData.totalXP || 0,
            achievementCount: gamificationMerge.achievementCount || analyticsData.achievements?.length || 0,
            qualityDistribution: analyticsData.qualityDistribution || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            totalReviews: totalReviews,
            // Provide achievements array & level so UI/gamification UI can access without re-calling
            achievements: gamificationMerge.achievements || analyticsData.achievements || [],
            level: gamificationMerge.level || analyticsData.level || 1,
            perfectSessions: gamificationMerge.perfectSessions || analyticsData.perfectSessions || 0
          };
        }
        
        // If no analytics data, try to get vocabulary count
        if (result.vocabWords && Array.isArray(result.vocabWords)) {
          return {
            totalWordsLearned: result.vocabWords.length,
            totalWords: result.vocabWords.length,
            totalTime: 0,
            totalSessions: 0,
            todayWords: 0,
            todayTime: 0,
            todayAccuracy: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalXP: 0,
            achievementCount: 0,
            qualityDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            totalReviews: 0
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error refreshing stats from storage:', error);
      return null;
    }
  }
  
  renderOverviewStats(stats) {
    // Update each stat with safety checks and improved formatting
    const totalWordsEl = document.getElementById('total-words');
    const currentStreakEl = document.getElementById('current-streak');
    const totalTimeEl = document.getElementById('total-time');
    const todayAccuracyEl = document.getElementById('today-accuracy');
    const totalXpEl = document.getElementById('total-xp');
    if (totalWordsEl) {
      const value = stats.totalWordsLearned || stats.totalWords || 0;
      totalWordsEl.textContent = value.toLocaleString();
      
      // Show additional info if we have reviews
      if (stats.totalReviews && stats.totalReviews !== value) {
        totalWordsEl.title = `${value} unique words, ${stats.totalReviews} total reviews`;
      }
      
      console.log('Total words updated:', value);
    }
    
    if (currentStreakEl) {
      const value = stats.currentStreak || 0;
      const streakText = value > 0 ? `${value} day${value > 1 ? 's' : ''}` : '0 days';
      currentStreakEl.textContent = streakText;
      
      // Add visual indicator for streak status
      const streakContainer = currentStreakEl.parentElement;
      streakContainer.className = streakContainer.className.replace(/ streak-\w+/g, '');
      
      if (value === 0) {
        streakContainer.classList.add('streak-broken');
        // Show hint about minimum requirement
        let hintEl = streakContainer.querySelector('.streak-hint');
        if (!hintEl) {
          hintEl = document.createElement('div');
          hintEl.className = 'streak-hint';
          streakContainer.appendChild(hintEl);
        }
        hintEl.textContent = 'Review 5+ words daily to build streak';
        hintEl.style.cssText = 'font-size: 10px; color: rgba(255,255,255,0.6); margin-top: 2px;';
      } else if (value >= 7) {
        streakContainer.classList.add('streak-fire');
        // Remove hint if exists
        const hintEl = streakContainer.querySelector('.streak-hint');
        if (hintEl) hintEl.remove();
      } else {
        streakContainer.classList.add('streak-active');
        // Remove hint if exists
        const hintEl = streakContainer.querySelector('.streak-hint');
        if (hintEl) hintEl.remove();
      }
      
      console.log('Current streak updated:', streakText);
    }
    
    if (totalTimeEl) {
      const value = stats.totalTime || 0;
      totalTimeEl.textContent = this.formatTime(value);
      console.log('Total time updated:', value, 'formatted:', this.formatTime(value));
    }
    
    if (todayAccuracyEl) {
      const value = stats.todayAccuracy || 0;
      const accuracyText = `${value}%`;
      todayAccuracyEl.textContent = accuracyText;
      
      // Add visual indicator for accuracy
      const accuracyContainer = todayAccuracyEl.parentElement;
      accuracyContainer.className = accuracyContainer.className.replace(/ accuracy-\w+/g, '');
      
      if (value >= 90) {
        accuracyContainer.classList.add('accuracy-excellent');
      } else if (value >= 70) {
        accuracyContainer.classList.add('accuracy-good');
      } else if (value > 0) {
        accuracyContainer.classList.add('accuracy-needs-work');
      }
      
      console.log('Today accuracy updated:', accuracyText);
    }
    
    if (totalXpEl) {
      const value = stats.totalXP || 0;
      totalXpEl.textContent = value.toLocaleString();
      console.log('Total XP updated:', value);
    }
  }
  
  createWeeklyProgressChart(weeklyData) {
    const canvas = document.getElementById('weekly-progress-chart');
    
    // Check if canvas element exists
    if (!canvas) {
      console.error('Weekly progress canvas not found');
      return;
    }
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
      console.log('Chart.js not available, showing text-based chart');
      this.createTextBasedWeeklyChart(weeklyData);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    this.charts.weeklyProgress = new Chart(ctx, {
      type: 'line',
      data: {
        labels: weeklyData.map(d => d.day),
        datasets: [
          {
            label: 'Words Reviewed',
            data: weeklyData.map(d => d.words),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Time Spent (min)',
            data: weeklyData.map(d => d.time),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: 'white',
              font: {
                size: 12
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          y: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });
    
    console.log('✅ Weekly progress chart created with Chart.js');
  }
  
  createQualityDistributionChart(qualityData) {
    const canvas = document.getElementById('quality-chart');
    
    // Check if canvas element exists
    if (!canvas) {
      console.error('Quality chart canvas not found');
      return;
    }
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
      console.log('Chart.js not available, showing text-based quality chart');
      this.createTextBasedQualityChart(qualityData);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    const labels = ['Blackout', 'Incorrect', 'Hard', 'Correct', 'Easy', 'Perfect'];
    const data = [0, 1, 2, 3, 4, 5].map(q => qualityData[q] || 0);
    const colors = [
      '#ef4444', // Blackout - Red
      '#f97316', // Incorrect - Orange
      '#f59e0b', // Hard - Yellow
      '#10b981', // Correct - Green
      '#06b6d4', // Easy - Cyan
      '#8b5cf6'  // Perfect - Purple
    ];
    
    this.charts.qualityDistribution = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.map(c => c + '80'), // Add transparency
          borderColor: colors,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'white',
              font: {
                size: 11
              },
            }
          }
        }
      }
    });
    
    console.log('✅ Quality distribution chart created with Chart.js');
  }
  
  // Fallback chart methods when Chart.js is not available
  createTextBasedWeeklyChart(weeklyData) {
    const canvas = document.getElementById('weekly-progress-chart');
    if (!canvas) {
      console.error('Weekly progress canvas not found for fallback chart');
      return;
    }
    
    const container = canvas.parentElement;
    
    // Get or create wrapper for text chart
    let textWrapper = container.querySelector('.text-chart-wrapper');
    if (!textWrapper) {
      textWrapper = document.createElement('div');
      textWrapper.className = 'text-chart-wrapper';
      container.appendChild(textWrapper);
    }
    
    // Use provided data or fallback to default
    const chartData = weeklyData && weeklyData.length > 0 ? weeklyData : this.getDefaultWeeklyProgress();
    
    // Calculate max values for proper scaling
    const maxWords = Math.max(...chartData.map(d => d.words || 0), 1);
    const maxTime = Math.max(...chartData.map(d => d.time || 0), 1);
    
    // Generate the text-based chart
    textWrapper.innerHTML = `
      <div class="text-chart" style="background: rgba(16, 24, 39, 0.8); border-radius: 12px; padding: 16px; margin: 8px 0;">
        <div class="chart-title" style="color: white; font-weight: 600; font-size: 16px; margin-bottom: 16px; text-align: center;">📈 Weekly Progress (Text Version)</div>
        <div class="weekly-bars" style="display: flex; justify-content: space-between; align-items: end; height: 120px; margin: 16px 0;">
          ${chartData.map(day => {
            const wordsPct = maxWords > 0 ? Math.max(5, (day.words / maxWords) * 100) : 5;
            const timePct = maxTime > 0 ? Math.max(5, (day.time / maxTime) * 100) : 5;
            return `
              <div class="day-bar" style="display: flex; flex-direction: column; align-items: center; flex: 1; margin: 0 2px;">
                <div class="bars" style="display: flex; gap: 4px; align-items: end; height: 80px; margin-bottom: 8px;">
                  <div class="bar words-bar" style="
                    background: linear-gradient(180deg, #10b981, #065f46);
                    height: ${wordsPct.toFixed(1)}%;
                    width: 12px;
                    border-radius: 2px;
                    position: relative;
                    min-height: 4px;
                    display: flex;
                    align-items: end;
                    justify-content: center;
                  " title="${day.words} words">
                    <span class="bar-value" style="
                      position: absolute;
                      bottom: -18px;
                      font-size: 10px;
                      color: #10b981;
                      font-weight: 600;
                    ">${day.words}</span>
                  </div>
                  <div class="bar time-bar" style="
                    background: linear-gradient(180deg, #f59e0b, #d97706);
                    height: ${timePct.toFixed(1)}%;
                    width: 12px;
                    border-radius: 2px;
                    position: relative;
                    min-height: 4px;
                    display: flex;
                    align-items: end;
                    justify-content: center;
                  " title="${day.time} minutes">
                    <span class="bar-value" style="
                      position: absolute;
                      bottom: -18px;
                      font-size: 10px;
                      color: #f59e0b;
                      font-weight: 600;
                    ">${day.time}m</span>
                  </div>
                </div>
                <div class="day-label" style="
                  color: rgba(255, 255, 255, 0.8);
                  font-size: 12px;
                  font-weight: 500;
                  margin-top: 8px;
                ">${day.day}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="chart-legend" style="display: flex; justify-content: center; gap: 20px; margin-top: 12px;">
          <div class="legend-item" style="display: flex; align-items: center; gap: 6px;">
            <div class="legend-color words-color" style="
              width: 12px;
              height: 12px;
              background: #10b981;
              border-radius: 2px;
            "></div>
            <span style="color: rgba(255, 255, 255, 0.9); font-size: 13px;">Words Reviewed</span>
          </div>
          <div class="legend-item" style="display: flex; align-items: center; gap: 6px;">
            <div class="legend-color time-color" style="
              width: 12px;
              height: 12px;
              background: #f59e0b;
              border-radius: 2px;
            "></div>
            <span style="color: rgba(255, 255, 255, 0.9); font-size: 13px;">Time Spent (min)</span>
          </div>
        </div>
      </div>
    `;
    
    // Hide the canvas since we're using text version
    canvas.style.display = 'none';
    
    console.log('📊 Text-based weekly progress chart created/updated');
  }
  
  createTextBasedQualityChart(qualityData) {
    const canvas = document.getElementById('quality-chart');
    if (!canvas) {
      console.error('Quality chart canvas not found for fallback chart');
      return;
    }
    
    const container = canvas.parentElement;
    
    // Get or create wrapper for text chart
    let textWrapper = container.querySelector('.text-quality-wrapper');
    if (!textWrapper) {
      textWrapper = document.createElement('div');
      textWrapper.className = 'text-quality-wrapper';
      container.appendChild(textWrapper);
    }
    
    const labels = ['Blackout', 'Incorrect', 'Hard', 'Correct', 'Easy', 'Perfect'];
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];
    const data = qualityData || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const total = Object.values(data).reduce((sum, count) => sum + count, 0) || 1;
    
    // Generate the text-based quality chart
    textWrapper.innerHTML = `
      <div class="text-chart" style="background: rgba(16, 24, 39, 0.8); border-radius: 12px; padding: 16px; margin: 8px 0;">
        <div class="chart-title" style="color: white; font-weight: 600; font-size: 16px; margin-bottom: 16px; text-align: center;">🎯 Quality Distribution (Text Version)</div>
        <div class="quality-bars" style="display: flex; flex-direction: column; gap: 8px;">
          ${labels.map((label, index) => {
            const count = data[index] || 0;
            const percentage = Math.round((count / total) * 100);
            const hasData = count > 0;
            
            return `
              <div class="quality-item" style="display: flex; align-items: center; gap: 12px;">
                <div class="quality-label" style="
                  color: rgba(255, 255, 255, 0.9);
                  font-size: 13px;
                  font-weight: 500;
                  width: 80px;
                  text-align: left;
                ">${label}</div>
                <div class="quality-bar-container" style="
                  flex: 1;
                  height: 20px;
                  background: rgba(255, 255, 255, 0.1);
                  border-radius: 10px;
                  overflow: visible;
                  position: relative;
                ">
                  <div class="quality-bar" style="
                    width: ${percentage}%;
                    height: 100%;
                    background: ${colors[index]};
                    border-radius: 10px;
                    transition: width 0.3s ease;
                    display: flex;
                    align-items: center;
                    ${percentage > 40 ? 'justify-content: center;' : ''}
                  ">
                    ${percentage > 40 ? `
                      <span class="quality-count" style="
                        color: white;
                        font-size: 11px;
                        font-weight: 600;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                      ">${hasData ? `${percentage}%` : '0%'}</span>
                    ` : ''}
                  </div>
                  ${percentage <= 40 ? `
                    <span class="quality-count" style="
                      position: absolute;
                      right: 8px;
                      top: 50%;
                      transform: translateY(-50%);
                      color: ${colors[index]};
                      font-size: 11px;
                      font-weight: 600;
                    ">${hasData ? `${percentage}%` : '0%'}</span>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        ${total > 1 ? `
          <div style="
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
            text-align: center;
            margin-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 8px;
          ">
            Total Reviews: ${total}
          </div>
        ` : ''}
      </div>
    `;
    
    // Hide the canvas since we're using text version
    canvas.style.display = 'none';
    
    console.log('📊 Text-based quality distribution chart created/updated');
  }
  
  loadAchievements(achievements) {
    const container = document.getElementById('achievements-grid');
    container.innerHTML = '';
    
    if (achievements.length === 0) {
      container.innerHTML = `
        <div class="achievement-card">
          <div class="achievement-icon">🎯</div>
          <div class="achievement-info">
            <h4>Start Learning!</h4>
            <p>Complete your first review session to unlock achievements</p>
          </div>
        </div>
      `;
      return;
    }
    
    achievements.forEach(achievement => {
      const achievementCard = document.createElement('div');
      achievementCard.className = 'achievement-card';
      achievementCard.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
          <h4>${achievement.name}</h4>
          <p>${achievement.description}</p>
          <div class="achievement-xp">+${achievement.xp} XP</div>
        </div>
      `;
      container.appendChild(achievementCard);
    });
  }
  
  async loadDifficultWords(difficultWords) {
    const container = document.getElementById('difficult-words-list');
    container.innerHTML = '';
    
    if (difficultWords.length === 0) {
      container.innerHTML = `
        <div class="difficult-word-item">
          <div class="word-info">
            <div class="word-name">Great job! 🎉</div>
            <div class="word-stats">No words are giving you trouble right now</div>
          </div>
        </div>
      `;
      return;
    }
    
    // Get actual word data for display
    for (const wordStat of difficultWords.slice(0, 8)) {
      try {
        const word = await window.VocabUtils.VocabStorage.getWord(wordStat.wordId);
        if (!word) continue;
        
        const wordItem = document.createElement('div');
        wordItem.className = 'difficult-word-item';
        
        const difficultyLevel = wordStat.difficultyScore > 0.7 ? 'high' : 'medium';
        const difficultyText = wordStat.difficultyScore > 0.7 ? 'Very Hard' : 'Hard';
        
        wordItem.innerHTML = `
          <div class="word-info">
            <div class="word-name">${word.word}</div>
            <div class="word-stats">
              ${wordStat.attempts} attempts • ${Math.round(wordStat.avgQuality * 10) / 10} avg quality
            </div>
          </div>
          <div class="difficulty-badge difficulty-${difficultyLevel}">
            ${difficultyText}
          </div>
        `;
        
        container.appendChild(wordItem);
      } catch (error) {
        console.error('Error loading difficult word:', error);
      }
    }
  }
  
  loadLearningPatterns(stats, weeklyData) {
    console.log('📊 Loading learning patterns with real data:', { stats, weeklyData });
    
    // Use Best Study Time from Analytics API if available
    const bestStudyTime = stats.bestStudyTime || 'No data yet';
    document.getElementById('best-study-time').textContent = bestStudyTime;
    console.log('⏰ Best study time from API:', bestStudyTime);
    
    // Find most active day from actual weekly data
    const dayTotals = weeklyData.reduce((acc, day) => {
      const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' });
      acc[dayName] = (acc[dayName] || 0) + day.words;
      return acc;
    }, {});
    
    const hasWeeklyActivity = Object.values(dayTotals).some(total => total > 0);
    const mostActiveDay = hasWeeklyActivity 
      ? Object.entries(dayTotals).sort(([,a], [,b]) => b - a)[0]?.[0] 
      : 'No activity yet';
    
    document.getElementById('most-active-day').textContent = mostActiveDay;
    console.log('📅 Most active day calculated:', mostActiveDay, 'from data:', dayTotals);
    
    // Use Average Session Length from Analytics API if available
    const avgSessionDisplay = stats.avgSessionLength || 'No sessions yet';
    document.getElementById('avg-session-length').textContent = avgSessionDisplay;
    console.log('⚡ Average session length from API:', avgSessionDisplay);
    
    // Calculate overall accuracy from real quality distribution
    const totalQualities = Object.values(stats.qualityDistribution || {});
    const totalReviews = totalQualities.reduce((sum, count) => sum + count, 0);
    const weightedScore = Object.entries(stats.qualityDistribution || {})
      .reduce((sum, [quality, count]) => sum + (parseInt(quality) * count), 0);
    
    const overallAccuracy = totalReviews > 0 
      ? Math.round((weightedScore / (totalReviews * 5)) * 100)
      : 0;
    
    const accuracyDisplay = totalReviews > 0 
      ? `${overallAccuracy}%`
      : 'No reviews yet';
    
    document.getElementById('overall-accuracy').textContent = accuracyDisplay;
    console.log('🎯 Overall accuracy calculated:', accuracyDisplay, 'from', totalReviews, 'reviews');
    
    // Log final learning patterns
    console.log('📊 Final learning patterns:', {
      bestStudyTime,
      mostActiveDay,
      avgSession: avgSessionDisplay,
      overallAccuracy: accuracyDisplay,
      dataSource: hasWeeklyActivity ? 'real' : 'empty'
    });
  }
  
  calculateBestStudyTime(stats) {
    // Try to determine best study time from actual session timestamps
    try {
      if (!stats || !stats.studyTimes || stats.studyTimes.length === 0) {
        return { bestTime: null, confidence: 0 };
      }
      
      const studyTimes = stats.studyTimes || [];
      const hourCounts = {};
      
      studyTimes.forEach(timestamp => {
        const hour = new Date(timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      
      if (Object.keys(hourCounts).length === 0) {
        return { bestTime: null, confidence: 0 };
      }
      
      const mostActiveHour = Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)[0][0];
      
      const hour = parseInt(mostActiveHour);
      let timeOfDay;
      
      if (hour >= 6 && hour < 12) {
        timeOfDay = 'Morning';
      } else if (hour >= 12 && hour < 17) {
        timeOfDay = 'Afternoon';
      } else if (hour >= 17 && hour < 22) {
        timeOfDay = 'Evening';
      } else {
        timeOfDay = 'Night';
      }
      
      console.log('📊 Study time analysis:', { hourCounts, mostActiveHour, timeOfDay });
      
      return { 
        bestTime: timeOfDay, 
        confidence: studyTimes.length,
        hourBreakdown: hourCounts
      };
      
    } catch (error) {
      console.error('Error calculating best study time:', error);
      return { bestTime: null, confidence: 0 };
    }
  }
  
  bindEvents() {
    // Listen for analytics data updates (with debouncing)
    let updateDebounce = null;
    window.addEventListener('vocabAnalyticsUpdated', (event) => {
      console.log('📊 Received vocabAnalyticsUpdated event', event.detail);
      
      // Debounce rapid updates
      clearTimeout(updateDebounce);
      updateDebounce = setTimeout(() => {
        this.handleAnalyticsUpdate(event);
      }, 250);
    });
    console.log('📊 Analytics UI event listener added (with debounce)');
    
    // Back to main button
    const backBtn = document.getElementById('back-to-main');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        try {
          window.close();
        } catch (error) {
          // Fallback for when window.close() fails
          history.back();
        }
      });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-analytics');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        try {
          console.log('🔄 Refresh button clicked - forcing data reload');
          refreshBtn.disabled = true;
          refreshBtn.innerHTML = '<span class="btn-icon">⏳</span> Refreshing...';
          
          // Clear any cached data
          if (window.VocabAnalytics) {
            window.VocabAnalytics.initPromise = null; // Force re-initialization
          }
          
          // Force reload from chrome storage
          await this.forceDataReload();
          
          // Reload entire dashboard with fresh data
          await this.loadDashboard();
          
          refreshBtn.disabled = false;
          refreshBtn.innerHTML = '<span class="btn-icon">✅</span> Refreshed!';
          
          // Reset button text after delay
          setTimeout(() => {
            refreshBtn.innerHTML = '<span class="btn-icon">🔄</span> Refresh';
          }, 2000);
          
          console.log('✅ Analytics refresh completed successfully');
        } catch (error) {
          console.error('❌ Analytics refresh failed:', error);
          refreshBtn.disabled = false;
          refreshBtn.innerHTML = '<span class="btn-icon">❌</span> Refresh Failed';
          
          setTimeout(() => {
            refreshBtn.innerHTML = '<span class="btn-icon">🔄</span> Refresh';
          }, 3000);
          
          alert('Refresh failed: ' + error.message);
        }
      });
    }
    
    // Remove Sample Data button from HTML and its event listener
    const sampleDataBtn = document.getElementById('create-sample-data');
    if (sampleDataBtn) {
      sampleDataBtn.style.display = 'none'; // Hide instead of remove to avoid breaking layout
    }
    
    // Error retry button
    const retryBtn = document.getElementById('retry-analytics');
    if (retryBtn) {
      retryBtn.addEventListener('click', async () => {
        try {
          console.log('🔄 Retry button clicked');
          await this.loadDashboard();
        } catch (error) {
          console.error('❌ Retry failed:', error);
          alert('Retry failed: ' + error.message);
        }
      });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        try {
          window.close();
        } catch (error) {
          history.back();
        }
      }
      
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        const refreshBtn = document.getElementById('refresh-analytics');
        if (refreshBtn && !refreshBtn.disabled) {
          refreshBtn.click();
        }
      }
    });
  }
  
  formatTime(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  }
  
  showLoading() {
    document.getElementById('loading-state').style.display = 'flex';
    document.getElementById('error-state').style.display = 'none';
    document.querySelector('.stats-overview').style.display = 'none';
    document.querySelector('.charts-section').style.display = 'none';
    document.querySelector('.achievements-section').style.display = 'none';
    document.querySelector('.difficult-words-section').style.display = 'none';
    document.querySelector('.patterns-section').style.display = 'none';
  }
  
  hideLoading() {
    document.getElementById('loading-state').style.display = 'none';
    document.querySelector('.stats-overview').style.display = 'grid';
    document.querySelector('.charts-section').style.display = 'grid';
    document.querySelector('.achievements-section').style.display = 'block';
    document.querySelector('.difficult-words-section').style.display = 'block';
    document.querySelector('.patterns-section').style.display = 'block';
  }
  
  showError(message) {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'flex';
    document.getElementById('error-message').textContent = message;
  }
  
  async forceDataReload() {
    console.log('🔄 Forcing complete data reload from storage...');
    
    try {
      // Clear any cached analytics instance
      if (window.VocabAnalytics) {
        delete window.VocabAnalytics;
      }
      
      // Re-create VocabAnalytics instance
      if (typeof VocabAnalytics !== 'undefined') {
        window.VocabAnalytics = new VocabAnalytics();
        await window.VocabAnalytics.ensureInitialized();
      }
      
      // Get current storage data for debugging
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const storageData = await new Promise((resolve) => {
          chrome.storage.local.get(null, (data) => {
            resolve(data);
          });
        });
        
        console.log('📦 Current storage keys:', Object.keys(storageData));
        console.log('📊 Analytics data exists:', !!storageData.vocabAnalytics);
        console.log('📚 Vocab words count:', storageData.vocabWords?.length || 0);
        
        if (storageData.vocabAnalytics) {
          console.log('📈 Analytics summary:', {
            totalWords: storageData.vocabAnalytics.totalWordsLearned,
            currentStreak: storageData.vocabAnalytics.currentStreak,
            totalSessions: storageData.vocabAnalytics.totalReviewSessions,
            totalXP: storageData.vocabAnalytics.totalXP
          });
        }
      }
      
      console.log('✅ Force data reload completed');
    } catch (error) {
      console.error('❌ Force data reload failed:', error);
      throw error;
    }
  }
  
  addDebugInfo(dashboardStats) {
    try {
      // Add debug panel at the bottom
      const debugPanel = document.createElement('div');
      debugPanel.className = 'debug-panel';
      debugPanel.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 8px;
        font-size: 12px;
        font-family: monospace;
        max-width: 300px;
        z-index: 10000;
        display: none;
      `;
      
      debugPanel.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold;">🔧 Debug Info</div>
        <div>Analytics Loaded: ${!!window.VocabAnalytics}</div>
        <div>Chart.js Available: ${!!window.Chart}</div>
        <div>Chrome Storage: ${!!(chrome && chrome.storage)}</div>
        <div>Total Words: ${dashboardStats?.totalWordsLearned || 0}</div>
        <div>Current Streak: ${dashboardStats?.currentStreak || 0}</div>
        <div>Last Updated: ${new Date().toLocaleTimeString()}</div>
        <button style="margin-top: 8px; padding: 4px 8px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="this.parentElement.style.display='none'">Hide</button>
      `;
      
      document.body.appendChild(debugPanel);
      
      // Add toggle button
      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = '🔧';
      toggleBtn.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #059669;
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        z-index: 10001;
        font-size: 16px;
      `;
      
      toggleBtn.onclick = () => {
        debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
      };
      
      document.body.appendChild(toggleBtn);
      
    } catch (error) {
      console.error('Failed to add debug info:', error);
    }
  }
  
  // Handle analytics data updates and refresh UI
  async handleAnalyticsUpdate(event) {
    console.log('📊 Analytics UI received data update notification', event.detail);
    
    try {
      // Get fresh data
      const [dashboardStats, weeklyProgress] = await Promise.all([
        window.VocabAnalytics.getDashboardStats().catch(err => {
          console.warn('Dashboard stats failed during update:', err);
          return this.getDefaultDashboardStats();
        }),
        window.VocabAnalytics.getWeeklyProgress().catch(err => {
          console.warn('Weekly progress failed during update:', err);
          return this.getDefaultWeeklyProgress();
        })
      ]);
      
      console.log('📊 Live update data:', { dashboardStats, weeklyProgress });
      
      // Update overview stats
      this.updateOverviewStats(dashboardStats);
      
      // Update charts (both Chart.js and text fallbacks)
      this.updateWeeklyChart(weeklyProgress);
      this.updateQualityChart(dashboardStats.qualityDistribution || {});
      
      // Update learning patterns
      this.loadLearningPatterns(dashboardStats, weeklyProgress);
      
      console.log('✅ Analytics dashboard updated successfully from live data');
      
    } catch (error) {
      console.warn('⚠️ Failed to handle analytics update:', error);
    }
  }
  
  // Update weekly chart (works for both Chart.js and text fallback)
  updateWeeklyChart(weeklyData) {
    if (this.charts.weeklyProgress && typeof Chart !== 'undefined') {
      // Update Chart.js version
      this.charts.weeklyProgress.data.labels = weeklyData.map(d => d.day);
      this.charts.weeklyProgress.data.datasets[0].data = weeklyData.map(d => d.words);
      this.charts.weeklyProgress.data.datasets[1].data = weeklyData.map(d => d.time);
      this.charts.weeklyProgress.update('none');
      console.log('📊 Weekly progress Chart.js updated');
    } else if (typeof Chart === 'undefined') {
      // Update text-based version
      this.createTextBasedWeeklyChart(weeklyData);
      console.log('📊 Weekly progress text chart updated');
    }
  }
  
  // Update quality chart (works for both Chart.js and text fallback)
  updateQualityChart(qualityData) {
    if (this.charts.qualityDistribution && typeof Chart !== 'undefined') {
      // Update Chart.js version
      const newData = [0, 1, 2, 3, 4, 5].map(q => qualityData[q] || 0);
      this.charts.qualityDistribution.data.datasets[0].data = newData;
      this.charts.qualityDistribution.update('none');
      console.log('📊 Quality distribution Chart.js updated');
    } else if (typeof Chart === 'undefined') {
      // Update text-based version
      this.createTextBasedQualityChart(qualityData);
      console.log('📊 Quality distribution text chart updated');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AnalyticsDashboard();
});
