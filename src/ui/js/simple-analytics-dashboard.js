// Simple Analytics Dashboard for debugging
class SimpleAnalyticsDashboard {
    constructor() {
        console.log('🚀 Simple Analytics Dashboard starting...');
        this.init();
    }

    async init() {
        try {
            // Step 1: Check basic requirements
            console.log('Step 1: Checking requirements...');
            if (!this.checkRequirements()) {
                return;
            }

            // Step 2: Initialize analytics
            console.log('Step 2: Initializing analytics...');
            await this.initializeAnalytics();

            // Step 3: Load and display data
            console.log('Step 3: Loading data...');
            await this.loadAndDisplayData();

            console.log('✅ Simple Analytics Dashboard loaded successfully');
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.showError(error.message);
        }
    }

    checkRequirements() {
        // Check StorageManager (works in both extension and mock context)
        if (typeof StorageManager === 'undefined') {
            this.showError('Storage system not available');
            return false;
        }

        // Check VocabAnalytics class
        if (typeof VocabAnalytics === 'undefined') {
            this.showError('VocabAnalytics class not found');
            return false;
        }

        console.log('✅ All requirements met');
        return true;
    }

    async initializeAnalytics() {
        // Create global analytics instance if not exists
        if (!window.vocabAnalytics) {
            console.log('Creating VocabAnalytics instance...');
            window.vocabAnalytics = new VocabAnalytics();
        }

        // Initialize analytics instance
        if (window.vocabAnalytics.ensureInitialized) {
            await window.vocabAnalytics.ensureInitialized();
        } else if (window.vocabAnalytics.initializeAnalytics) {
            await window.vocabAnalytics.initializeAnalytics();
        }
    }

    async loadAndDisplayData() {
        try {
            // Get dashboard stats from instance
            const stats = await window.vocabAnalytics.getDashboardStats();
            console.log('📊 Dashboard stats:', stats);

            // Update UI with real data
            this.updateStats(stats);
            
            // Hide loading state
            this.hideLoading();
            
        } catch (error) {
            console.warn('⚠️ Could not load stats, showing fallback:', error);
            await this.showFallbackStats();
        }
    }

    updateStats(stats) {
        console.log('🎯 Updating UI with stats:', stats);
        
        // Update overview stats (match HTML IDs)
        this.setElementText('total-words', stats.totalWords || 0);
        this.setElementText('current-streak', stats.currentStreak || 0);
        this.setElementText('total-time', this.formatTime(stats.totalTime || 0));
        this.setElementText('today-accuracy', (stats.accuracyRate || 0) + '%');

        // Update weekly stats if available
        if (stats.weeklyStats) {
            this.setElementText('words-this-week', stats.weeklyStats.wordsReviewed || 0);
            this.setElementText('sessions-this-week', stats.weeklyStats.sessions || 0);
            this.setElementText('avg-session-length', this.formatTime(stats.weeklyStats.timeSpent / Math.max(stats.weeklyStats.sessions, 1)));
        }
        
        // Update XP and overall accuracy
        this.setElementText('total-xp', stats.xp || 0);
        this.setElementText('overall-accuracy', (stats.accuracyRate || 0) + '%');

        // Update other elements
        this.setElementText('overall-accuracy', (stats.accuracyRate || 0) + '%');
    }

    async showFallbackStats() {
        console.log('📋 Showing fallback stats...');
        
        // Get raw data from storage
        const data = await this.getRawStorageData();
        console.log('📦 Raw storage data:', data);

        const vocabWords = data.vocab_words || [];
        const analyticsData = data.vocabAnalytics || {};

        const fallbackStats = {
            totalWords: Array.isArray(vocabWords) ? vocabWords.length : 0,
            currentStreak: analyticsData.currentStreak || 0,
            totalTime: analyticsData.totalTimeSpent || 0,
            accuracyRate: 0,
            weeklyStats: {
                wordsReviewed: 0,
                sessions: 0,
                timeSpent: 0
            }
        };

        console.log('📊 Fallback stats:', fallbackStats);
        this.updateStats(fallbackStats);
        this.hideLoading();
    }

    getRawStorageData() {
        return new Promise((resolve) => {
            chrome.storage.local.get(null, (result) => {
                resolve(result);
            });
        });
    }

    setElementText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
            console.log(`Updated ${id}: ${text}`);
        } else {
            console.warn(`Element ${id} not found`);
        }
    }

    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        if (minutes < 60) {
            return minutes + ' min';
        }
        const hours = Math.floor(minutes / 60);
        return hours + 'h ' + (minutes % 60) + 'm';
    }

    hideLoading() {
        const loadingState = document.getElementById('loading-state');
        if (loadingState) {
            loadingState.style.display = 'none';
        }
    }

    showError(message) {
        console.error('❌ Dashboard Error:', message);
        
        const container = document.querySelector('.analytics-container') || document.body;
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; text-align: center; padding: 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                <h3 style="color: #ef4444; margin-bottom: 1rem;">Analytics System Error</h3>
                <p style="color: #6b7280; margin-bottom: 2rem; max-width: 500px;">${message}</p>
                <button onclick="location.reload()" style="
                    background: #3b82f6; 
                    color: white; 
                    border: none; 
                    padding: 12px 24px; 
                    border-radius: 8px; 
                    cursor: pointer;
                    font-size: 1rem;
                ">Refresh Page</button>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM loaded, initializing Simple Analytics Dashboard...');
    new SimpleAnalyticsDashboard();
});
