  // Gamification UI Components and Logic
class GamificationUI {
  constructor() {
    this.gamification = null;
    this.analytics = null;
    this.initialized = false;
    this.animationQueue = [];
  }

  async init() {
    if (this.initialized) return;
    
    try {
      console.log('🎮 Starting GamificationUI initialization...');
      
      // Load required scripts
      await this.loadScripts();
      
      // Initialize core systems with better error handling
      console.log('🎮 Initializing VocabAnalytics...');
      this.analytics = new VocabAnalytics();
      await this.analytics.initializeAnalytics();
      
      // Try multiple ways to get gamification instance
      console.log('🎮 Trying to get gamification instance...');
      
      // Method 1: Try to get from analytics
      if (this.analytics && this.analytics.gamification) {
        console.log('🎮 Method 1: Got gamification from analytics');
        this.gamification = this.analytics.gamification;
      } 
      // Method 2: Try to initialize via analytics
      else if (this.analytics && typeof this.analytics.initGamification === 'function') {
        console.log('🎮 Method 2: Initializing via analytics.initGamification()');
        await this.analytics.initGamification();
        this.gamification = this.analytics.gamification;
      }
      
      // Method 3: Create standalone instance
      if (!this.gamification && typeof VocabGamification !== 'undefined') {
        console.log('🎮 Method 3: Creating standalone VocabGamification instance');
        this.gamification = new VocabGamification();
        await this.gamification.initializeGamification();
      }
      
      // Method 4: Check window scope
      if (!this.gamification && typeof window !== 'undefined' && window.VocabGamification) {
        console.log('🎮 Method 4: Creating from window.VocabGamification');
        this.gamification = new window.VocabGamification();
        await this.gamification.initializeGamification();
      }
      
      // Verify we have a working gamification instance
      if (!this.gamification) {
        console.error('❌ No gamification instance available after all attempts');
        throw new Error('Unable to initialize gamification system');
      }
      
      // Test the gamification instance
      try {
        const testStats = await this.gamification.getPlayerStats();
        console.log('✅ Gamification instance working, test stats:', testStats);
      } catch (testError) {
        console.warn('⚠️ Gamification instance exists but getPlayerStats failed:', testError);
        // Try to initialize it properly
        if (typeof this.gamification.initializeGamification === 'function') {
          await this.gamification.initializeGamification();
          console.log('🔄 Re-initialized gamification system');
        }
      }
      
      // Listen for analytics data updates
      window.addEventListener('vocabAnalyticsUpdated', this.handleAnalyticsUpdate.bind(this));
      console.log('🎮 Gamification UI event listeners added');
      
      this.initialized = true;
      console.log('✅ Gamification UI fully initialized');
    } catch (error) {
      console.error('❌ Error initializing Gamification UI:', error);
      // Don't throw - let the system continue with fallback
      this.initialized = false;
      this.gamification = null;
    }
  }

  async loadScripts() {
    // Check if scripts are already loaded
    if (typeof VocabAnalytics === 'undefined') {
      const analyticsScript = document.createElement('script');
      analyticsScript.src = '../analytics.js';
      document.head.appendChild(analyticsScript);
      
      await new Promise((resolve) => {
        analyticsScript.onload = resolve;
      });
    }
  }

