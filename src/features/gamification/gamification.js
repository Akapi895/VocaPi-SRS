class VocabGamification {
    constructor() {
        this.initialized = false;
        this.data = {
            level: 1,
            xp: 0,
            unlockedAchievements: [],
            currentTitle: "Beginner",
            dailyChallenge: null,
            stats: {
                totalWords: 0,
                totalReviews: 0,
                correctReviews: 0,
                streakDays: 0,
                qualitySum: 0,
                bestDayReviews: 0
            }
        };
        this.analytics = null;
    }

    /**
     * Achievement definitions
     */
    static get ACHIEVEMENTS() {
        return {
            'start-learning': {
                id: 'start-learning',
                name: 'Start Learning!',
                description: 'Complete your first word review',
                icon: '🎯',
                xpReward: 10,
                condition: (stats) => stats.totalReviews >= 1
            },
            'first-correct': {
                id: 'first-correct',
                name: 'First Success',
                description: 'Get your first answer correct',
                icon: '✅',
                xpReward: 15,
                condition: (stats) => stats.correctReviews >= 1
            },
            'five-words': {
                id: 'five-words',
                name: 'Word Explorer',
                description: 'Learn 5 different words',
                icon: '📚',
                xpReward: 25,
                condition: (stats) => stats.totalWords >= 5
            },
            'ten-words': {
                id: 'ten-words',
                name: 'Vocabulary Builder',
                description: 'Learn 10 different words',
                icon: '🏗️',
                xpReward: 50,
                condition: (stats) => stats.totalWords >= 10
            },
            'streak-3': {
                id: 'streak-3',
                name: 'Consistent Learner',
                description: 'Maintain a 3-day learning streak',
                icon: '🔥',
                xpReward: 30,
                condition: (stats) => stats.streakDays >= 3
            },
            'streak-7': {
                id: 'streak-7',
                name: 'Week Warrior',
                description: 'Maintain a 7-day learning streak',
                icon: '⚡',
                xpReward: 75,
                condition: (stats) => stats.streakDays >= 7
            },
            'quality-focus': {
                id: 'quality-focus',
                name: 'Quality Focus',
                description: 'Achieve average quality of 4.0 over 10 reviews',
                icon: '🌟',
                xpReward: 40,
                condition: (stats) => stats.totalReviews >= 10 && (stats.qualitySum / stats.totalReviews) >= 4.0
            },
            'accuracy-master': {
                id: 'accuracy-master',
                name: 'Accuracy Master',
                description: 'Achieve 90% accuracy over 20 reviews',
                icon: '🎯',
                xpReward: 60,
                condition: (stats) => stats.totalReviews >= 20 && (stats.correctReviews / stats.totalReviews) >= 0.9
            },
            'daily-champion': {
                id: 'daily-champion',
                name: 'Daily Champion',
                description: 'Complete 20 reviews in a single day',
                icon: '🏆',
                xpReward: 80,
                condition: (stats) => stats.bestDayReviews >= 20
            }
        };
    }

    /**
     * Daily challenge types
     */
    static get DAILY_CHALLENGES() {
        return [
            {
                type: 'review-count',
                name: 'Daily Reviewer',
                description: 'Complete 10 word reviews',
                icon: '📝',
                target: 10,
                xpReward: 20
            },
            {
                type: 'accuracy',
                name: 'Precision Master',
                description: 'Achieve 80% accuracy in 5 reviews',
                icon: '🎯',
                target: 5,
                minAccuracy: 0.8,
                xpReward: 25
            },
            {
                type: 'quality',
                name: 'Quality Learner',
                description: 'Average quality 4+ in 8 reviews',
                icon: '⭐',
                target: 8,
                minQuality: 4.0,
                xpReward: 30
            },
            {
                type: 'speed',
                name: 'Quick Thinker',
                description: 'Complete 5 reviews under 3 seconds each',
                icon: '⚡',
                target: 5,
                maxTime: 3000,
                xpReward: 35
            }
        ];
    }

    /**
     * Initialize gamification system
     */
    async initializeGamification() {
        if (this.initialized) return;

        try {
            // Try to get data from storage if available
            if (window.GamificationStorage) {
                const result = await window.GamificationStorage.getData();
                if (result) {
                    this.data = { ...this.data, ...result };
                }
            }

            await this.ensureDailyChallenge();
            this.initialized = true;
        } catch (error) {
            console.error("❌ Gamification initialization error:", error);
            this.initialized = true; // Mark as initialized to prevent infinite retries
        }
    }

    /**
     * Handle word review for gamification
     */
    async handleWordReview(wordId, isCorrect, quality, timeSpent) {
        await this.initializeGamification();
        
        // Update stats
        this.data.stats.totalReviews++;
        if (isCorrect) this.data.stats.correctReviews++;
        this.data.stats.qualitySum += quality;
        
        // Update word count from analytics
        if (this.analytics) {
            const analyticsData = await this.analytics.getAnalyticsData();
            this.data.stats.totalWords = analyticsData?.totalWords || this.data.stats.totalWords;
        }
        
        // Award XP based on quality
        const xpGained = this.calculateReviewXP(quality, isCorrect, timeSpent);
        this.addXP(xpGained);
        
        // Update daily challenge progress
        await this.updateDailyChallengeProgress(isCorrect, quality, timeSpent);
        
        // Check for new achievements
        await this.checkAchievements();
        
        // Save changes if storage is available
        if (window.GamificationStorage) {
            await window.GamificationStorage.saveData(this.data);
        }
        
        console.log('🎮 Gamification updated:', { 
            xpGained, 
            level: this.data.level, 
            totalXP: this.data.xp,
            totalWords: this.data.stats.totalWords
        });
    }

    /**
     * Calculate XP for a review
     */
    calculateReviewXP(quality, isCorrect, timeSpent) {
        let baseXP = 5; // Base XP for any review
        
        if (isCorrect) {
            baseXP += 5; // Bonus for correct answer
        }
        
        // Quality bonus (1-5 scale)
        const qualityBonus = Math.max(0, (quality - 2) * 2);
        
        // Speed bonus (if answered quickly)
        const speedBonus = timeSpent < 2000 ? 3 : 0;
        
        const totalXP = baseXP + qualityBonus + speedBonus;
        
        console.log('🎮 XP calculation:', {
            baseXP,
            correctBonus: isCorrect ? 5 : 0,
            qualityBonus,
            speedBonus,
            totalXP,
            quality,
            timeSpent
        });
        
        return totalXP;
    }

    /**
     * Add XP and handle level ups
     */
    addXP(amount) {
        this.data.xp += amount;
        
        // Check for level up
        const newLevel = this.calculateLevel(this.data.xp);
        if (newLevel > this.data.level) {
            this.data.level = newLevel;
            this.data.currentTitle = this.getTitleForLevel(newLevel);
            console.log(`🎉 Level up! Now level ${newLevel}: ${this.data.currentTitle}`);
        }
    }

    /**
     * Calculate level from XP
     */
    calculateLevel(xp) {
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }

    /**
     * Get title for level
     */
    getTitleForLevel(level) {
        const titles = [
            'Beginner', 'Student', 'Learner', 'Scholar', 'Expert',
            'Master', 'Sage', 'Guru', 'Legend', 'Grandmaster'
        ];
        return titles[Math.min(level - 1, titles.length - 1)] || 'Grandmaster';
    }

    /**
     * Check for achieved unlocked achievements
     */
    async checkAchievements() {
        // Get current stats from analytics if available
        let analyticsData = null;
        if (this.analytics) {
            analyticsData = await this.analytics.getAnalyticsData();
        }
        
        // Combine stats
        const combinedStats = {
            totalWords: analyticsData?.totalWords || this.data.stats.totalWords,
            totalReviews: this.data.stats.totalReviews,
            correctReviews: this.data.stats.correctReviews,
            streakDays: analyticsData?.currentStreak || 0,
            qualitySum: this.data.stats.qualitySum,
            bestDayReviews: this.data.stats.bestDayReviews
        };
        
        const achievements = VocabGamification.ACHIEVEMENTS;
        const newAchievements = [];
        
        Object.values(achievements).forEach(achievement => {
            if (!this.data.unlockedAchievements.includes(achievement.id)) {
                if (achievement.condition(combinedStats)) {
                    this.data.unlockedAchievements.push(achievement.id);
                    this.addXP(achievement.xpReward);
                    newAchievements.push(achievement);
                    console.log(`🏆 Achievement unlocked: ${achievement.name} (+${achievement.xpReward} XP)`);
                }
            }
        });
        
        return newAchievements;
    }

    /**
     * Ensure daily challenge exists and is current
     */
    async ensureDailyChallenge() {
        const today = new Date().toDateString();
        
        if (!this.data.dailyChallenge || this.data.dailyChallenge.date !== today) {
            // Generate new daily challenge
            const challenges = VocabGamification.DAILY_CHALLENGES;
            const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
            
            this.data.dailyChallenge = {
                ...randomChallenge,
                date: today,
                progress: 0,
                completed: false,
                qualitySum: 0,
                accuracySum: 0
            };
            
            console.log('📅 New daily challenge:', this.data.dailyChallenge.name);
        }
    }

    /**
     * Update daily challenge progress
     */
    async updateDailyChallengeProgress(isCorrect, quality, timeSpent) {
        const challenge = this.data.dailyChallenge;
        if (!challenge || challenge.completed) return;

        // Update progress based on challenge type
        if (challenge.type === 'review-count') {
            challenge.progress++;
        } else if (challenge.type === 'accuracy') {
            challenge.progress++;
            challenge.accuracySum += isCorrect ? 1 : 0;
        } else if (challenge.type === 'quality') {
            challenge.progress++;
            challenge.qualitySum += quality;
        } else if (challenge.type === 'speed' && timeSpent <= challenge.maxTime) {
            challenge.progress++;
        }

        // Check completion
        const rules = {
            'review-count': () => true,
            'accuracy': () => (challenge.accuracySum / challenge.progress) >= challenge.minAccuracy,
            'quality': () => (challenge.qualitySum / challenge.progress) >= challenge.minQuality,
            'speed': () => true
        };

        if (challenge.progress >= challenge.target && rules[challenge.type]()) {
            challenge.completed = true;
            this.addXP(challenge.xpReward);
            console.log(`🎯 Daily challenge completed: ${challenge.name} (+${challenge.xpReward} XP)`);
        }
    }

    /**
     * Get current daily challenge
     */
    async getCurrentChallenge() {
        await this.initializeGamification();
        return this.data.dailyChallenge;
    }

    /**
     * Get player stats
     */
    async getPlayerStats() {
        await this.initializeGamification();
        
        const xpForNextLevel = Math.pow(this.data.level, 2) * 100;
        const xpForCurrentLevel = Math.pow(this.data.level - 1, 2) * 100;
        const xpProgress = this.data.xp - xpForCurrentLevel;
        const xpNeeded = xpForNextLevel - xpForCurrentLevel;
        
        return {
            level: this.data.level,
            currentXP: this.data.xp,
            xpProgress,
            xpNeeded,
            xpForNextLevel,
            title: this.data.currentTitle,
            achievementCount: this.data.unlockedAchievements.length,
            totalWords: this.data.stats.totalWords,
            totalReviews: this.data.stats.totalReviews,
            accuracy: this.data.stats.totalReviews > 0 
                ? Math.round((this.data.stats.correctReviews / this.data.stats.totalReviews) * 100)
                : 0
        };
    }

    /**
     * Get gamification data
     */
    async getGamificationData() {
        await this.initializeGamification();
        return { ...this.data };
    }

    /**
     * Get unlocked achievements with details
     */
    async getUnlockedAchievements() {
        await this.initializeGamification();
        
        const achievements = VocabGamification.ACHIEVEMENTS;
        return this.data.unlockedAchievements.map(id => achievements[id]).filter(Boolean);
    }

    /**
     * Update word count from analytics
     */
    async updateWordCount(totalWords) {
        this.data.stats.totalWords = totalWords;
        if (window.GamificationStorage) {
            await window.GamificationStorage.saveData(this.data);
        }
    }
}

// Export for use in extension
if (typeof window !== 'undefined') {
  // Expose class
  window.VocabGamification = VocabGamification;
  
  // Create and expose instance
  window.vocabGamification = new VocabGamification();
  
  console.log('🎮 VocabGamification exposed on window object:', {
    class: !!window.VocabGamification,
    instance: !!window.vocabGamification
  });
}
