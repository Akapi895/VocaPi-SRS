// Fast Gamification Widget - Optimized for quick loading
class FastGamificationWidget {
  constructor() {
    this.cachedData = null;
    this.loadStartTime = Date.now();
    this.isLoading = false;
    this.initialized = false;
  }

  // Immediately show a placeholder with cached data or defaults
  renderPlaceholder(container) {
    const cachedData = this.getCachedData();
    
    // Show immediate placeholder with cached/default data
    container.innerHTML = `
      <div class="mini-gamification-widget" style="opacity: ${cachedData ? '1' : '0.7'}">
        <div class="mini-level-info">
          <span class="mini-level">Lvl ${cachedData?.level || 1}</span>
          <div class="mini-xp-bar">
            <div class="mini-xp-fill" style="width: ${cachedData?.xpPercentage || 0}%; transition: width 0.5s ease;"></div>
          </div>
          <span class="mini-xp">${cachedData?.currentXP || 0}/${cachedData?.xpToNextLevel || 100}</span>
        </div>
        ${cachedData?.challenge ? `
          <div class="mini-challenge">
            <span class="mini-challenge-icon">${cachedData.challenge.icon}</span>
            <span class="mini-challenge-progress">${cachedData.challenge.progress}/${cachedData.challenge.target}</span>
          </div>
        ` : `
          <div class="mini-challenge" style="opacity: 0.5;">
            <span class="mini-challenge-icon">🎯</span>
            <span class="mini-challenge-progress">-/-</span>
          </div>
        `}
      </div>
    `;
    
    // If no cached data, show loading indicator
    if (!cachedData) {
      this.showLoadingState(container);
    }
    
    // Start background loading
    this.loadActualData(container);
  }

  showLoadingState(container) {
    const widget = container.querySelector('.mini-gamification-widget');
    if (widget) {
      widget.style.position = 'relative';
      widget.innerHTML += `
        <div class="loading-overlay" style="
          position: absolute; 
          top: 0; left: 0; right: 0; bottom: 0; 
          background: rgba(102, 126, 234, 0.1); 
          display: flex; 
          align-items: center; 
          justify-content: center;
          border-radius: 16px;
          backdrop-filter: blur(2px);
        ">
          <div style="display: flex; align-items: center; gap: 8px; color: white; font-size: 12px;">
            <div class="spinner" style="
              width: 16px; 
              height: 16px; 
              border: 2px solid rgba(255,255,255,0.3); 
              border-top: 2px solid white; 
              border-radius: 50%; 
              animation: spin 1s linear infinite;
            "></div>
            Loading...
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
    }
  }

  async loadActualData(container) {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      // Load gamification system
      const gamification = await this.getGamificationInstance();
      const data = await gamification.getPlayerStats();
      const challenge = await gamification.getCurrentChallenge();

      // Process data
      const processedData = {
        level: data?.level || 1,
        currentXP: data?.currentXP || 0,
        xpToNextLevel: data?.xpToNextLevel || 100,
        xpPercentage: ((data?.currentXP || 0) / (data?.xpToNextLevel || 100)) * 100,
        challenge: challenge ? {
          icon: this.getChallengeIcon(challenge.type),
          progress: challenge.progress || challenge.current || 0,
          target: challenge.target
        } : null
      };

      // Cache the data
      this.cacheData(processedData);

      // Update UI smoothly
      this.updateWidget(container, processedData);

    } catch (error) {
      console.warn('Gamification load error:', error);
      this.showErrorState(container, error.message);
    } finally {
      this.isLoading = false;
    }
  }

  async getGamificationInstance() {
    // Try to reuse existing instance first
    if (window.gamificationInstance && window.gamificationInstance.initialized) {
      return window.gamificationInstance;
    }

    // Create new instance
    if (typeof VocabGamification !== 'undefined') {
      const gamification = new VocabGamification();
      await gamification.initializeGamification();
      window.gamificationInstance = gamification;
      return gamification;
    }

    throw new Error('VocabGamification not available');
  }

  updateWidget(container, data) {
    const loadTime = Date.now() - this.loadStartTime;
    console.log(`⚡ Gamification loaded in ${loadTime}ms`);

    // Remove loading overlay
    const overlay = container.querySelector('.loading-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      setTimeout(() => overlay.remove(), 300);
    }

    // Update content
    const widget = container.querySelector('.mini-gamification-widget');
    if (widget) {
      widget.style.opacity = '1';
      
      // Update level
      const levelEl = widget.querySelector('.mini-level');
      if (levelEl) levelEl.textContent = `Lvl ${data.level}`;

      // Update XP bar with animation
      const xpFill = widget.querySelector('.mini-xp-fill');
      if (xpFill) {
        setTimeout(() => {
          xpFill.style.width = `${data.xpPercentage}%`;
        }, 100);
      }

      // Update XP text
      const xpText = widget.querySelector('.mini-xp');
      if (xpText) xpText.textContent = `${data.currentXP}/${data.xpToNextLevel}`;

      // Update challenge
      if (data.challenge) {
        const challengeIcon = widget.querySelector('.mini-challenge-icon');
        const challengeProgress = widget.querySelector('.mini-challenge-progress');
        
        if (challengeIcon) challengeIcon.textContent = data.challenge.icon;
        if (challengeProgress) challengeProgress.textContent = `${data.challenge.progress}/${data.challenge.target}`;
        
        widget.querySelector('.mini-challenge').style.opacity = '1';
      }
    }
  }

  showErrorState(container, message) {
    const widget = container.querySelector('.mini-gamification-widget');
    if (widget) {
      widget.innerHTML = `
        <div style="
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 8px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          padding: 8px;
        ">
          <span>⚠️</span>
          <span>Gamification unavailable</span>
        </div>
      `;
    }
  }

  getCachedData() {
    try {
      const cached = localStorage.getItem('fastGamificationCache');
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is less than 5 minutes old
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          return data.content;
        }
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }
    return null;
  }

  cacheData(data) {
    try {
      const cacheData = {
        content: data,
        timestamp: Date.now()
      };
      localStorage.setItem('fastGamificationCache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  getChallengeIcon(type) {
    const icons = {
      'review_count': '📝',
      'accuracy': '⭐',
      'time_spent': '⏰',
      'streak_maintain': '🔥'
    };
    return icons[type] || '🎯';
  }

  // Main entry point
  render(container) {
    this.renderPlaceholder(container);
    
    // Listen for analytics updates to refresh gamification data
    window.addEventListener('vocabAnalyticsUpdated', (event) => {
      console.log('⚡ FastGamificationWidget received analytics update');
      this.handleAnalyticsUpdate(container);
    });
  }
  
  // Handle analytics updates and refresh widget
  async handleAnalyticsUpdate(container) {
    if (this.isLoading) return; // Don't double-load
    
    console.log('⚡ Refreshing FastGamificationWidget due to analytics update');
    
    // Clear cache to force fresh data
    this.clearCache();
    
    // Reload with fresh data
    await this.loadActualData(container);
  }
  
  // Clear cached data
  clearCache() {
    try {
      localStorage.removeItem('fastGamificationCache');
      this.cachedData = null;
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }
}

// Export
window.FastGamificationWidget = FastGamificationWidget;