  // Render complete gamification dashboard
  async renderDashboard(container) {
    if (!this.initialized) await this.init();
    
    console.log('🎮 Rendering gamification dashboard...');
    console.log('🎮 Gamification available:', !!this.gamification);
    console.log('🎮 Analytics available:', !!this.analytics);
    
    // If gamification is still not available, show helpful placeholder
    if (!this.gamification) {
      console.warn('⚠️ No gamification instance available for rendering');
      container.innerHTML = `
        <div class="gamification-placeholder">
          <div class="placeholder-content">
            <div class="placeholder-icon">🎮</div>
            <h3>Gamification Dashboard</h3>
            <p>Complete some word reviews to unlock your gamification data!</p>
            <div class="placeholder-stats">
              <div class="placeholder-stat">
                <span class="stat-icon">⚡</span>
                <span class="stat-value">Start Learning</span>
                <span class="stat-label">Begin Your Journey</span>
              </div>
              <div class="placeholder-stat">
                <span class="stat-icon">🏆</span>
                <span class="stat-value">Level 1</span>
                <span class="stat-label">Awaiting Progress</span>
              </div>
            </div>
            <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">
              Add and review some vocabulary words to see your achievements and progress here!
            </p>
          </div>
        </div>
      `;
      return;
    }
    
    // Ensure analytics is fresh
    if (this.analytics) {
      try {
        const freshStats = await this.analytics.getDashboardStats();
        console.log('📊 Fresh analytics stats for gamification:', freshStats);
      } catch (error) {
        console.warn('⚠️ Could not refresh analytics stats:', error);
      }
    }
    
    try {
      console.log('🎮 Getting gamification data...');
      const data = await this.gamification.getPlayerStats();
      console.log('🎮 Player stats retrieved:', data);
      
      const achievements = await this.gamification.getAchievements();
      console.log('🎮 Achievements retrieved:', achievements?.length || 0);
      
      const challenge = await this.gamification.getCurrentChallenge();
      console.log('🎮 Current challenge retrieved:', !!challenge);
      
      console.log('🎮 Gamification render data:', { data, achievements: achievements?.length, challenge });
      
      if (!data) {
        console.warn('⚠️ No player stats data available');
        container.innerHTML = `
          <div class="gamification-placeholder">
            <div class="placeholder-content">
              <div class="placeholder-icon">📊</div>
              <h3>Building Your Profile...</h3>
              <p>Complete a few word reviews to generate your gamification stats!</p>
              <div class="placeholder-stats">
                <div class="placeholder-stat">
                  <span class="stat-icon">📚</span>
                  <span class="stat-value">0</span>
                  <span class="stat-label">Words Learned</span>
                </div>
                <div class="placeholder-stat">
                  <span class="stat-icon">⚡</span>
                  <span class="stat-value">0</span>
                  <span class="stat-label">XP Points</span>
                </div>
              </div>
            </div>
          </div>
        `;
        return;
      }
      
      container.innerHTML = `
        ${this.renderPlayerHeader(data)}
        ${this.renderDailyChallenge(challenge)}
        ${this.renderStatsGrid(data)}
        ${this.renderAchievements(achievements)}
      `;
      
      this.attachEventListeners(container);
      
      console.log('✅ Gamification dashboard rendered successfully');
      
    } catch (error) {
      console.error('❌ Error getting gamification data:', error);
      container.innerHTML = `
        <div class="gamification-error">
          <div class="error-content">
            <span class="error-icon">⚠️</span>
            <p>Unable to load gamification data</p>
            <small>Error: ${error.message}</small>
            <p style="margin-top: 12px; font-size: 12px; color: #94a3b8;">
              Try adding and reviewing some words, then refresh the page.
            </p>
          </div>
        </div>
      `;
    }
  }

  // Player info header with level and XP
  renderPlayerHeader(data) {
    const xpPercentage = ((data.currentXP || 0) / (data.xpToNextLevel || 100)) * 100;
    
    return `
      <div class="gamification-header">
        <div class="player-info">
          <div class="player-avatar">
            <div class="avatar-icon">
              ${this.getLevelIcon(data.level)}
            </div>
            <div class="player-details">
              <h3>Vocabulary Master</h3>
              <p class="player-title">${this.getLevelTitle(data.level)}</p>
            </div>
          </div>
          <div class="level-info">
            <div class="level-number">${data.level || 1}</div>
            <div class="xp-info">
              ${data.currentXP || 0} / ${data.xpToNextLevel || 100} XP
            </div>
          </div>
        </div>
        <div class="xp-progress">
          <div class="xp-progress-fill" style="width: ${xpPercentage}%"></div>
        </div>
      </div>
    `;
  }

