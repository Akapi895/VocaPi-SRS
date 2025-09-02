class FastGamificationWidget {
  constructor() {
    this.cachedData = null;
    this.isLoading = false;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  render(container) {
    this.renderPlaceholder(container);

    // Listen for analytics updates → refresh widget
    window.addEventListener("vocabAnalyticsUpdated", () => {
      console.log("⚡ FastGamificationWidget refreshing due to analytics update");
      this.clearCache();
      this.loadActualData(container);
    });
  }

  renderPlaceholder(container) {
    const cachedData = this.getCachedData();
    
    // ✅ SỬA: Kiểm tra xem container có HTML structure sẵn không
    const existingStructure = container.querySelector('.gamification-stats');
    
    if (existingStructure) {
      // Popup đã có HTML structure sẵn, chỉ cần update data
      this.updateExistingStructure(container, cachedData);
    } else {
      // Tạo HTML structure mới (cho các trường hợp khác)
      container.innerHTML = `
        <div class="mini-gamification-widget" style="opacity:${cachedData ? "1" : "0.7"}">
          <div class="mini-level-info">
            <span class="mini-level">Lvl ${cachedData?.level || 1}</span>
            <div class="mini-xp-bar">
              <div class="mini-xp-fill" style="width:${cachedData?.xpPercentage || 0}%"></div>
            </div>
            <span class="mini-xp">${cachedData?.currentXP || 0}/${cachedData?.xpToNextLevel || 100}</span>
          </div>
          ${cachedData?.challenge ? `
            <div class="mini-challenge">
              <span class="mini-challenge-icon">${cachedData.challenge.icon}</span>
              <span class="mini-challenge-progress">${cachedData.challenge.progress}/${cachedData.challenge.target}</span>
            </div>` : `
            <div class="mini-challenge" style="opacity:0.5;">
              <span class="mini-challenge-icon">🎯</span>
              <span class="mini-challenge-progress">-/-</span>
            </div>`}
        </div>
      `;
    }

    if (!cachedData) this.showLoadingState(container);
    this.loadActualData(container);
  }

  updateExistingStructure(container, data) {
    // ✅ THÊM: Update existing popup HTML structure
    const levelEl = container.querySelector('.gamification-level');
    const xpEl = container.querySelector('.gamification-xp');
    const streakEl = container.querySelector('.study-streak');
    const accuracyEl = container.querySelector('.accuracy-rate');

    // ✅ THÊM: Debug logs


    if (levelEl && data) {
      levelEl.textContent = data.level || 1;
    }

    if (xpEl && data) {
      xpEl.textContent = data.currentXP || 0;
    }

    if (streakEl && data) {
      streakEl.textContent = `${data.currentStreak || 0} days`;
    }

    if (accuracyEl && data) {
      const accuracyValue = Math.round(data.overallAccuracy || 0);
      accuracyEl.textContent = `${accuracyValue}%`;

    }
  }

  async loadActualData(container) {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      const gamification = await this.getGamificationInstance();
      const [data, challenge] = await Promise.all([
        gamification.getPlayerStats(),
        gamification.getCurrentChallenge()
      ]);

      // ✅ THÊM: Lấy analytics data để có streak và accuracy
      let analyticsData = null;
      try {
        if (window.VocabAnalytics) {
          const analytics = new window.VocabAnalytics();
          await analytics.ensureInitialized();
          analyticsData = await analytics.getAnalyticsData();
          
          // ✅ THÊM: Debug logs

        }
      } catch (analyticsError) {
        console.warn('Could not load analytics data for gamification widget:', analyticsError);
      }

      const processedData = {
        level: data?.level || 1,
        currentXP: data?.currentXP || 0,
        xpToNextLevel: data?.xpForNextLevel || 100,
        xpPercentage: Math.min(((data?.currentXP || 0) / (data?.xpForNextLevel || 100)) * 100, 100),
        currentStreak: analyticsData?.currentStreak || 0,
        overallAccuracy: analyticsData?.overallAccuracy || 0,
        challenge: challenge ? {
          icon: this.getChallengeIcon(challenge.type),
          progress: challenge.progress || 0,
          target: challenge.target
        } : null
      };

      this.cacheData(processedData);
      this.updateWidget(container, processedData);

    } catch (err) {
      console.warn("Gamification load error:", err);
      this.showErrorState(container);
    } finally {
      this.isLoading = false;
    }
  }

  async getGamificationInstance() {
    if (window.gamificationInstance?.initialized) {
      return window.gamificationInstance;
    }
    
    if (!window.VocabGamification) {
      throw new Error("VocabGamification not available");
    }
    
    const gamification = new window.VocabGamification();
    await gamification.initializeGamification();
    window.gamificationInstance = gamification;
    return gamification;
  }

  updateWidget(container, data) {
    // ✅ SỬA: Kiểm tra xem có existing structure không
    const existingStructure = container.querySelector('.gamification-stats');
    
    if (existingStructure) {
      // Update existing popup structure
      this.updateExistingStructure(container, data);
    } else {
      // Update mini widget structure
      const widget = container.querySelector(".mini-gamification-widget");
      if (!widget) return;

      widget.style.opacity = "1";

      const levelEl = widget.querySelector(".mini-level");
      const xpFillEl = widget.querySelector(".mini-xp-fill");
      const xpEl = widget.querySelector(".mini-xp");

      if (levelEl) levelEl.textContent = `Lvl ${data.level}`;
      if (xpFillEl) xpFillEl.style.width = `${data.xpPercentage}%`;
      if (xpEl) xpEl.textContent = `${data.currentXP}/${data.xpToNextLevel}`;

      if (data.challenge) {
        const challengeEl = widget.querySelector(".mini-challenge");
        const iconEl = widget.querySelector(".mini-challenge-icon");
        const progressEl = widget.querySelector(".mini-challenge-progress");
        
        if (iconEl) iconEl.textContent = data.challenge.icon;
        if (progressEl) progressEl.textContent = `${data.challenge.progress}/${data.challenge.target}`;
        if (challengeEl) challengeEl.style.opacity = "1";
      }
    }
  }

  showLoadingState(container) {
    const widget = container.querySelector(".mini-gamification-widget");
    if (widget) {
      const loadingEl = widget.querySelector(".loading-overlay");
      if (!loadingEl) {
        widget.innerHTML += `<div class="loading-overlay">Loading...</div>`;
      }
    }
  }

  showErrorState(container) {
    const widget = container.querySelector(".mini-gamification-widget");
    if (widget) {
      widget.innerHTML = `<div class="error-state">⚠️ Gamification unavailable</div>`;
    }
  }

  getCachedData() {
    try {
      const cached = localStorage.getItem("fastGamificationCache");
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < this.cacheExpiry) {
          return data.content;
        }
      }
    } catch (error) {
      console.warn("Cache read error:", error);
    }
    return null;
  }

  cacheData(data) {
    try {
      localStorage.setItem("fastGamificationCache", JSON.stringify({
        content: data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn("Cache write error:", error);
    }
  }

  clearCache() {
    try {
      localStorage.removeItem("fastGamificationCache");
    } catch (error) {
      console.warn("Cache clear error:", error);
    }
    this.cachedData = null;
  }

  getChallengeIcon(type) {
    const icons = {
      "review-count": "📝",
      "accuracy": "🎯",
      "quality": "⭐",
      "speed": "⚡"
    };
    return icons[type] || "🎯";
  }
}

// Export for use in extension - Đảm bảo được expose đúng cách
if (typeof window !== 'undefined') {
  // Expose class
  window.FastGamificationWidget = FastGamificationWidget;
  
  // Create and expose instance
  window.fastGamificationWidget = new FastGamificationWidget();
  
  console.log('⚡ FastGamificationWidget exposed on window object');
}
