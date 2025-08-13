// Vocab SRS Gamification System
class VocabGamification {
  constructor() {
    this.storageKey = 'vocabGamification';
    this.analytics = null; // Will be set by parent
  }
  
  // XP and Level System
  static LEVEL_THRESHOLDS = [
    0,      // Level 1 (Beginner)
    100,    // Level 2 (Novice)
    300,    // Level 3 (Learner)
    600,    // Level 4 (Student)
    1000,   // Level 5 (Scholar)
    1500,   // Level 6 (Expert)
    2200,   // Level 7 (Master)
    3000,   // Level 8 (Guru)
    4000,   // Level 9 (Sage)
    5500,   // Level 10 (Legend)
    7500,   // Level 11 (Grandmaster)
    10000   // Level 12 (Vocabulary Titan)
  ];
  
  static LEVEL_NAMES = [
    '🌱 Seed',
    '🌿 Sprout', 
    '🌳 Sapling',
    '📚 Student',
    '🎓 Scholar',
    '⭐ Expert',
    '💫 Master',
    '🔮 Guru',
    '🧙 Sage',
    '👑 Legend',
    '⚡ Grandmaster',
    '🚀 Vocabulary Titan'
  ];
  
  // Achievement System
  static ACHIEVEMENTS = {
    // Learning Milestones
    first_word: {
      id: 'first_word',
      name: 'First Steps',
      description: 'Added your first word to the dictionary',
      icon: '📝',
      xp: 50,
      rarity: 'common',
      category: 'milestone'
    },
    
    words_10: {
      id: 'words_10',
      name: 'Vocabulary Builder',
      description: 'Learn 10 different words',
      icon: '📖',
      xp: 100,
      rarity: 'common',
      category: 'milestone'
    },
    
    words_50: {
      id: 'words_50',
      name: 'Word Collector',
      description: 'Learn 50 different words',
      icon: '📚',
      xp: 250,
      rarity: 'uncommon',
      category: 'milestone'
    },
    
    words_100: {
      id: 'words_100',
      name: 'Century Club',
      description: 'Learn 100 different words',
      icon: '💯',
      xp: 500,
      rarity: 'rare',
      category: 'milestone'
    },
    
    words_500: {
      id: 'words_500',
      name: 'Lexicon Master',
      description: 'Learn 500 different words',
      icon: '🏆',
      xp: 1000,
      rarity: 'epic',
      category: 'milestone'
    },
    
    words_1000: {
      id: 'words_1000',
      name: 'Dictionary Dominator',
      description: 'Learn 1000 different words',
      icon: '👑',
      xp: 2000,
      rarity: 'legendary',
      category: 'milestone'
    },
    
    // Streak Achievements
    streak_3: {
      id: 'streak_3',
      name: 'Getting Started',
      description: 'Maintain a 3-day learning streak',
      icon: '🔥',
      xp: 75,
      rarity: 'common',
      category: 'streak'
    },
    
    streak_7: {
      id: 'streak_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day learning streak',
      icon: '🗓️',
      xp: 200,
      rarity: 'uncommon',
      category: 'streak'
    },
    
    streak_30: {
      id: 'streak_30',
      name: 'Monthly Master',
      description: 'Maintain a 30-day learning streak',
      icon: '📅',
      xp: 800,
      rarity: 'rare',
      category: 'streak'
    },
    
    streak_100: {
      id: 'streak_100',
      name: 'Centurion',
      description: 'Maintain a 100-day learning streak',
      icon: '⚔️',
      xp: 2500,
      rarity: 'epic',
      category: 'streak'
    },
    
    // Performance Achievements
    perfect_session: {
      id: 'perfect_session',
      name: 'Perfectionist',
      description: 'Complete a session with 100% accuracy',
      icon: '⭐',
      xp: 100,
      rarity: 'uncommon',
      category: 'performance'
    },
    
    speed_demon: {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Answer 10 words correctly in under 30 seconds',
      icon: '⚡',
      xp: 150,
      rarity: 'uncommon',
      category: 'performance'
    },
    
    marathon_session: {
      id: 'marathon_session',
      name: 'Marathon Runner',
      description: 'Study for 2+ hours in a single session',
      icon: '🏃‍♂️',
      xp: 300,
      rarity: 'rare',
      category: 'performance'
    },
    
    early_bird: {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Study before 7 AM',
      icon: '🌅',
      xp: 100,
      rarity: 'uncommon',
      category: 'time'
    },
    
    night_owl: {
      id: 'night_owl',
      name: 'Night Owl',
      description: 'Study after 11 PM',
      icon: '🦉',
      xp: 100,
      rarity: 'uncommon',
      category: 'time'
    },
    
    // Special Achievements
    comeback_kid: {
      id: 'comeback_kid',
      name: 'Comeback Kid',
      description: 'Restart your streak after a 7-day break',
      icon: '🔄',
      xp: 200,
      rarity: 'rare',
      category: 'special'
    },
    
    quality_master: {
      id: 'quality_master',
      name: 'Quality Master',
      description: '90% of your reviews are Quality 4 or 5',
      icon: '💎',
      xp: 500,
      rarity: 'epic',
      category: 'special'
    },
    
    explorer: {
      id: 'explorer',
      name: 'Word Explorer',
      description: 'Learn words from 10 different websites',
      icon: '🗺️',
      xp: 300,
      rarity: 'rare',
      category: 'special'
    }
  };
  