  // Daily challenge widget
  renderDailyChallenge(challenge) {
    if (!challenge) return '';
    
    const progressPercentage = Math.min(((challenge.progress || challenge.current || 0) / challenge.target) * 100, 100);
    const isCompleted = (challenge.progress || challenge.current || 0) >= challenge.target;
    const timeLeft = this.getTimeUntilReset();
    
    return `
      <div class="daily-challenge ${isCompleted ? 'challenge-completed' : ''}">
        <div class="challenge-header">
          <h3 class="challenge-title">Daily Challenge</h3>
          <span class="challenge-time">${timeLeft}</span>
        </div>
        <div class="challenge-content">
          <div class="challenge-icon">
            ${this.getChallengeIcon(challenge.type)}
          </div>
          <div class="challenge-details">
            <h4>${challenge.name}</h4>
            <p class="challenge-description">${challenge.description}</p>
            <div class="challenge-progress">
              <div class="challenge-progress-bar">
                <div class="challenge-progress-fill" style="width: ${progressPercentage}%"></div>
              </div>
              <span class="challenge-progress-text">
                ${challenge.progress || challenge.current || 0}/${challenge.target}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Statistics grid
  renderStatsGrid(data) {
    console.log('🎮 Rendering stats grid with data:', data);
    
    const stats = [
      { icon: '🎯', number: data.totalWords || 0, label: 'Words Learned' },
      { icon: '🔥', number: `${data.currentStreak || 0} day${(data.currentStreak || 0) !== 1 ? 's' : ''}`, label: 'Current Streak' },
      { icon: '⚡', number: data.totalXP || 0, label: 'Total XP' },
      { icon: '🏆', number: data.achievementCount || 0, label: 'Achievements' },
      { icon: '📈', number: `${Math.round((data.accuracy || 0) * 100)}%`, label: 'Accuracy' },
      { icon: '⭐', number: data.perfectSessions || 0, label: 'Perfect Sessions' }
    ];
    
    return `
      <div class="stats-grid">
        ${stats.map(stat => `
          <div class="stat-card-gam">
            <div class="stat-icon">${stat.icon}</div>
            <div class="stat-number">${stat.number}</div>
            <div class="stat-label">${stat.label}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Achievement grid
  renderAchievements(achievements) {
    return `
      <div class="achievement-section">
        <h3 style="color: white; margin-bottom: 16px;">🏆 Achievements</h3>
        <div class="achievement-grid">
          ${achievements.map(achievement => this.renderAchievementCard(achievement)).join('')}
        </div>
      </div>
    `;
  }

  // Individual achievement card
  renderAchievementCard(achievement) {
    const isUnlocked = achievement.unlockedAt;
    const rarity = achievement.rarity || 'common';
    
    return `
      <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-header">
          <div class="achievement-icon">
            ${achievement.icon}
          </div>
          <div class="achievement-info">
            <h4>${achievement.name}</h4>
          </div>
        </div>
        <p class="achievement-description">${achievement.description}</p>
        <div class="achievement-meta">
          <span class="achievement-xp">+${achievement.xp} XP</span>
          <span class="achievement-rarity rarity-${rarity}">${rarity}</span>
        </div>
        ${isUnlocked ? `
          <div class="achievement-unlocked-date">
            Unlocked ${new Date(achievement.unlockedAt).toLocaleDateString()}
          </div>
        ` : ''}
      </div>
    `;
  }

  // Mini gamification widget for popup
  async renderMiniWidget(container) {
    if (!this.initialized) await this.init();
    
    const data = await this.gamification.getPlayerStats();
    const challenge = await this.gamification.getCurrentChallenge();
    
    console.log('🎮 Gamification Widget Data:', { data, challenge });
    
    if (!data) {
      container.innerHTML = `
        <div class="mini-gamification-widget">
          <div class="mini-level-info">
            <span style="color: #ff6b6b;">⚠️ Gamification data not available</span>
          </div>
        </div>
      `;
      return;
    }
    
    const xpPercentage = ((data.currentXP || 0) / (data.xpToNextLevel || 100)) * 100;
    
    container.innerHTML = `
      <div class="mini-gamification-widget">
        <div class="mini-level-info">
          <span class="mini-level">Lvl ${data.level || 1}</span>
          <div class="mini-xp-bar">
            <div class="mini-xp-fill" style="width: ${xpPercentage}%"></div>
          </div>
          <span class="mini-xp">${data.currentXP || 0}/${data.xpToNextLevel || 100}</span>
        </div>
        ${challenge ? `
          <div class="mini-challenge">
            <span class="mini-challenge-icon">${this.getChallengeIcon(challenge.type)}</span>
            <span class="mini-challenge-progress">${challenge.progress || challenge.current || 0}/${challenge.target}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  // XP gain animation
  showXPGain(container, amount, reason) {
    const xpElement = document.createElement('div');
    xpElement.className = 'xp-gain-animation';
    xpElement.textContent = `+${amount} XP`;
    xpElement.title = reason;
    
    container.style.position = 'relative';
    container.appendChild(xpElement);
    
    setTimeout(() => {
      if (xpElement.parentNode) {
        xpElement.parentNode.removeChild(xpElement);
      }
    }, 2000);
  }

  // Level up celebration
  showLevelUp(newLevel) {
    // Create level up modal
    const modal = document.createElement('div');
    modal.className = 'level-up-modal';
    modal.innerHTML = `
      <div class="level-up-content">
        <div class="level-up-icon">🎉</div>
        <h2>Level Up!</h2>
        <div class="new-level">Level ${newLevel}</div>
        <p class="level-up-message">${this.getLevelUpMessage(newLevel)}</p>
        <button class="level-up-close">Continue</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle close
    modal.querySelector('.level-up-close').addEventListener('click', () => {
      modal.remove();
    });
    
    // Auto close after 5 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 5000);
    
    // Play sound if available
    this.playSound('levelUp');
  }

  // Achievement unlock notification
  showAchievementUnlock(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification achievement-unlock-animation';
    notification.innerHTML = `
      <div class="achievement-notification-content">
        <div class="achievement-notification-icon">${achievement.icon}</div>
        <div class="achievement-notification-info">
          <h4>Achievement Unlocked!</h4>
          <p>${achievement.name}</p>
          <span class="achievement-notification-xp">+${achievement.xpReward} XP</span>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 4000);
    
    this.playSound('achievement');
  }

  // Helper functions
  getLevelIcon(level) {
    const icons = ['🌱', '🌿', '🍀', '🌳', '⭐', '💎', '👑', '🏆', '🔥', '⚡', '🌟', '✨'];
    return icons[Math.min(level - 1, icons.length - 1)] || '🌱';
  }

  getLevelTitle(level) {
    const titles = [
      'Novice', 'Learner', 'Student', 'Scholar', 'Expert',
      'Master', 'Sage', 'Virtuoso', 'Legend', 'Champion',
      'Grandmaster', 'Transcendent'
    ];
    return titles[Math.min(level - 1, titles.length - 1)] || 'Novice';
  }

  // Create mock/fallback data when gamification system isn't working
  createMockGamificationData() {
    return {
      playerStats: {
        level: 1,
        currentXP: 0,
        xpToNextLevel: 100,
        totalWords: 0,
        currentStreak: 0,
        totalXP: 0,
        achievementCount: 0,
        accuracy: 0,
        perfectSessions: 0
      },
      achievements: [
        {
          name: 'First Steps',
          description: 'Complete your first word review',
          icon: '👶',
          xp: 10,
          rarity: 'common',
          unlockedAt: null
        },
        {
          name: 'Word Explorer',
          description: 'Learn 10 new words',
          icon: '🗺️',
          xp: 50,
          rarity: 'common',
          unlockedAt: null
        },
        {
          name: 'Streak Master',
          description: 'Maintain a 7-day learning streak',
          icon: '🔥',
          xp: 100,
          rarity: 'rare',
          unlockedAt: null
        }
      ],
      dailyChallenge: {
        type: 'daily_words',
        name: 'Daily Vocabulary',
        description: 'Review 5 words today',
        target: 5,
        current: 0,
        progress: 0
      }
    };
  }

  // Render dashboard with mock data when needed
  async renderDashboardWithFallback(container) {
    console.log('🎮 Rendering gamification dashboard with fallback data...');
    
    const mockData = this.createMockGamificationData();
    
    container.innerHTML = `
      <div class="gamification-placeholder">
        <div class="placeholder-content">
          <div class="placeholder-icon">🎮</div>
          <h3>Welcome to Vocab SRS!</h3>
          <p>Start learning to unlock your gamification features</p>
          
          <div class="mock-gamification-preview">
            <div class="mock-player-header">
              <div class="mock-avatar">🌱</div>
              <div class="mock-info">
                <h4>Vocabulary Novice</h4>
                <p>Level 1 • 0/100 XP</p>
              </div>
            </div>
            
            <div class="mock-stats-grid">
              <div class="mock-stat">
                <span class="stat-icon">📚</span>
                <span class="stat-number">0</span>
                <span class="stat-label">Words Learned</span>
              </div>
              <div class="mock-stat">
                <span class="stat-icon">🔥</span>
                <span class="stat-number">0</span>
                <span class="stat-label">Current Streak</span>
              </div>
              <div class="mock-stat">
                <span class="stat-icon">⚡</span>
                <span class="stat-number">0</span>
                <span class="stat-label">Total XP</span>
              </div>
              <div class="mock-stat">
                <span class="stat-icon">🏆</span>
                <span class="stat-number">0</span>
                <span class="stat-label">Achievements</span>
              </div>
            </div>
            
            <div class="mock-challenge">
              <h4>📚 Today's Challenge</h4>
              <p>Review 5 words to start your journey!</p>
              <div class="mock-progress-bar">
                <div class="mock-progress-fill" style="width: 0%"></div>
              </div>
              <span class="mock-progress-text">0/5 words</span>
            </div>
            
            <div class="start-learning-cta">
              <p>🚀 Add some vocabulary words and start reviewing to unlock:</p>
              <ul>
                <li>✨ Experience Points & Leveling</li>
                <li>🏆 Achievements & Badges</li>
                <li>🔥 Learning Streaks</li>
                <li>📊 Progress Tracking</li>
                <li>🎯 Daily Challenges</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
    
    console.log('✅ Fallback gamification dashboard rendered');
  }

  getChallengeIcon(type) {
    const icons = {
      'daily_words': '📚',
      'streak': '🔥',
      'accuracy': '🎯',
      'perfect_session': '⚡',
      'speed': '🚀',
      'difficult_words': '💪'
    };
    return icons[type] || '📚';
  }

  getLevelUpMessage(level) {
    const messages = [
      "You're getting the hang of this!",
      "Your vocabulary is expanding!",
      "Impressive dedication!",
      "You're becoming a word master!",
      "Exceptional progress!",
      "Your skills are outstanding!",
      "You've reached new heights!",
      "Legendary achievement!",
      "You're unstoppable!",
      "Vocabulary virtuoso!",
      "Absolute mastery!",
      "Beyond perfection!"
    ];
    return messages[Math.min(level - 2, messages.length - 1)] || "Great progress!";
  }

  getTimeUntilReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m left`;
  }

  playSound(type) {
    try {
      // Create audio context for sound effects
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Simple beep sounds using Web Audio API
      const sounds = {
        levelUp: { frequency: 800, duration: 0.3 },
        achievement: { frequency: 600, duration: 0.2 },
        xp: { frequency: 400, duration: 0.1 }
      };
      
      const sound = sounds[type];
      if (!sound) return;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = sound.frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + sound.duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + sound.duration);
    } catch (error) {
      console.log('🔇 Sound not available:', error.message);
    }
  }

  attachEventListeners(container) {
    // Add click handlers for interactive elements
    const achievementCards = container.querySelectorAll('.achievement-card');
    achievementCards.forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('expanded');
      });
    });
    
    // Add hover effects
    const statCards = container.querySelectorAll('.stat-card-gam');
    statCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px) scale(1.02)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // Update gamification data and refresh UI
  async updateDisplay(container) {
    if (!this.initialized || !container) return;
    
    try {
      await this.renderDashboard(container);
    } catch (error) {
      console.error('❌ Error updating gamification display:', error);
    }
  }

  // Handle word review completion with gamification feedback
  async onWordReviewed(quality, isNewWord, difficulty) {
    if (!this.initialized) return;
    
    try {
      const result = await this.gamification.onWordReviewed(quality, isNewWord, difficulty);
      
      if (result.xpGained > 0) {
        // Find a suitable container for XP animation
        const container = document.querySelector('.gamification-header, .mini-gamification-widget, body');
        if (container) {
          this.showXPGain(container, result.xpGained, result.xpReason);
        }
      }
      
      if (result.leveledUp) {
        this.showLevelUp(result.newLevel);
      }
      
      if (result.achievementsUnlocked.length > 0) {
        result.achievementsUnlocked.forEach(achievement => {
          setTimeout(() => this.showAchievementUnlock(achievement), 500);
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error handling word review in gamification:', error);
      return null;
    }
  }
  
  // Handle analytics data updates and refresh gamification UI
  async handleAnalyticsUpdate(event) {
    console.log('🎮 Gamification UI received analytics update notification', event.detail);
    
    // Find the gamification container and refresh if visible
    const gamificationContainer = document.querySelector('.gamification-dashboard');
    if (gamificationContainer && gamificationContainer.style.display !== 'none') {
      console.log('🎮 Refreshing visible gamification dashboard');
      await this.renderDashboard(gamificationContainer);
    }
    
    // Also refresh any stat grids that might be visible
    const statGrids = document.querySelectorAll('.gamification-stats');
    for (const grid of statGrids) {
      if (grid.style.display !== 'none') {
        const data = await this.gamification.getPlayerStats();
        grid.innerHTML = this.renderStatsGrid(data);
        console.log('🎮 Refreshed gamification stats grid');
      }
    }
    
    // Refresh mini widgets (for popup)
    const miniWidgets = document.querySelectorAll('.mini-gamification-widget');
    for (const widget of miniWidgets) {
      const container = widget.parentElement;
      if (container && container.style.display !== 'none') {
        console.log('🎮 Refreshing mini gamification widget');
        await this.renderMiniWidget(container);
      }
    }
  }
}

// Initialize global gamification UI instance
const gamificationUI = new GamificationUI();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GamificationUI;
}
