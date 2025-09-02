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
            // 🟢 BEGINNER LEVEL (Easy - 10-50 XP)
            'start-learning': {
                id: 'start-learning',
                name: 'Start Learning!',
                description: 'Complete your first word review',
                icon: '🎯',
                xpReward: 10,
                rarity: 'common',
                condition: (stats) => stats.totalReviews >= 1
            },
            'first-correct': {
                id: 'first-correct',
                name: 'First Success',
                description: 'Get your first answer correct',
                icon: '✅',
                xpReward: 15,
                rarity: 'common',
                condition: (stats) => stats.correctReviews >= 1
            },
            'three-words': {
                id: 'three-words',
                name: 'Getting Started',
                description: 'Learn 3 different words',
                icon: '🌱',
                xpReward: 20,
                rarity: 'common',
                condition: (stats) => stats.totalWords >= 3
            },
            'five-words': {
                id: 'five-words',
                name: 'Word Explorer',
                description: 'Learn 5 different words',
                icon: '📚',
                xpReward: 25,
                rarity: 'common',
                condition: (stats) => stats.totalWords >= 5
            },
            'ten-words': {
                id: 'ten-words',
                name: 'Vocabulary Builder',
                description: 'Learn 10 different words',
                icon: '🏗️',
                xpReward: 35,
                rarity: 'common',
                condition: (stats) => stats.totalWords >= 10
            },
            'first-streak': {
                id: 'first-streak',
                name: 'Daily Learner',
                description: 'Maintain a 2-day learning streak',
                icon: '📅',
                xpReward: 30,
                rarity: 'common',
                condition: (stats) => stats.streakDays >= 2
            },
            'streak-3': {
                id: 'streak-3',
                name: 'Consistent Learner',
                description: 'Maintain a 3-day learning streak',
                icon: '🔥',
                xpReward: 40,
                rarity: 'common',
                condition: (stats) => stats.streakDays >= 3
            },
            'fifty-reviews': {
                id: 'fifty-reviews',
                name: 'Review Rookie',
                description: 'Complete 50 total reviews',
                icon: '📝',
                xpReward: 45,
                rarity: 'common',
                condition: (stats) => stats.totalReviews >= 50
            },

            // 🟡 INTERMEDIATE LEVEL (Medium - 50-100 XP)
            'twenty-words': {
                id: 'twenty-words',
                name: 'Word Collector',
                description: 'Learn 20 different words',
                icon: '📖',
                xpReward: 60,
                rarity: 'uncommon',
                condition: (stats) => stats.totalWords >= 20
            },
            'fifty-words': {
                id: 'fifty-words',
                name: 'Vocabulary Enthusiast',
                description: 'Learn 50 different words',
                icon: '📚',
                xpReward: 80,
                rarity: 'uncommon',
                condition: (stats) => stats.totalWords >= 50
            },
            'streak-7': {
                id: 'streak-7',
                name: 'Week Warrior',
                description: 'Maintain a 7-day learning streak',
                icon: '⚡',
                xpReward: 75,
                rarity: 'uncommon',
                condition: (stats) => stats.streakDays >= 7
            },
            'streak-14': {
                id: 'streak-14',
                name: 'Fortnight Fighter',
                description: 'Maintain a 14-day learning streak',
                icon: '🔥',
                xpReward: 100,
                rarity: 'uncommon',
                condition: (stats) => stats.streakDays >= 14
            },
            'hundred-reviews': {
                id: 'hundred-reviews',
                name: 'Review Regular',
                description: 'Complete 100 total reviews',
                icon: '📊',
                xpReward: 70,
                rarity: 'uncommon',
                condition: (stats) => stats.totalReviews >= 100
            },
            'two-hundred-reviews': {
                id: 'two-hundred-reviews',
                name: 'Review Veteran',
                description: 'Complete 200 total reviews',
                icon: '📈',
                xpReward: 90,
                rarity: 'uncommon',
                condition: (stats) => stats.totalReviews >= 200
            },
            'quality-focus': {
                id: 'quality-focus',
                name: 'Quality Focus',
                description: 'Achieve average quality of 4.0 over 20 reviews',
                icon: '🌟',
                xpReward: 65,
                rarity: 'uncommon',
                condition: (stats) => stats.totalReviews >= 20 && (stats.qualitySum / stats.totalReviews) >= 4.0
            },
            'accuracy-80': {
                id: 'accuracy-80',
                name: 'Accurate Learner',
                description: 'Achieve 80% accuracy over 30 reviews',
                icon: '🎯',
                xpReward: 55,
                rarity: 'uncommon',
                condition: (stats) => stats.totalReviews >= 30 && (stats.correctReviews / stats.totalReviews) >= 0.8
            },
            'daily-champion': {
                id: 'daily-champion',
                name: 'Daily Champion',
                description: 'Complete 20 reviews in a single day',
                icon: '🏆',
                xpReward: 85,
                rarity: 'uncommon',
                condition: (stats) => stats.bestDayReviews >= 20
            },
            'speed-demon': {
                id: 'speed-demon',
                name: 'Speed Demon',
                description: 'Complete 30 reviews in a single day',
                icon: '⚡',
                xpReward: 95,
                rarity: 'uncommon',
                condition: (stats) => stats.bestDayReviews >= 30
            },

            // 🟠 ADVANCED LEVEL (Hard - 100-200 XP)
            'hundred-words': {
                id: 'hundred-words',
                name: 'Century Scholar',
                description: 'Learn 100 different words',
                icon: '🎓',
                xpReward: 120,
                rarity: 'rare',
                condition: (stats) => stats.totalWords >= 100
            },
            'two-hundred-words': {
                id: 'two-hundred-words',
                name: 'Vocabulary Master',
                description: 'Learn 200 different words',
                icon: '👑',
                xpReward: 150,
                rarity: 'rare',
                condition: (stats) => stats.totalWords >= 200
            },
            'streak-30': {
                id: 'streak-30',
                name: 'Monthly Master',
                description: 'Maintain a 30-day learning streak',
                icon: '🗓️',
                xpReward: 180,
                rarity: 'rare',
                condition: (stats) => stats.streakDays >= 30
            },
            'streak-60': {
                id: 'streak-60',
                name: 'Two Month Titan',
                description: 'Maintain a 60-day learning streak',
                icon: '💪',
                xpReward: 250,
                rarity: 'rare',
                condition: (stats) => stats.streakDays >= 60
            },
            'five-hundred-reviews': {
                id: 'five-hundred-reviews',
                name: 'Review Expert',
                description: 'Complete 500 total reviews',
                icon: '📚',
                xpReward: 140,
                rarity: 'rare',
                condition: (stats) => stats.totalReviews >= 500
            },
            'thousand-reviews': {
                id: 'thousand-reviews',
                name: 'Review Legend',
                description: 'Complete 1000 total reviews',
                icon: '🏛️',
                xpReward: 200,
                rarity: 'rare',
                condition: (stats) => stats.totalReviews >= 1000
            },
            'accuracy-master': {
                id: 'accuracy-master',
                name: 'Accuracy Master',
                description: 'Achieve 90% accuracy over 100 reviews',
                icon: '🎯',
                xpReward: 160,
                rarity: 'rare',
                condition: (stats) => stats.totalReviews >= 100 && (stats.correctReviews / stats.totalReviews) >= 0.9
            },
            'quality-perfectionist': {
                id: 'quality-perfectionist',
                name: 'Quality Perfectionist',
                description: 'Achieve average quality of 4.5 over 50 reviews',
                icon: '✨',
                xpReward: 170,
                rarity: 'rare',
                condition: (stats) => stats.totalReviews >= 50 && (stats.qualitySum / stats.totalReviews) >= 4.5
            },
            'daily-marathon': {
                id: 'daily-marathon',
                name: 'Daily Marathon',
                description: 'Complete 50 reviews in a single day',
                icon: '🏃',
                xpReward: 190,
                rarity: 'rare',
                condition: (stats) => stats.bestDayReviews >= 50
            },
            'weekend-warrior': {
                id: 'weekend-warrior',
                name: 'Weekend Warrior',
                description: 'Complete 100 reviews in a single day',
                icon: '⚔️',
                xpReward: 220,
                rarity: 'rare',
                condition: (stats) => stats.bestDayReviews >= 100
            },

            // 🔴 EXPERT LEVEL (Very Hard - 200-500 XP)
            'five-hundred-words': {
                id: 'five-hundred-words',
                name: 'Vocabulary Sage',
                description: 'Learn 500 different words',
                icon: '🧙',
                xpReward: 300,
                rarity: 'epic',
                condition: (stats) => stats.totalWords >= 500
            },
            'thousand-words': {
                id: 'thousand-words',
                name: 'Word Wizard',
                description: 'Learn 1000 different words',
                icon: '🪄',
                xpReward: 400,
                rarity: 'epic',
                condition: (stats) => stats.totalWords >= 1000
            },
            'streak-100': {
                id: 'streak-100',
                name: 'Century Streak',
                description: 'Maintain a 100-day learning streak',
                icon: '💯',
                xpReward: 350,
                rarity: 'epic',
                condition: (stats) => stats.streakDays >= 100
            },
            'streak-365': {
                id: 'streak-365',
                name: 'Year Long Legend',
                description: 'Maintain a 365-day learning streak',
                icon: '🗓️',
                xpReward: 500,
                rarity: 'epic',
                condition: (stats) => stats.streakDays >= 365
            },
            'five-thousand-reviews': {
                id: 'five-thousand-reviews',
                name: 'Review Grandmaster',
                description: 'Complete 5000 total reviews',
                icon: '🏆',
                xpReward: 450,
                rarity: 'epic',
                condition: (stats) => stats.totalReviews >= 5000
            },
            'ten-thousand-reviews': {
                id: 'ten-thousand-reviews',
                name: 'Review Transcendent',
                description: 'Complete 10000 total reviews',
                icon: '🌟',
                xpReward: 600,
                rarity: 'epic',
                condition: (stats) => stats.totalReviews >= 10000
            },
            'accuracy-god': {
                id: 'accuracy-god',
                name: 'Accuracy God',
                description: 'Achieve 95% accuracy over 500 reviews',
                icon: '👑',
                xpReward: 380,
                rarity: 'epic',
                condition: (stats) => stats.totalReviews >= 500 && (stats.correctReviews / stats.totalReviews) >= 0.95
            },
            'quality-god': {
                id: 'quality-god',
                name: 'Quality God',
                description: 'Achieve average quality of 4.8 over 200 reviews',
                icon: '✨',
                xpReward: 420,
                rarity: 'epic',
                condition: (stats) => stats.totalReviews >= 200 && (stats.qualitySum / stats.totalReviews) >= 4.8
            },
            'daily-god': {
                id: 'daily-god',
                name: 'Daily God',
                description: 'Complete 200 reviews in a single day',
                icon: '⚡',
                xpReward: 480,
                rarity: 'epic',
                condition: (stats) => stats.bestDayReviews >= 200
            },

            // 🟣 LEGENDARY LEVEL (Extreme - 500+ XP)
            'two-thousand-words': {
                id: 'two-thousand-words',
                name: 'Vocabulary Deity',
                description: 'Learn 2000 different words',
                icon: '🏛️',
                xpReward: 700,
                rarity: 'legendary',
                condition: (stats) => stats.totalWords >= 2000
            },
            'five-thousand-words': {
                id: 'five-thousand-words',
                name: 'Word Emperor',
                description: 'Learn 5000 different words',
                icon: '👑',
                xpReward: 1000,
                rarity: 'legendary',
                condition: (stats) => stats.totalWords >= 5000
            },
            'streak-1000': {
                id: 'streak-1000',
                name: 'Millennium Streak',
                description: 'Maintain a 1000-day learning streak',
                icon: '🔥',
                xpReward: 1200,
                rarity: 'legendary',
                condition: (stats) => stats.streakDays >= 1000
            },
            'twenty-thousand-reviews': {
                id: 'twenty-thousand-reviews',
                name: 'Review Immortal',
                description: 'Complete 20000 total reviews',
                icon: '🌟',
                xpReward: 1500,
                rarity: 'legendary',
                condition: (stats) => stats.totalReviews >= 20000
            },
            'perfect-accuracy': {
                id: 'perfect-accuracy',
                name: 'Perfect Accuracy',
                description: 'Achieve 100% accuracy over 1000 reviews',
                icon: '💎',
                xpReward: 2000,
                rarity: 'legendary',
                condition: (stats) => stats.totalReviews >= 1000 && (stats.correctReviews / stats.totalReviews) >= 1.0
            },
            'perfect-quality': {
                id: 'perfect-quality',
                name: 'Perfect Quality',
                description: 'Achieve average quality of 5.0 over 500 reviews',
                icon: '✨',
                xpReward: 1800,
                rarity: 'legendary',
                condition: (stats) => stats.totalReviews >= 500 && (stats.qualitySum / stats.totalReviews) >= 5.0
            },
            'daily-legend': {
                id: 'daily-legend',
                name: 'Daily Legend',
                description: 'Complete 500 reviews in a single day',
                icon: '⚡',
                xpReward: 1600,
                rarity: 'legendary',
                condition: (stats) => stats.bestDayReviews >= 500
            },
            'ultimate-master': {
                id: 'ultimate-master',
                name: 'Ultimate Master',
                description: 'Learn 10000 words, maintain 1000-day streak, and complete 50000 reviews',
                icon: '🏆',
                xpReward: 5000,
                rarity: 'legendary',
                condition: (stats) => stats.totalWords >= 10000 && stats.streakDays >= 1000 && stats.totalReviews >= 50000
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
        
        // ✅ SỬA: Chỉ cập nhật totalWords từ analytics, không tính bestDayReviews ở đây
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
        
        // ✅ THÊM: Cập nhật bestDayReviews sau khi xử lý review
        await this.updateBestDayReviews();
        
        // Save changes if storage is available
        if (window.GamificationStorage) {
            await window.GamificationStorage.saveData(this.data);
        }
        
        console.log('🎮 Gamification updated:', { 
            xpGained, 
            level: this.data.level, 
            totalXP: this.data.xp,
            totalWords: this.data.stats.totalWords,
            bestDayReviews: this.data.stats.bestDayReviews
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
        console.log('🏆 checkAchievements called');
        
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
        
        console.log('🏆 Current stats for achievement checking:', combinedStats);
        console.log('🏆 Currently unlocked achievements:', this.data.unlockedAchievements);
        
        const achievements = VocabGamification.ACHIEVEMENTS;
        const newAchievements = [];
        
        Object.values(achievements).forEach(achievement => {
            const isAlreadyUnlocked = this.data.unlockedAchievements.includes(achievement.id);
            const conditionMet = achievement.condition(combinedStats);
            
            console.log(`🏆 Achievement ${achievement.id}:`, {
                name: achievement.name,
                alreadyUnlocked: isAlreadyUnlocked,
                conditionMet: conditionMet,
                condition: achievement.condition.toString()
            });
            
            if (!isAlreadyUnlocked && conditionMet) {
                this.data.unlockedAchievements.push(achievement.id);
                this.addXP(achievement.xpReward);
                newAchievements.push(achievement);
                console.log(`🏆 Achievement unlocked: ${achievement.name} (+${achievement.xpReward} XP)`);
            }
        });
        
        console.log('🏆 New achievements unlocked:', newAchievements.length);
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
     * Update best day reviews from analytics data
     */
    async updateBestDayReviews() {
        console.log('🔍 updateBestDayReviews called, analytics available:', !!this.analytics);
        
        if (!this.analytics) {
            console.warn('⚠️ Analytics not available for best day calculation');
            return;
        }
        
        try {
            const analyticsData = await this.analytics.getAnalyticsData();
            console.log('📊 Analytics data for best day calculation:', {
                hasDailyStats: !!analyticsData?.dailyStats,
                dailyStatsKeys: analyticsData?.dailyStats ? Object.keys(analyticsData.dailyStats) : [],
                totalWords: analyticsData?.totalWords
            });
            
            if (!analyticsData?.dailyStats || Object.keys(analyticsData.dailyStats).length === 0) {
                console.log('📊 No daily stats available for best day calculation');
                return;
            }
            
            const dailyStats = Object.values(analyticsData.dailyStats);
            const reviewsPerDay = dailyStats.map(day => ({
                date: day.date || 'unknown',
                reviewsCount: day.reviewsCount || 0
            }));
            
            console.log('📊 Reviews per day:', reviewsPerDay);
            
            // ✅ SỬA: Tính max reviews trong 1 ngày
            const maxReviewsInDay = Math.max(...dailyStats.map(day => day.reviewsCount || 0));
            const previousBest = this.data.stats.bestDayReviews;
            
            // ✅ SỬA: Chỉ cập nhật nếu có dữ liệu hợp lệ
            if (maxReviewsInDay > 0) {
                this.data.stats.bestDayReviews = Math.max(this.data.stats.bestDayReviews, maxReviewsInDay);
                
                console.log('📊 Best day reviews calculation:', {
                    maxReviewsInDay,
                    previousBest,
                    newBest: this.data.stats.bestDayReviews,
                    dailyStatsCount: dailyStats.length,
                    updated: previousBest !== this.data.stats.bestDayReviews
                });
                
                // ✅ SỬA: Chỉ save nếu có thay đổi
                if (previousBest !== this.data.stats.bestDayReviews && window.GamificationStorage) {
                    await window.GamificationStorage.saveData(this.data);
                    console.log('💾 Best day reviews saved to storage');
                }
            } else {
                console.log('📊 No valid reviews found in daily stats');
            }
            
        } catch (error) {
            console.error('❌ Failed to update best day reviews:', error);
        }
    }

    /**
     * Force refresh best day reviews (useful for debugging)
     */
    async refreshBestDayReviews() {
        console.log('🔄 Force refreshing best day reviews...');
        await this.updateBestDayReviews();
        return this.data.stats.bestDayReviews;
    }

    /**
     * Get current best day reviews with debug info
     */
    async getBestDayReviewsDebug() {
        await this.updateBestDayReviews();
        
        if (this.analytics) {
            const analyticsData = await this.analytics.getAnalyticsData();
            const dailyStats = analyticsData?.dailyStats ? Object.values(analyticsData.dailyStats) : [];
            
            return {
                currentBest: this.data.stats.bestDayReviews,
                dailyStats: dailyStats.map(day => ({
                    date: day.date,
                    reviewsCount: day.reviewsCount || 0
                })),
                maxInDay: dailyStats.length > 0 ? Math.max(...dailyStats.map(day => day.reviewsCount || 0)) : 0,
                totalDays: dailyStats.length
            };
        }
        
        return {
            currentBest: this.data.stats.bestDayReviews,
            error: 'Analytics not available'
        };
    }

    /**
     * Get player stats with updated best day reviews
     */
    async getPlayerStats() {
        await this.initializeGamification();
        
        console.log('🔍 getPlayerStats called, analytics available:', !!this.analytics);
        
        // ✅ THÊM: Luôn cập nhật bestDayReviews trước khi trả về stats
        await this.updateBestDayReviews();
        
        const xpForNextLevel = Math.pow(this.data.level, 2) * 100;
        const xpForCurrentLevel = Math.pow(this.data.level - 1, 2) * 100;
        const xpProgress = this.data.xp - xpForCurrentLevel;
        const xpNeeded = xpForNextLevel - xpForCurrentLevel;
        
        const stats = {
            level: this.data.level,
            currentXP: this.data.xp,
            xpProgress,
            xpNeeded,
            xpForNextLevel,
            title: this.data.currentTitle,
            achievementCount: this.data.unlockedAchievements.length,
            totalWords: this.data.stats.totalWords,
            totalReviews: this.data.stats.totalReviews,
            bestDayReviews: this.data.stats.bestDayReviews,
            accuracy: this.data.stats.totalReviews > 0 
                ? Math.round((this.data.stats.correctReviews / this.data.stats.totalReviews) * 100)
                : 0
        };
        
        console.log('📊 Player stats returned:', {
            bestDayReviews: stats.bestDayReviews,
            totalWords: stats.totalWords,
            totalReviews: stats.totalReviews,
            analyticsConnected: !!this.analytics
        });
        
        return stats;
    }

    /**
     * Get gamification data
     */
    async getGamificationData() {
        await this.initializeGamification();
        return { ...this.data };
    }

    /**
     * Get all achievements (unlocked and locked)
     */
    async getAllAchievements() {
        await this.initializeGamification();
        
        console.log('🏆 getAllAchievements called');
        console.log('🔍 Current unlocked achievements:', this.data.unlockedAchievements);
        
        // ✅ THÊM: Check for new achievements before returning
        await this.checkAchievements();
        
        const achievements = VocabGamification.ACHIEVEMENTS;
        const unlockedIds = this.data.unlockedAchievements;
        
        // Get current stats for condition checking
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
        
        console.log('🏆 Getting all achievements with stats:', combinedStats);
        
        const allAchievements = Object.values(achievements).map(achievement => {
            const isUnlocked = unlockedIds.includes(achievement.id);
            const canUnlock = !isUnlocked && achievement.condition(combinedStats);
            const progress = this.calculateAchievementProgress(achievement, combinedStats);
            
            console.log(`🔍 Achievement ${achievement.id}:`, {
                name: achievement.name,
                unlocked: isUnlocked,
                canUnlock: canUnlock,
                progress: progress,
                condition: achievement.condition(combinedStats)
            });
            
            return {
                ...achievement,
                unlocked: isUnlocked,
                canUnlock: canUnlock,
                progress: progress
            };
        });
        
        console.log('🏆 Returning all achievements:', allAchievements.length);
        return allAchievements;
    }

    /**
     * Calculate achievement progress (0-100%)
     */
    calculateAchievementProgress(achievement, stats) {
        let progress = 0;
        
        switch (achievement.id) {
            // 🟢 BEGINNER LEVEL
            case 'start-learning':
                progress = Math.min(100, (stats.totalReviews / 1) * 100);
                break;
            case 'first-correct':
                progress = Math.min(100, (stats.correctReviews / 1) * 100);
                break;
            case 'three-words':
                progress = Math.min(100, (stats.totalWords / 3) * 100);
                break;
            case 'five-words':
                progress = Math.min(100, (stats.totalWords / 5) * 100);
                break;
            case 'ten-words':
                progress = Math.min(100, (stats.totalWords / 10) * 100);
                break;
            case 'first-streak':
                progress = Math.min(100, (stats.streakDays / 2) * 100);
                break;
            case 'streak-3':
                progress = Math.min(100, (stats.streakDays / 3) * 100);
                break;
            case 'fifty-reviews':
                progress = Math.min(100, (stats.totalReviews / 50) * 100);
                break;

            // 🟡 INTERMEDIATE LEVEL
            case 'twenty-words':
                progress = Math.min(100, (stats.totalWords / 20) * 100);
                break;
            case 'fifty-words':
                progress = Math.min(100, (stats.totalWords / 50) * 100);
                break;
            case 'streak-7':
                progress = Math.min(100, (stats.streakDays / 7) * 100);
                break;
            case 'streak-14':
                progress = Math.min(100, (stats.streakDays / 14) * 100);
                break;
            case 'hundred-reviews':
                progress = Math.min(100, (stats.totalReviews / 100) * 100);
                break;
            case 'two-hundred-reviews':
                progress = Math.min(100, (stats.totalReviews / 200) * 100);
                break;
            case 'quality-focus':
                const avgQuality = stats.totalReviews > 0 ? stats.qualitySum / stats.totalReviews : 0;
                progress = Math.min(100, (avgQuality / 4.0) * 100);
                break;
            case 'accuracy-80':
                const accuracy80 = stats.totalReviews > 0 ? stats.correctReviews / stats.totalReviews : 0;
                progress = Math.min(100, (accuracy80 / 0.8) * 100);
                break;
            case 'daily-champion':
                progress = Math.min(100, (stats.bestDayReviews / 20) * 100);
                break;
            case 'speed-demon':
                progress = Math.min(100, (stats.bestDayReviews / 30) * 100);
                break;

            // 🟠 ADVANCED LEVEL
            case 'hundred-words':
                progress = Math.min(100, (stats.totalWords / 100) * 100);
                break;
            case 'two-hundred-words':
                progress = Math.min(100, (stats.totalWords / 200) * 100);
                break;
            case 'streak-30':
                progress = Math.min(100, (stats.streakDays / 30) * 100);
                break;
            case 'streak-60':
                progress = Math.min(100, (stats.streakDays / 60) * 100);
                break;
            case 'five-hundred-reviews':
                progress = Math.min(100, (stats.totalReviews / 500) * 100);
                break;
            case 'thousand-reviews':
                progress = Math.min(100, (stats.totalReviews / 1000) * 100);
                break;
            case 'accuracy-master':
                const accuracy90 = stats.totalReviews > 0 ? stats.correctReviews / stats.totalReviews : 0;
                progress = Math.min(100, (accuracy90 / 0.9) * 100);
                break;
            case 'quality-perfectionist':
                const avgQuality45 = stats.totalReviews > 0 ? stats.qualitySum / stats.totalReviews : 0;
                progress = Math.min(100, (avgQuality45 / 4.5) * 100);
                break;
            case 'daily-marathon':
                progress = Math.min(100, (stats.bestDayReviews / 50) * 100);
                break;
            case 'weekend-warrior':
                progress = Math.min(100, (stats.bestDayReviews / 100) * 100);
                break;

            // 🔴 EXPERT LEVEL
            case 'five-hundred-words':
                progress = Math.min(100, (stats.totalWords / 500) * 100);
                break;
            case 'thousand-words':
                progress = Math.min(100, (stats.totalWords / 1000) * 100);
                break;
            case 'streak-100':
                progress = Math.min(100, (stats.streakDays / 100) * 100);
                break;
            case 'streak-365':
                progress = Math.min(100, (stats.streakDays / 365) * 100);
                break;
            case 'five-thousand-reviews':
                progress = Math.min(100, (stats.totalReviews / 5000) * 100);
                break;
            case 'ten-thousand-reviews':
                progress = Math.min(100, (stats.totalReviews / 10000) * 100);
                break;
            case 'accuracy-god':
                const accuracy95 = stats.totalReviews > 0 ? stats.correctReviews / stats.totalReviews : 0;
                progress = Math.min(100, (accuracy95 / 0.95) * 100);
                break;
            case 'quality-god':
                const avgQuality48 = stats.totalReviews > 0 ? stats.qualitySum / stats.totalReviews : 0;
                progress = Math.min(100, (avgQuality48 / 4.8) * 100);
                break;
            case 'daily-god':
                progress = Math.min(100, (stats.bestDayReviews / 200) * 100);
                break;

            // 🟣 LEGENDARY LEVEL
            case 'two-thousand-words':
                progress = Math.min(100, (stats.totalWords / 2000) * 100);
                break;
            case 'five-thousand-words':
                progress = Math.min(100, (stats.totalWords / 5000) * 100);
                break;
            case 'streak-1000':
                progress = Math.min(100, (stats.streakDays / 1000) * 100);
                break;
            case 'twenty-thousand-reviews':
                progress = Math.min(100, (stats.totalReviews / 20000) * 100);
                break;
            case 'perfect-accuracy':
                const accuracy100 = stats.totalReviews > 0 ? stats.correctReviews / stats.totalReviews : 0;
                progress = Math.min(100, (accuracy100 / 1.0) * 100);
                break;
            case 'perfect-quality':
                const avgQuality50 = stats.totalReviews > 0 ? stats.qualitySum / stats.totalReviews : 0;
                progress = Math.min(100, (avgQuality50 / 5.0) * 100);
                break;
            case 'daily-legend':
                progress = Math.min(100, (stats.bestDayReviews / 500) * 100);
                break;
            case 'ultimate-master':
                const wordsProgress = Math.min(100, (stats.totalWords / 10000) * 100);
                const streakProgress = Math.min(100, (stats.streakDays / 1000) * 100);
                const reviewsProgress = Math.min(100, (stats.totalReviews / 50000) * 100);
                progress = Math.min(wordsProgress, streakProgress, reviewsProgress);
                break;
            default:
                progress = 0;
        }
        
        console.log(`🔍 Progress for ${achievement.id}:`, {
            progress: progress,
            stats: stats,
            condition: achievement.condition(stats)
        });
        
        return progress;
    }

    /**
     * Get unlocked achievements with details (keep existing method for compatibility)
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

    /**
     * Force connect analytics instance
     */
    setAnalytics(analyticsInstance) {
        this.analytics = analyticsInstance;
        console.log('🔗 Analytics connected to gamification:', !!this.analytics);
    }

    /**
     * Check if analytics is connected
     */
    isAnalyticsConnected() {
        return !!this.analytics;
    }

    /**
     * Force check and unlock achievements (useful for debugging)
     */
    async forceCheckAchievements() {
        console.log('🔄 Force checking achievements...');
        await this.initializeGamification();
        
        const newAchievements = await this.checkAchievements();
        
        // Save changes
        if (window.GamificationStorage) {
            await window.GamificationStorage.saveData(this.data);
        }
        
        console.log('🏆 Force check completed, new achievements:', newAchievements.length);
        return newAchievements;
    }

    /**
     * Get achievement debug info
     */
    async getAchievementDebugInfo() {
        await this.initializeGamification();
        
        let analyticsData = null;
        if (this.analytics) {
            analyticsData = await this.analytics.getAnalyticsData();
        }
        
        const combinedStats = {
            totalWords: analyticsData?.totalWords || this.data.stats.totalWords,
            totalReviews: this.data.stats.totalReviews,
            correctReviews: this.data.stats.correctReviews,
            streakDays: analyticsData?.currentStreak || 0,
            qualitySum: this.data.stats.qualitySum,
            bestDayReviews: this.data.stats.bestDayReviews
        };
        
        const achievements = VocabGamification.ACHIEVEMENTS;
        const debugInfo = {};
        
        Object.values(achievements).forEach(achievement => {
            const isUnlocked = this.data.unlockedAchievements.includes(achievement.id);
            const conditionMet = achievement.condition(combinedStats);
            const progress = this.calculateAchievementProgress(achievement, combinedStats);
            
            debugInfo[achievement.id] = {
                name: achievement.name,
                unlocked: isUnlocked,
                conditionMet: conditionMet,
                progress: progress,
                stats: combinedStats
            };
        });
        
        return debugInfo;
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