  // Daily Challenges
  static DAILY_CHALLENGES = {
    daily_5: {
      id: 'daily_5',
      name: 'Daily Five',
      description: 'Review 5 words today',
      target: 5,
      type: 'review_count',
      xp: 25,
      icon: '📝'
    },
    
    daily_perfect: {
      id: 'daily_perfect',
      name: 'Daily Perfect',
      description: 'Get 100% accuracy today',
      target: 100,
      type: 'accuracy',
      xp: 50,
      icon: '⭐'
    },
    
    daily_time: {
      id: 'daily_time',
      name: 'Daily Dedication',
      description: 'Study for 15 minutes today',
      target: 15,
      type: 'time_spent',
      xp: 30,
      icon: '⏰'
    },
    
    daily_streak: {
      id: 'daily_streak',
      name: 'Keep It Going',
      description: 'Maintain your streak',
      target: 1,
      type: 'streak_maintain',
      xp: 20,
      icon: '🔥'
    }
  };
  
  // Weekly Challenges
  static WEEKLY_CHALLENGES = {
    weekly_explorer: {
      id: 'weekly_explorer',
      name: 'Weekly Explorer',
      description: 'Add words from 5 different sources this week',
      target: 5,
      type: 'source_diversity',
      xp: 100,
      icon: '🗺️',
      duration: 7
    },
    
    weekly_marathon: {
      id: 'weekly_marathon',
      name: 'Weekly Marathon',
      description: 'Study for 3+ hours this week',
      target: 180,
      type: 'weekly_time',
      xp: 150,
      icon: '🏃‍♂️',
      duration: 7
    },
    
    weekly_perfectionist: {
      id: 'weekly_perfectionist',
      name: 'Weekly Perfectionist',
      description: 'Maintain 85%+ accuracy this week',
      target: 85,
      type: 'weekly_accuracy',
      xp: 120,
      icon: '💎',
      duration: 7
    }
  };
  
  async initializeGamification() {
    const existing = await this.getGamificationData();
    if (!existing || !existing.initialized) {
      const initialData = {
        initialized: true,
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        
        // Player Stats
        level: 1,
        xp: 0,
        xpToNextLevel: VocabGamification.LEVEL_THRESHOLDS[1],
        title: VocabGamification.LEVEL_NAMES[0],
        
        // Achievement Tracking
        unlockedAchievements: [],
        achievementProgress: {},
        
        // Challenge System
        dailyChallenge: null,
        weeklyChallenge: null,
        challengeHistory: [],
        completedChallenges: [],
        
        // Leaderboard & Social
        badges: [],
        totalBadges: 0,
        
        // Statistics
        sessionsCompleted: 0,
        perfectSessions: 0,
        longestSession: 0,
        averageAccuracy: 0,
        
        // Multipliers & Bonuses
        xpMultiplier: 1.0,
        streakBonus: 1.0,
        
        // Customization
        selectedTitle: VocabGamification.LEVEL_NAMES[0],
        selectedBadge: null
      };
      
      await this.saveGamificationData(initialData);
    }
  }
  
