class GamificationUI {
  constructor() {
    this.gamification = null;
    this.analytics = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      // Wait for gamification components to be ready
      if (!window.VocabGamification || !window.VocabAnalytics) {
        await this.waitForComponents();
      }

      // Try to get analytics instance
      if (window.VocabAnalytics) {
        this.analytics = new window.VocabAnalytics();
        await this.analytics.ensureInitialized();
      }

      // Initialize gamification
      this.gamification = await this.initializeGamification();

      if (!this.gamification) {
        throw new Error("Unable to initialize gamification system");
      }

      window.addEventListener("vocabAnalyticsUpdated", this.handleAnalyticsUpdate.bind(this));
      this.initialized = true;
      console.log('🎮 GamificationUI initialized successfully');
    } catch (error) {
      console.error("❌ Gamification UI init failed:", error);
      // Don't throw, just log the error
    }
  }

  async initializeGamification() {
    // Try different initialization strategies
    if (this.analytics?.gamification) {
      return this.analytics.gamification;
    }

    if (this.analytics?.initGamification) {
      await this.analytics.initGamification();
      if (this.analytics.gamification) {
        return this.analytics.gamification;
      }
    }

    if (window.VocabGamification) {
      const gamification = new window.VocabGamification();
      await gamification.initializeGamification();
      return gamification;
    }

    throw new Error("No gamification system available");
  }

  // --------- Rendering ---------
  async renderDashboard(container) {
    if (!this.initialized) await this.init();
    if (!this.gamification) return this.renderPlaceholder(container);

    try {
      const [data, achievements, challenge] = await Promise.all([
        this.gamification.getPlayerStats(),
        this.gamification.getUnlockedAchievements(),
        this.gamification.getCurrentChallenge()
      ]);

      if (!data) return this.renderEmptyProfile(container);

      container.innerHTML = `
        ${this.renderPlayerHeader(data)}
        ${this.renderDailyChallenge(challenge)}
        ${this.renderStatsGrid(data)}
        ${this.renderAchievements(achievements)}
      `;
      this.attachEventListeners(container);
    } catch (error) {
      console.error("❌ Render dashboard error:", error);
      this.renderError(container, error.message);
    }
  }

  renderPlaceholder(container) {
    container.innerHTML = `
      <div class="gamification-placeholder">
        <div class="placeholder-content">
          <div class="placeholder-icon">🎮</div>
          <h3>Gamification Dashboard</h3>
          <p>Complete some word reviews to unlock gamification data!</p>
        </div>
      </div>`;
  }

  renderEmptyProfile(container) {
    container.innerHTML = `
      <div class="gamification-placeholder">
        <div class="placeholder-content">
          <div class="placeholder-icon">📊</div>
          <h3>Building Your Profile...</h3>
          <p>Review a few words to generate gamification stats!</p>
        </div>
      </div>`;
  }

  renderError(container, message) {
    container.innerHTML = `
      <div class="gamification-error">
        <span class="error-icon">⚠️</span>
        <p>Unable to load gamification data</p>
        <small>${message}</small>
      </div>`;
  }

  renderPlayerHeader(data) {
    const xpPct = ((data.currentXP || 0) / (data.xpToNextLevel || 100)) * 100;
    return `
      <div class="gamification-header">
        <div class="player-info">
          <div class="player-avatar">
            <div class="avatar-icon">${this.getLevelIcon(data.level)}</div>
            <div class="player-details">
              <h3>Vocabulary Master</h3>
              <p>${this.getLevelTitle(data.level)}</p>
            </div>
          </div>
          <div class="level-info">
            <div class="level-number">${data.level || 1}</div>
            <div class="xp-info">${data.currentXP || 0}/${data.xpToNextLevel || 100} XP</div>
          </div>
        </div>
        <div class="xp-progress"><div class="xp-progress-fill" style="width:${xpPct}%"></div></div>
      </div>`;
  }

  renderDailyChallenge(challenge) {
    if (!challenge) return "";
    const progress = challenge.progress || challenge.current || 0;
    const pct = Math.min((progress / challenge.target) * 100, 100);
    return `
      <div class="daily-challenge ${progress >= challenge.target ? "challenge-completed" : ""}">
        <div class="challenge-header">
          <h3>Daily Challenge</h3>
          <span>${this.getTimeUntilReset()}</span>
        </div>
        <div class="challenge-content">
          <div class="challenge-icon">${this.getChallengeIcon(challenge.type)}</div>
          <div class="challenge-details">
            <h4>${challenge.name}</h4>
            <p>${challenge.description}</p>
            <div class="challenge-progress">
              <div class="challenge-progress-bar">
                <div class="challenge-progress-fill" style="width:${pct}%"></div>
              </div>
              <span>${progress}/${challenge.target}</span>
            </div>
          </div>
        </div>
      </div>`;
  }

  renderStatsGrid(data) {
    const stats = [
      { icon: "🎯", number: data.totalWords || 0, label: "Words Learned" },
      { icon: "��", number: `${data.streakDays || 0} day${(data.streakDays || 0) === 1 ? "" : "s"}`, label: "Current Streak" },
      { icon: "⚡", number: data.currentXP || 0, label: "Total XP" },
      { icon: "🏆", number: data.achievementCount || 0, label: "Achievements" },
      { icon: "��", number: `${data.accuracy || 0}%`, label: "Accuracy" },
      { icon: "⭐", number: data.bestDayReviews || 0, label: "Best Day" }
    ];
    
    return `<div class="stats-grid">${stats.map(s => `
      <div class="stat-card-gam">
        <div class="stat-icon">${s.icon}</div>
        <div class="stat-number">${s.number}</div>
        <div class="stat-label">${s.label}</div>
      </div>`).join("")}</div>`;
  }

  renderAchievements(achievements) {
    return `
      <div class="achievement-section">
        <h3>🏆 Achievements</h3>
        <div class="achievement-grid">
          ${achievements.map(a => this.renderAchievementCard(a)).join("")}
        </div>
      </div>`;
  }

  renderAchievementCard(a) {
    return `
      <div class="achievement-card ${a.unlockedAt ? "unlocked" : "locked"}">
        <div class="achievement-header">
          <div class="achievement-icon">${a.icon}</div>
          <div class="achievement-info"><h4>${a.name}</h4></div>
        </div>
        <p>${a.description}</p>
        <div class="achievement-meta">
          <span>+${a.xp} XP</span>
          <span class="rarity-${a.rarity || "common"}">${a.rarity || "common"}</span>
        </div>
        ${a.unlockedAt ? `<div class="achievement-unlocked-date">Unlocked ${new Date(a.unlockedAt).toLocaleDateString()}</div>` : ""}
      </div>`;
  }

  // --------- Events ---------
  attachEventListeners(container) {
    container.querySelectorAll(".achievement-card").forEach(c =>
      c.addEventListener("click", () => c.classList.toggle("expanded"))
    );
    container.querySelectorAll(".stat-card-gam").forEach(c => {
      c.onmouseenter = () => (c.style.transform = "translateY(-4px) scale(1.02)");
      c.onmouseleave = () => (c.style.transform = "");
    });
  }

  async handleAnalyticsUpdate() {
    const container = document.querySelector(".gamification-dashboard");
    if (container) await this.renderDashboard(container);
  }

  // --------- Helpers ---------
  getLevelIcon(level) {
    const icons = ["🌱","🌿","🍀","🌳","⭐","💎","👑","🏆","🔥","⚡","🌟","✨"];
    return icons[Math.min(level - 1, icons.length - 1)];
  }
  getLevelTitle(level) {
    const titles = ["Novice","Learner","Student","Scholar","Expert","Master","Sage","Virtuoso","Legend","Champion","Grandmaster","Transcendent"];
    return titles[Math.min(level - 1, titles.length - 1)];
  }
  getChallengeIcon(type) {
    return { daily_words:"📚", streak:"🔥", accuracy:"🎯", perfect_session:"⚡", speed:"🚀", difficult_words:"💪" }[type] || "📚";
  }
  getTimeUntilReset() {
    const now = new Date(), tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1); tomorrow.setHours(0,0,0,0);
    const diff = tomorrow - now, h = Math.floor(diff/36e5), m = Math.floor((diff%36e5)/6e4);
    return `${h}h ${m}m left`;
  }

  async waitForComponents() {
    return new Promise((resolve) => {
      if (window.VocabGamification && window.VocabAnalytics) {
        resolve();
        return;
      }

      const checkComponents = () => {
        if (window.VocabGamification && window.VocabAnalytics) {
          resolve();
        } else {
          setTimeout(checkComponents, 100);
        }
      };

      checkComponents();
    });
  }
}

// Export for use in extension - Đảm bảo được expose đúng cách
if (typeof window !== 'undefined') {
  // Expose class
  window.GamificationUI = GamificationUI;
  
  // Create and expose instance
  window.gamificationUI = new GamificationUI();
  
  // Auto-initialize if not in content script context
  if (!window.chrome || !chrome.runtime) {
    document.addEventListener('DOMContentLoaded', () => {
      window.gamificationUI.init();
    });
  }
  
  console.log('🎮 GamificationUI exposed on window object');
}
