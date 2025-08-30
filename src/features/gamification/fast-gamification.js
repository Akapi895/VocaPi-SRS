import { VocabGamification } from "./gamification.js";

export class FastGamificationWidget {
  constructor() {
    this.cachedData = null;
    this.loadStartTime = Date.now();
    this.isLoading = false;
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

    if (!cachedData) this.showLoadingState(container);
    this.loadActualData(container);
  }

  async loadActualData(container) {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      const gamification = await this.getGamificationInstance();
      const data = await gamification.getPlayerStats();
      const challenge = await gamification.getCurrentChallenge();

      const processedData = {
        level: data?.level || 1,
        currentXP: data?.currentXP || 0,
        xpToNextLevel: data?.xpForNextLevel || 100,
        xpPercentage: ((data?.currentXP || 0) / (data?.xpForNextLevel || 100)) * 100,
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
    const gamification = new VocabGamification();
    await gamification.initializeGamification();
    window.gamificationInstance = gamification;
    return gamification;
  }

  updateWidget(container, data) {
    const widget = container.querySelector(".mini-gamification-widget");
    if (!widget) return;

    widget.style.opacity = "1";

    widget.querySelector(".mini-level").textContent = `Lvl ${data.level}`;
    widget.querySelector(".mini-xp-fill").style.width = `${data.xpPercentage}%`;
    widget.querySelector(".mini-xp").textContent = `${data.currentXP}/${data.xpToNextLevel}`;

    if (data.challenge) {
      widget.querySelector(".mini-challenge-icon").textContent = data.challenge.icon;
      widget.querySelector(".mini-challenge-progress").textContent =
        `${data.challenge.progress}/${data.challenge.target}`;
      widget.querySelector(".mini-challenge").style.opacity = "1";
    }
  }

  showLoadingState(container) {
    const widget = container.querySelector(".mini-gamification-widget");
    if (widget) {
      widget.innerHTML += `<div class="loading-overlay">Loading...</div>`;
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
        if (Date.now() - data.timestamp < 5 * 60 * 1000) return data.content;
      }
    } catch {}
    return null;
  }

  cacheData(data) {
    try {
      localStorage.setItem("fastGamificationCache", JSON.stringify({
        content: data,
        timestamp: Date.now()
      }));
    } catch {}
  }

  clearCache() {
    localStorage.removeItem("fastGamificationCache");
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
