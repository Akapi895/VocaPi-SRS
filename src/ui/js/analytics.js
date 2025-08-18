/**
 * Simplified VocabAnalytics Class
 * Handles local analytics and learning progress tracking
 */
class VocabAnalytics {
    constructor() {
        this.initialized = false;
        this.data = {
            wordsLearned: {},
            reviewSessions: [],
            dailyStats: {},
            totalWords: 0,
            currentStreak: 0,
            bestStreak: 0,
            lastReviewDate: null,
            totalTimeSpent: 0,
            accuracyHistory: []
        };
        this.gamification = null; // Will be linked to VocabGamification
    }

    /**
     * Initialize analytics system
     */
    async ensureInitialized() {
        if (this.initialized) return;
        
        try {
            const result = await this.getStorageData('vocabAnalytics');
            if (result) {
                this.data = { ...this.data, ...result };
            }
            this.initialized = true;
            console.log('✅ VocabAnalytics initialized');
        } catch (error) {
            console.error('❌ Analytics initialization error:', error);
            this.initialized = true; // Continue with defaults
        }
    }

    /**
     * Get data from Chrome storage
     */
    getStorageData(key) {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get([key], (result) => {
                    resolve(result[key] || null);
                });
            } else {
                // Fallback for testing
                const data = localStorage.getItem(key);
                resolve(data ? JSON.parse(data) : null);
            }
        });
    }

    /**
     * Save data to Chrome storage
     */
    saveStorageData(key, data) {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.set({ [key]: data }, () => {
                    resolve();
                });
            } else {
                // Fallback for testing
                localStorage.setItem(key, JSON.stringify(data));
                resolve();
            }
        });
    }

    /**
     * Record a word review
     */
    async recordWordReview(wordId, userAnswer, correctAnswer, quality, timeSpent) {
        await this.ensureInitialized();
        
        const now = new Date();
        const today = now.toDateString();
        const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
        
        // Update word learning data
        if (!this.data.wordsLearned[wordId]) {
            this.data.wordsLearned[wordId] = {
                firstReviewed: now.toISOString(),
                reviewCount: 0,
                correctCount: 0,
                totalTimeSpent: 0,
                averageQuality: 0,
                lastReviewed: null
            };
            this.data.totalWords++;
        }
        
        const wordData = this.data.wordsLearned[wordId];
        wordData.reviewCount++;
        if (isCorrect) wordData.correctCount++;
        wordData.totalTimeSpent += timeSpent;
        wordData.averageQuality = ((wordData.averageQuality * (wordData.reviewCount - 1)) + quality) / wordData.reviewCount;
        wordData.lastReviewed = now.toISOString();
        
        // Update daily stats
        if (!this.data.dailyStats[today]) {
            this.data.dailyStats[today] = {
                reviewsCount: 0,
                correctCount: 0,
                timeSpent: 0,
                uniqueWords: []
            };
        }
        
        const dailyData = this.data.dailyStats[today];
        dailyData.reviewsCount++;
        if (isCorrect) dailyData.correctCount++;
        dailyData.timeSpent += timeSpent;
        
        // Track unique words for the day
        if (!dailyData.uniqueWords.includes(wordId)) {
            dailyData.uniqueWords.push(wordId);
        }
        
        // Update streak
        this.updateStreak(today);
        
        // Record review session
        this.data.reviewSessions.push({
            timestamp: now.toISOString(),
            wordId,
            userAnswer,
            correctAnswer,
            isCorrect,
            quality,
            timeSpent
        });
        
        // Keep only last 1000 sessions
        if (this.data.reviewSessions.length > 1000) {
            this.data.reviewSessions = this.data.reviewSessions.slice(-1000);
        }
        
        // Update totals
        this.data.totalTimeSpent += timeSpent;
        this.data.lastReviewDate = now.toISOString();
        
        // Save to storage
        await this.saveStorageData('vocabAnalytics', this.data);
        
        // Trigger gamification update
        if (this.gamification) {
            await this.gamification.handleWordReview(wordId, isCorrect, quality, timeSpent);
        }
        
        console.log('📊 Word review recorded:', { wordId, isCorrect, quality, timeSpent });
    }

    /**
     * Update learning streak
     */
    updateStreak(today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        if (this.data.dailyStats[yesterdayStr] || this.data.currentStreak === 0) {
            this.data.currentStreak++;
        } else {
            this.data.currentStreak = 1;
        }
        
        if (this.data.currentStreak > this.data.bestStreak) {
            this.data.bestStreak = this.data.currentStreak;
        }
    }

    /**
     * Get analytics data
     */
    async getAnalyticsData() {
        await this.ensureInitialized();
        return { ...this.data };
    }

    /**
     * Get weekly progress data
     */
    async getWeeklyProgress() {
        await this.ensureInitialized();
        
        const progress = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            
            const dayStats = this.data.dailyStats[dateStr] || { reviewsCount: 0, timeSpent: 0 };
            progress.push({
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                date: dateStr,
                words: dayStats.reviewsCount || 0,
                time: Math.round((dayStats.timeSpent || 0) / 60000) // Convert to minutes
            });
        }
        
        return progress;
    }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats() {
        await this.ensureInitialized();
        
        const today = new Date().toDateString();
        const todayStats = this.data.dailyStats[today] || { reviewsCount: 0, correctCount: 0, timeSpent: 0 };
        
        // Get gamification data
        let totalXP = 0;
        let achievementCount = 0;
        
        if (this.gamification) {
            const playerStats = await this.gamification.getPlayerStats();
            totalXP = playerStats.currentXP || 0;
            achievementCount = playerStats.achievementCount || 0;
        }
        
        // Calculate accuracy
        const todayAccuracy = todayStats.reviewsCount > 0 
            ? Math.round((todayStats.correctCount / todayStats.reviewsCount) * 100)
            : 0;
        
        // Get weekly progress
        const weeklyProgress = await this.getWeeklyProgress();
        
        // Get quality distribution
        const qualityDistribution = this.getQualityDistribution();
        
        return {
            totalWordsLearned: this.data.totalWords,
            currentStreak: this.data.currentStreak,
            totalTimeSpent: Math.round(this.data.totalTimeSpent / 60000), // Convert to minutes
            todayAccuracy,
            totalXP,
            achievementCount,
            weeklyProgress,
            qualityDistribution,
            bestStudyTime: this.getBestStudyTime(),
            mostActiveDay: this.getMostActiveDay(),
            avgSessionLength: this.getAverageSessionLength(),
            overallAccuracy: this.getOverallAccuracy()
        };
    }

    /**
     * Get quality distribution
     */
    getQualityDistribution() {
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        this.data.reviewSessions.forEach(session => {
            if (session.quality && distribution.hasOwnProperty(session.quality)) {
                distribution[session.quality]++;
            }
        });
        
        return distribution;
    }

    /**
     * Get best study time
     */
    getBestStudyTime() {
        const hourStats = {};
        
        this.data.reviewSessions.forEach(session => {
            const hour = new Date(session.timestamp).getHours();
            if (!hourStats[hour]) hourStats[hour] = 0;
            hourStats[hour]++;
        });
        
        let bestHour = 0;
        let maxReviews = 0;
        
        Object.entries(hourStats).forEach(([hour, count]) => {
            if (count > maxReviews) {
                maxReviews = count;
                bestHour = parseInt(hour);
            }
        });
        
        if (bestHour < 6) return 'Early Morning';
        if (bestHour < 12) return 'Morning';
        if (bestHour < 18) return 'Afternoon';
        return 'Evening';
    }

    /**
     * Get most active day
     */
    getMostActiveDay() {
        const dayStats = {};
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        Object.keys(this.data.dailyStats).forEach(dateStr => {
            const day = new Date(dateStr).getDay();
            const dayName = dayNames[day];
            if (!dayStats[dayName]) dayStats[dayName] = 0;
            dayStats[dayName] += this.data.dailyStats[dateStr].reviewsCount;
        });
        
        let mostActiveDay = 'Monday';
        let maxReviews = 0;
        
        Object.entries(dayStats).forEach(([day, count]) => {
            if (count > maxReviews) {
                maxReviews = count;
                mostActiveDay = day;
            }
        });
        
        return mostActiveDay;
    }

    /**
     * Get average session length
     */
    getAverageSessionLength() {
        if (this.data.reviewSessions.length === 0) return '0 min';
        
        const totalTime = this.data.reviewSessions.reduce((sum, session) => sum + session.timeSpent, 0);
        const avgTime = totalTime / this.data.reviewSessions.length;
        
        return Math.round(avgTime / 1000 / 60) + ' min'; // Convert to minutes
    }

    /**
     * Get overall accuracy
     */
    getOverallAccuracy() {
        if (this.data.reviewSessions.length === 0) return '0%';
        
        const correctReviews = this.data.reviewSessions.filter(session => session.isCorrect).length;
        const accuracy = (correctReviews / this.data.reviewSessions.length) * 100;
        
        return Math.round(accuracy) + '%';
    }

    /**
     * Get difficult words that need practice
     */
    async getDifficultWords() {
        await this.ensureInitialized();
        
        const difficultWords = [];
        
        Object.entries(this.data.wordsLearned).forEach(([wordId, data]) => {
            const accuracy = data.reviewCount > 0 ? (data.correctCount / data.reviewCount) * 100 : 0;
            const avgQuality = data.averageQuality || 0;
            
            if (data.reviewCount >= 3 && (accuracy < 70 || avgQuality < 3)) {
                difficultWords.push({
                    wordId,
                    accuracy: Math.round(accuracy),
                    averageQuality: avgQuality.toFixed(1),
                    reviewCount: data.reviewCount,
                    lastReviewed: data.lastReviewed
                });
            }
        });
        
        // Sort by lowest accuracy first
        difficultWords.sort((a, b) => a.accuracy - b.accuracy);
        
        return difficultWords.slice(0, 10); // Return top 10 difficult words
    }
}

// Make class globally available
window.VocabAnalytics = VocabAnalytics;
