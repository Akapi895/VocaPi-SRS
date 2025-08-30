import { VocabGamification } from "./gamification.js";
import { FastGamificationWidget } from "./fast-gamification.js";
import { VocabAnalytics } from "../analytics/core/vocab-analytics.js";

class GamificationUI {
  constructor() {
    this.gamification = null;
    this.analytics = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    try {
      this.analytics = new VocabAnalytics();
      await this.analytics.ensureInitialized();

      this.gamification =
        this.analytics?.gamification ||
        (this.analytics?.initGamification && (await this.analytics.initGamification(), this.analytics.gamification)) ||
        (typeof VocabGamification !== "undefined" && new VocabGamification()) ||
        (window?.VocabGamification && new window.VocabGamification());

      if (!this.gamification) throw new Error("Unable to initialize gamification system");
      if (typeof this.gamification.initializeGamification === "function") await this.gamification.initializeGamification();

      // Test
      try { await this.gamification.getPlayerStats(); } 
      catch { await this.gamification.initializeGamification(); }

      window.addEventListener("vocabAnalyticsUpdated", this.handleAnalyticsUpdate.bind(this));
      this.initialized = true;
    } catch (error) {
      console.error("❌ Gamification UI init failed:", error);
    }
  }

  // --------- Rendering ---------
  async renderDashboard(container) {
    if (!this.initialized) await this.init();
    if (!this.gamification) return this.renderPlaceholder(container);

    try {
      const [data, achievements, challenge] = await Promise.all([
        this.gamification.getPlayerStats(),
        this.gamification.getAchievements(),
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
      { icon: "🔥", number: `${data.currentStreak || 0} day${data.currentStreak === 1 ? "" : "s"}`, label: "Current Streak" },
      { icon: "⚡", number: data.totalXP || 0, label: "Total XP" },
      { icon: "🏆", number: data.achievementCount || 0, label: "Achievements" },
      { icon: "📈", number: `${Math.round((data.accuracy || 0) * 100)}%`, label: "Accuracy" },
      { icon: "⭐", number: data.perfectSessions || 0, label: "Perfect Sessions" }
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
}

export const gamificationUI = new GamificationUI();