  async getGamificationData() {
    return new Promise((resolve) => {
      try {
        if (typeof chrome === 'undefined' || !chrome.storage) {
          console.warn('Chrome storage not available in gamification context');
          resolve({
            initialized: true,
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            level: 1,
            xp: 0,
            xpToNextLevel: VocabGamification.LEVEL_THRESHOLDS[1],
            title: VocabGamification.LEVEL_NAMES[0],
            unlockedAchievements: [],
            achievementProgress: {},
            dailyChallenge: null,
            weeklyChallenge: null,
            challengeHistory: [],
            completedChallenges: [],
            badges: [],
            totalBadges: 0,
            sessionsCompleted: 0,
            perfectSessions: 0,
            longestSession: 0,
            averageAccuracy: 0,
            xpMultiplier: 1.0,
            streakBonus: 1.0,
            selectedTitle: VocabGamification.LEVEL_NAMES[0],
            selectedBadge: null
          });
          return;
        }
        
        chrome.storage.local.get([this.storageKey], (result) => {
          if (chrome.runtime.lastError) {
            console.warn('Chrome storage error in gamification:', chrome.runtime.lastError);
            resolve({
              initialized: true,
              version: '1.0.0',
              createdAt: new Date().toISOString(),
              level: 1,
              xp: 0,
              xpToNextLevel: VocabGamification.LEVEL_THRESHOLDS[1],
              title: VocabGamification.LEVEL_NAMES[0],
              unlockedAchievements: [],
              achievementProgress: {},
              dailyChallenge: null,
              weeklyChallenge: null,
              challengeHistory: [],
              completedChallenges: [],
              badges: [],
              totalBadges: 0,
              sessionsCompleted: 0,
              perfectSessions: 0,
              longestSession: 0,
              averageAccuracy: 0,
              xpMultiplier: 1.0,
              streakBonus: 1.0,
              selectedTitle: VocabGamification.LEVEL_NAMES[0],
              selectedBadge: null
            });
            return;
          }
          resolve(result[this.storageKey] || null);
        });
      } catch (error) {
        console.warn('Error accessing chrome storage in gamification:', error);
        resolve(null);
      }
    });
  }
  
  async saveGamificationData(data) {
    return new Promise((resolve) => {
      try {
        if (typeof chrome === 'undefined' || !chrome.storage) {
          resolve();
          return;
        }
        
        chrome.storage.local.set({ [this.storageKey]: data }, () => {
          resolve();
        });
      } catch (error) {
        resolve();
      }
    });
  }
  
