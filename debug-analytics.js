// Analytics Debug and Validation Script
console.log('🔧 Starting Analytics Debug Script...');

// Debug function to test analytics system
async function debugAnalytics() {
    console.log('='.repeat(60));
    console.log('🔍 ANALYTICS DEBUG REPORT');
    console.log('='.repeat(60));
    
    try {
        // 1. Check if VocabAnalytics class exists
        console.log('1️⃣ Checking VocabAnalytics class...');
        if (typeof VocabAnalytics === 'undefined') {
            console.error('❌ VocabAnalytics class not found!');
            return;
        }
        console.log('✅ VocabAnalytics class found');
        
        // 2. Create instance and initialize
        console.log('\n2️⃣ Creating analytics instance...');
        const analytics = new VocabAnalytics();
        await analytics.ensureInitialized();
        console.log('✅ Analytics instance created and initialized');
        
        // 3. Check storage data
        console.log('\n3️⃣ Checking storage data...');
        const rawData = await analytics.getAnalyticsData();
        console.log('📦 Raw Analytics Data:', rawData);
        
        // 4. Get dashboard stats
        console.log('\n4️⃣ Getting dashboard stats...');
        const stats = await analytics.getDashboardStats();
        console.log('📊 Dashboard Stats:', stats);
        
        // 5. Validate data integrity
        console.log('\n5️⃣ Validating data integrity...');
        const totalReviews = Object.values(stats.qualityDistribution).reduce((sum, count) => sum + count, 0);
        const uniqueWordsReviewed = Object.keys(rawData.wordDifficulty || {}).length;
        
        console.log('📈 Data Analysis:');
        console.log('  - Total Reviews:', totalReviews);
        console.log('  - Unique Words Reviewed:', uniqueWordsReviewed);
        console.log('  - Total Sessions:', stats.totalSessions);
        console.log('  - Current Streak:', stats.currentStreak);
        console.log('  - Total XP:', stats.totalXP);
        
        // 6. Check if data is hardcoded
        console.log('\n6️⃣ Checking for hardcoded data...');
        const possibleHardcodedValues = {
            totalWordsLearned: [5, 0],
            currentStreak: [1, 0],
            totalXP: [100, 150, 0]
        };
        
        let hardcodedFlags = [];
        Object.entries(possibleHardcodedValues).forEach(([key, suspiciousValues]) => {
            if (suspiciousValues.includes(stats[key])) {
                hardcodedFlags.push(`${key}: ${stats[key]}`);
            }
        });
        
        if (hardcodedFlags.length > 0) {
            console.warn('⚠️ Potentially hardcoded values detected:', hardcodedFlags);
        } else {
            console.log('✅ No obvious hardcoded values detected');
        }
        
        // 7. Test real data flow
        console.log('\n7️⃣ Testing real data flow...');
        if (stats.isDataReal) {
            console.log('✅ Analytics contains real data from actual reviews');
        } else {
            console.log('⚠️ Analytics appears to have no real review data yet');
        }
        
        // 8. Weekly progress check
        console.log('\n8️⃣ Checking weekly progress...');
        const weeklyData = await analytics.getWeeklyProgress();
        const hasWeeklyActivity = weeklyData.some(day => day.words > 0 || day.time > 0);
        console.log('📅 Weekly Data:', weeklyData);
        console.log('📊 Has Weekly Activity:', hasWeeklyActivity);
        
        // 9. Achievement check
        console.log('\n9️⃣ Checking achievements...');
        const achievements = await analytics.getRecentAchievements();
        console.log('🏆 Achievements:', achievements);
        console.log('🏆 Achievement Count:', achievements.length);
        
        // 10. Summary
        console.log('\n🔟 SUMMARY');
        console.log('='.repeat(40));
        console.log('System Status:', rawData?.initialized ? '✅ Initialized' : '❌ Not Initialized');
        console.log('Data Source:', stats.isDataReal ? '✅ Real Data' : '⚠️ No Real Data Yet');
        console.log('Total Reviews:', totalReviews);
        console.log('Unique Words:', uniqueWordsReviewed);
        console.log('Sessions:', stats.totalSessions);
        console.log('Current Streak:', stats.currentStreak);
        console.log('Weekly Activity:', hasWeeklyActivity ? '✅ Yes' : '❌ No');
        
        return {
            success: true,
            stats,
            rawData,
            isDataReal: stats.isDataReal,
            totalReviews,
            uniqueWordsReviewed,
            hasWeeklyActivity,
            hardcodedFlags
        };
        
    } catch (error) {
        console.error('❌ Analytics debug failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Simulate a complete review session for testing
async function simulateCompleteReviewSession() {
    console.log('\n🎯 SIMULATING COMPLETE REVIEW SESSION');
    console.log('='.repeat(50));
    
    try {
        const analytics = new VocabAnalytics();
        await analytics.ensureInitialized();
        
        // Start session
        console.log('🚀 Starting review session...');
        await analytics.startSession();
        
        // Simulate reviewing multiple words
        const testWords = [
            { id: 'test_hello', userAnswer: 'hello', correctAnswer: 'hello', quality: 5 },
            { id: 'test_world', userAnswer: 'world', correctAnswer: 'world', quality: 4 },
            { id: 'test_computer', userAnswer: 'computer', correctAnswer: 'computer', quality: 3 },
            { id: 'test_programming', userAnswer: 'programming', correctAnswer: 'programming', quality: 5 },
            { id: 'test_algorithm', userAnswer: 'algorithm', correctAnswer: 'algorithm', quality: 4 },
            { id: 'test_variable', userAnswer: 'variable', correctAnswer: 'variable', quality: 3 }
        ];
        
        console.log(`📚 Reviewing ${testWords.length} words...`);
        
        for (const word of testWords) {
            const timeSpent = 2000 + Math.random() * 3000; // 2-5 seconds
            await analytics.recordWordReview(
                word.id, 
                word.userAnswer, 
                word.correctAnswer, 
                word.quality, 
                timeSpent
            );
            console.log(`  ✅ ${word.id} (quality: ${word.quality})`);
        }
        
        // End session
        console.log('🏁 Ending review session...');
        const sessionSummary = await analytics.endSession();
        console.log('📊 Session Summary:', sessionSummary);
        
        // Get updated stats
        const updatedStats = await analytics.getDashboardStats();
        console.log('📈 Updated Stats:', updatedStats);
        
        return {
            success: true,
            sessionSummary,
            updatedStats,
            wordsReviewed: testWords.length
        };
        
    } catch (error) {
        console.error('❌ Session simulation failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Export functions for use in console or other scripts
if (typeof window !== 'undefined') {
    window.debugAnalytics = debugAnalytics;
    window.simulateCompleteReviewSession = simulateCompleteReviewSession;
}

// Auto-run if loaded directly
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔧 Analytics Debug Script ready. Use debugAnalytics() or simulateCompleteReviewSession() in console.');
    });
}