  // Level System
  calculateLevel(totalXP) {
    let level = 1;
    for (let i = VocabGamification.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalXP >= VocabGamification.LEVEL_THRESHOLDS[i]) {
        level = i + 1;
        break;
      }
    }
    return Math.min(level, VocabGamification.LEVEL_THRESHOLDS.length);
  }
  
  getXPToNextLevel(currentXP, currentLevel) {
    if (currentLevel >= VocabGamification.LEVEL_THRESHOLDS.length) {
      return 0; // Max level reached
    }
    return VocabGamification.LEVEL_THRESHOLDS[currentLevel] - currentXP;
  }
  
  async awardXP(baseXP, context = {}) {
    const data = await this.getGamificationData();
    if (!data) return baseXP;
    
    let totalXP = baseXP;
    
    // Apply multipliers
    totalXP *= data.xpMultiplier;
    totalXP *= data.streakBonus;
    
    // Bonus XP for specific contexts
    if (context.perfectAnswer) totalXP *= 1.2;
    if (context.fastAnswer) totalXP *= 1.1;
    if (context.difficultWord) totalXP *= 1.3;
    if (context.firstTime) totalXP *= 1.5;
    
    totalXP = Math.round(totalXP);
    
    const oldLevel = data.level;
    data.xp += totalXP;
    data.level = this.calculateLevel(data.xp);
    data.xpToNextLevel = this.getXPToNextLevel(data.xp, data.level);
    
    // Level up notification
    if (data.level > oldLevel) {
      await this.handleLevelUp(data, oldLevel);
    }
    
    await this.saveGamificationData(data);
    return totalXP;
  }
  
  async handleLevelUp(data, oldLevel) {
    const newLevel = data.level;
    data.title = VocabGamification.LEVEL_NAMES[Math.min(newLevel - 1, VocabGamification.LEVEL_NAMES.length - 1)];
    
    // Show level up notification
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon48.png',
        title: '🎉 Level Up!',
        message: `Congratulations! You've reached Level ${newLevel}: ${data.title}`,
        priority: 2
      });
    }
    
    // Award level up bonus XP
    const bonusXP = newLevel * 50;
    data.xp += bonusXP;
    
    if (window.VocabLogger) {
      window.VocabLogger.info(`Level up! ${oldLevel} → ${newLevel} (${data.title}), Bonus XP: +${bonusXP}`);
    }
  }
  
  // Achievement System
  async checkAchievements(analyticsData) {
    const gamData = await this.getGamificationData();
    if (!gamData) return [];
    
    const newAchievements = [];
    
    for (const [id, achievement] of Object.entries(VocabGamification.ACHIEVEMENTS)) {
      // Skip if already unlocked
      if (gamData.unlockedAchievements.includes(id)) continue;
      
      let unlocked = false;
      
      switch (id) {
        case 'first_word':
          unlocked = analyticsData.totalWordsLearned >= 1;
          break;
        case 'words_10':
          unlocked = analyticsData.totalWordsLearned >= 10;
          break;
        case 'words_50':
          unlocked = analyticsData.totalWordsLearned >= 50;
          break;
        case 'words_100':
          unlocked = analyticsData.totalWordsLearned >= 100;
          break;
        case 'words_500':
          unlocked = analyticsData.totalWordsLearned >= 500;
          break;
        case 'words_1000':
          unlocked = analyticsData.totalWordsLearned >= 1000;
          break;
        case 'streak_3':
          unlocked = analyticsData.currentStreak >= 3;
          break;
        case 'streak_7':
          unlocked = analyticsData.currentStreak >= 7;
          break;
        case 'streak_30':
          unlocked = analyticsData.currentStreak >= 30;
          break;
        case 'streak_100':
          unlocked = analyticsData.currentStreak >= 100;
          break;
        case 'perfect_session':
          const today = new Date().toISOString().split('T')[0];
          unlocked = analyticsData.dailyStats[today]?.accuracy === 100;
          break;
        case 'quality_master':
          const qualityDist = analyticsData.qualityDistribution;
          const highQuality = (qualityDist[4] || 0) + (qualityDist[5] || 0);
          const totalReviews = Object.values(qualityDist).reduce((sum, count) => sum + count, 0);
          unlocked = totalReviews > 20 && (highQuality / totalReviews) >= 0.9;
          break;
        // Add more achievement checks here
      }
      
      if (unlocked) {
        gamData.unlockedAchievements.push(id);
        newAchievements.push({
          ...achievement,
          unlockedAt: new Date().toISOString()
        });
        
        // Award XP
        await this.awardXP(achievement.xp, { achievement: true });
        
        // Show notification
        this.showAchievementNotification(achievement);
      }
    }
    
    if (newAchievements.length > 0) {
      await this.saveGamificationData(gamData);
    }
    
    return newAchievements;
  }
  
  showAchievementNotification(achievement) {
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon48.png',
        title: `🏆 Achievement Unlocked!`,
        message: `${achievement.icon} ${achievement.name}: ${achievement.description}`,
        priority: 1
      });
    }
  }
  
  // Daily Challenge System
  async generateDailyChallenge() {
    const data = await this.getGamificationData();
    if (!data) return null;
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`🎯 [Generate] Checking daily challenge for ${today}`);
    
    // Check if we already have today's challenge
    if (data.dailyChallenge && data.dailyChallenge.date === today) {
      console.log(`🎯 [Generate] Already have today's challenge:`, data.dailyChallenge);
      return data.dailyChallenge;
    }
    
    // Generate new daily challenge - force Daily Five for testing
    console.log(`🎯 [Generate] Creating new daily challenge...`);
    
    // For debugging, let's always create Daily Five challenge
    const dailyFive = VocabGamification.DAILY_CHALLENGES.daily_5;
    console.log(`🎯 [Generate] Daily Five template:`, dailyFive);
    
    data.dailyChallenge = {
      ...dailyFive,
      id: 'daily-five', // Make sure ID is set correctly
      date: today,
      progress: 0,
      completed: false,
      startedAt: new Date().toISOString()
    };
    
    console.log(`🎯 [Generate] Created daily challenge:`, data.dailyChallenge);
    
    await this.saveGamificationData(data);
    return data.dailyChallenge;
  }
  
  async updateChallengeProgress(type, value) {
    console.log(`🎯 [Update] Called updateChallengeProgress with type: ${type}, value: ${value}`);
    
    const data = await this.getGamificationData();
    console.log(`🎯 [Update] Gamification data exists: ${!!data}`);
    console.log(`🎯 [Update] Daily challenge exists: ${!!data?.dailyChallenge}`);
    
    if (!data || !data.dailyChallenge) {
      console.log(`🎯 [Update] Early return - no data or no daily challenge`);
      return;
    }
    
    const challenge = data.dailyChallenge;
    console.log(`🎯 [Update] Challenge details:`, {
      name: challenge.name,
      id: challenge.id,
      type: challenge.type,
      progress: challenge.progress,
      target: challenge.target,
      completed: challenge.completed,
      date: challenge.date
    });
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`🎯 [Update] Today: ${today}, Challenge date: ${challenge.date}`);
    
    const typeMatches = challenge.type === type;
    const notCompleted = !challenge.completed;
    const dateMatches = challenge.date === today;
    
    console.log(`🎯 [Update] Conditions check:`, {
      typeMatches,
      notCompleted,
      dateMatches,
      allConditionsMet: typeMatches && notCompleted && dateMatches
    });
    
    if (typeMatches && notCompleted && dateMatches) {
      console.log(`🎯 ✅ UPDATING CHALLENGE PROGRESS: ${challenge.name} (${type}) - Current: ${challenge.progress}, Adding: ${value}`);
      
      if (type === 'review_count' || type === 'time_spent') {
        challenge.progress += value;
        console.log(`🎯 Challenge progress incremented to: ${challenge.progress}/${challenge.target}`);
      } else if (type === 'accuracy') {
        challenge.progress = value; // Current accuracy
      } else if (type === 'streak_maintain') {
        challenge.progress = 1; // Maintained
      }
      
      // For review_count challenges, always sync with actual daily stats to ensure accuracy
      if (type === 'review_count' && this.analytics) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const analyticsData = await this.analytics.getAnalyticsData();
          const todayStats = analyticsData.dailyStats[today];
          const actualWordsToday = todayStats?.wordsReviewed || 0;
          
          // Always use the actual count from analytics as source of truth
          challenge.progress = actualWordsToday;
          
          console.log(`🔄 Challenge progress synced with analytics: ${challenge.progress}/${challenge.target} words (actual daily count)`);
        } catch (error) {
          console.warn('Could not sync challenge progress with analytics:', error);
        }
      }
      
      // Check if challenge is completed
      if (challenge.progress >= challenge.target) {
        challenge.completed = true;
        challenge.completedAt = new Date().toISOString();
        
        console.log(`🎉 Challenge completed: ${challenge.name} (${challenge.progress}/${challenge.target})`);
        
        // Award XP
        await this.awardXP(challenge.xp, { challenge: true });
        
        // Show notification
        if (typeof chrome !== 'undefined' && chrome.notifications) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: '/assets/icon48.png',
            title: '🎯 Daily Challenge Complete!',
            message: `${challenge.icon} ${challenge.name} completed! +${challenge.xp} XP`,
            priority: 1
          });
        }
        
        // Add to completed challenges
        data.completedChallenges.push({
          ...challenge,
          type: 'daily'
        });
      }
      
      await this.saveGamificationData(data);
    }
  }
  
  // Statistics and Leaderboard
  async getPlayerStats() {
    const [gamData, analyticsData, dashboardStats] = await Promise.all([
      this.getGamificationData(),
      this.analytics ? this.analytics.getAnalyticsData() : null,
      this.analytics ? this.analytics.getDashboardStats() : null
    ]);
    
    if (!gamData) return null;
    
    console.log('🎮 Gamification Player Stats - Raw Data:', {
      gamData: gamData ? { level: gamData.level, xp: gamData.xp } : null,
      analyticsData: analyticsData ? { 
        totalWordsLearned: analyticsData.totalWordsLearned,
        currentStreak: analyticsData.currentStreak,
        totalXP: analyticsData.totalXP 
      } : null,
      dashboardStats: dashboardStats ? {
        totalWordsLearned: dashboardStats.totalWordsLearned,
        currentStreak: dashboardStats.currentStreak,
        todayAccuracy: dashboardStats.todayAccuracy,
        totalXP: dashboardStats.totalXP
      } : null
    });
    
    // Calculate accuracy from today's stats or overall quality distribution
    let accuracy = 0;
    if (dashboardStats && dashboardStats.todayAccuracy > 0) {
      accuracy = dashboardStats.todayAccuracy / 100;
    } else if (dashboardStats && dashboardStats.qualityDistribution) {
      const totalQualities = Object.values(dashboardStats.qualityDistribution);
      const totalReviews = totalQualities.reduce((sum, count) => sum + count, 0);
      if (totalReviews > 0) {
        const weightedScore = Object.entries(dashboardStats.qualityDistribution)
          .reduce((sum, [quality, count]) => sum + (parseInt(quality) * count), 0);
        accuracy = (weightedScore / (totalReviews * 5));
      }
    }
    
    // Calculate perfect sessions from analytics data
    let perfectSessions = 0;
    if (analyticsData && analyticsData.dailyStats) {
      perfectSessions = Object.values(analyticsData.dailyStats)
        .filter(dayStats => dayStats.accuracy === 100).length;
    }
    
    const playerStats = {
      // Level & XP - from gamification data
      level: gamData.level,
      currentXP: gamData.xp,
      xpToNextLevel: gamData.xpToNextLevel,
      title: gamData.title,
      
      // Core Stats - from dashboard stats (real data)
      totalWords: dashboardStats?.totalWordsLearned || 0,
      currentStreak: dashboardStats?.currentStreak || 0,
      longestStreak: dashboardStats?.longestStreak || analyticsData?.longestStreak || 0,
      totalXP: dashboardStats?.totalXP || analyticsData?.totalXP || 0,
      accuracy: accuracy,
      perfectSessions: perfectSessions,
      
      // Achievement Stats
      achievementCount: gamData.unlockedAchievements.length,
      totalAchievements: Object.keys(VocabGamification.ACHIEVEMENTS).length,
      achievementRate: (gamData.unlockedAchievements.length / Object.keys(VocabGamification.ACHIEVEMENTS).length * 100).toFixed(1),
      
      // Time Stats
      totalTime: dashboardStats?.totalTime || analyticsData?.totalTimeSpent || 0,
      todayTime: dashboardStats?.todayTime || 0,
      todayAccuracy: dashboardStats?.todayAccuracy || 0,
      
      // Session Stats
      totalSessions: dashboardStats?.totalSessions || analyticsData?.totalReviewSessions || 0,
      
      // Challenge Stats
      dailyChallenge: gamData.dailyChallenge,
      completedChallenges: gamData.completedChallenges.length,
      
      // Additional analytics
      qualityDistribution: dashboardStats?.qualityDistribution || {},
      isDataReal: dashboardStats?.isDataReal || false
    };
    
    console.log('🎮 Final Player Stats:', playerStats);
    
    return playerStats;
  }
  
  getAchievementsByRarity(unlockedIds) {
    const rarity = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    
    unlockedIds.forEach(id => {
      const achievement = VocabGamification.ACHIEVEMENTS[id];
      if (achievement) {
        rarity[achievement.rarity]++;
      }
    });
    
    return rarity;
  }
  
  // Get all achievements with unlock status
  async getAchievements() {
    const data = await this.getGamificationData();
    if (!data) return [];
    
    const achievements = [];
    const unlockedIds = data.unlockedAchievements || [];
    
    for (const [id, achievement] of Object.entries(VocabGamification.ACHIEVEMENTS)) {
      const isUnlocked = unlockedIds.includes(id);
      achievements.push({
        ...achievement,
        unlockedAt: isUnlocked ? data.achievementProgress?.[id]?.unlockedAt : null,
        isUnlocked
      });
    }
    
    return achievements.sort((a, b) => {
      if (a.isUnlocked && !b.isUnlocked) return -1;
      if (!a.isUnlocked && b.isUnlocked) return 1;
      return 0;
    });
  }
  
  // Get current daily challenge
  async getCurrentChallenge() {
    const data = await this.getGamificationData();
    if (!data) return null;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we need a new daily challenge
    if (!data.dailyChallenge || data.dailyChallenge.date !== today) {
      console.log(`🎯 Generating new daily challenge for ${today}`);
      await this.generateDailyChallenge();
      return await this.getCurrentChallenge();
    }
    
    console.log(`🎯 Getting current challenge: ${data.dailyChallenge.name} (${data.dailyChallenge.progress}/${data.dailyChallenge.target})`);
    
    // Always sync challenge progress with real analytics data before returning
    await this.syncChallengeWithAnalytics(data.dailyChallenge);
    
    // Return fresh data after sync
    const syncedData = await this.getGamificationData();
    return syncedData.dailyChallenge;
  }
  
  // Sync challenge progress with current analytics data
  async syncChallengeWithAnalytics(challenge) {
    if (!challenge || challenge.completed || !this.analytics) {
      console.log(`🔄 [Sync] Skipping challenge sync - Challenge: ${!!challenge}, Completed: ${challenge?.completed}, Analytics: ${!!this.analytics}`);
      return;
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const analyticsData = await this.analytics.getAnalyticsData();
      const todayStats = analyticsData.dailyStats[today] || { wordsReviewed: 0, timeSpent: 0, accuracy: 0 };
      
      console.log(`🔄 [Sync] Challenge details:`, challenge);
      console.log(`🔄 [Sync] Syncing challenge with analytics - Today: ${today}, Challenge ID: ${challenge.id}, Challenge type: ${challenge.type}, Current progress: ${challenge.progress}`);
      console.log(`🔄 [Sync] Analytics data for today:`, todayStats);
      
      let needsUpdate = false;
      
      // Handle Daily Five challenge specifically
      if (challenge.id === 'daily-five' || challenge.type === 'review_count') {
        const actualWordsToday = todayStats.wordsReviewed || 0;
        console.log(`📊 [Sync] Daily Five/Review Count - Actual words: ${actualWordsToday}, Challenge progress: ${challenge.progress}`);
        
        if (challenge.progress !== actualWordsToday) {
          console.log(`📊 [Sync] Updating challenge progress: ${challenge.progress} → ${actualWordsToday} words`);
          challenge.progress = actualWordsToday;
          needsUpdate = true;
        }
      } else if (challenge.type === 'time_spent') {
        const actualTimeToday = Math.floor((todayStats.timeSpent || 0) / 60000); // Convert to minutes
        if (challenge.progress !== actualTimeToday) {
          console.log(`⏱️ [Sync] Updating challenge progress: ${challenge.progress} → ${actualTimeToday} minutes`);
          challenge.progress = actualTimeToday;
          needsUpdate = true;
        }
      } else if (challenge.type === 'accuracy') {
        const actualAccuracy = Math.round(todayStats.accuracy || 0);
        if (Math.abs(challenge.progress - actualAccuracy) > 0.1) {
          console.log(`🎯 [Sync] Updating challenge progress: ${challenge.progress} → ${actualAccuracy}% accuracy`);
          challenge.progress = actualAccuracy;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        const gamificationData = await this.getGamificationData();
        await this.saveGamificationData(gamificationData);
        console.log(`✅ [Sync] Challenge progress synced and saved: ${challenge.progress}/${challenge.target}`);
        
        // Check for completion after sync
        if (challenge.progress >= challenge.target && !challenge.completed) {
          console.log(`🎉 [Sync] Challenge completed after sync!`);
          challenge.completed = true;
          challenge.completedAt = new Date().toISOString();
          await this.saveGamificationData(gamificationData);
        }
      } else {
        console.log(`✅ [Sync] Challenge already in sync: ${challenge.progress}/${challenge.target}`);
      }
    } catch (error) {
      console.error('❌ [Sync] Error syncing challenge with analytics:', error);
    }
  }

  // Handle word review hook (called from analytics)
  async handleWordReview(wordId, quality, isCorrect, timeSpent = 0) {
    try {
      // Update daily challenge for review count
      await this.updateChallengeProgress('review_count', 1);

      // Update time spent challenge (convert ms to minutes aggregate at end)
      if (timeSpent > 0) {
        const minutes = Math.max(1, Math.round(timeSpent / 60000));
        await this.updateChallengeProgress('time_spent', minutes);
      }

      // Accuracy challenge: recompute from analytics
      if (this.analytics) {
        const today = new Date().toISOString().split('T')[0];
        const data = await this.analytics.getAnalyticsData();
        const todayStats = data.dailyStats?.[today];
        if (todayStats) {
          await this.updateChallengeProgress('accuracy', Math.round(todayStats.accuracy || 0));
        }
      }
    } catch (e) {
      console.warn('Gamification handleWordReview error:', e);
    }
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.VocabGamification = VocabGamification;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VocabGamification;
}
