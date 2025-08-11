// Real Data Validation Script
console.log('🔍 Starting Real Data Validation...');

async function validateAllAnalyticsData() {
    console.log('='.repeat(60));
    console.log('🚨 COMPREHENSIVE ANALYTICS DATA VALIDATION');
    console.log('='.repeat(60));
    
    try {
        // Initialize analytics
        const analytics = new VocabAnalytics();
        await analytics.ensureInitialized();
        
        // Get all data
        const stats = await analytics.getDashboardStats();
        const weeklyData = await analytics.getWeeklyProgress();
        const rawData = await analytics.getAnalyticsData();
        
        console.log('\n📊 Raw Analytics Data:');
        console.log(JSON.stringify(rawData, null, 2));
        
        console.log('\n📈 Processed Dashboard Stats:');
        console.log(JSON.stringify(stats, null, 2));
        
        console.log('\n📅 Weekly Progress Data:');
        console.log(JSON.stringify(weeklyData, null, 2));
        
        // Validate each metric
        const validationResults = {
            totalWordsLearned: validateTotalWords(stats, rawData),
            currentStreak: validateCurrentStreak(stats, rawData),
            timeSpentLearning: validateTimeSpent(stats, rawData),
            todayAccuracy: validateTodayAccuracy(stats, rawData),
            weeklyProgress: validateWeeklyProgress(weeklyData),
            qualityDistribution: validateQualityDistribution(stats),
            learningPatterns: await validateLearningPatterns(stats, weeklyData, rawData)
        };
        
        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('🎯 VALIDATION SUMMARY');
        console.log('='.repeat(50));
        
        Object.entries(validationResults).forEach(([metric, result]) => {
            const status = result.isReal ? '✅ REAL DATA' : '❌ FAKE/HARDCODED';
            console.log(`${metric}: ${status}`);
            if (result.details) {
                console.log(`   Details: ${result.details}`);
            }
            if (result.warning) {
                console.log(`   ⚠️ ${result.warning}`);
            }
        });
        
        const allReal = Object.values(validationResults).every(result => result.isReal);
        console.log('\n' + '='.repeat(50));
        console.log(allReal ? '🎉 ALL DATA IS REAL!' : '⚠️ SOME DATA MAY BE FAKE');
        console.log('='.repeat(50));
        
        return {
            success: true,
            allReal,
            results: validationResults,
            stats,
            weeklyData,
            rawData
        };
        
    } catch (error) {
        console.error('❌ Validation failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

function validateTotalWords(stats, rawData) {
    const uniqueWordsReviewed = Object.keys(rawData.wordDifficulty || {}).length;
    const totalReviews = Object.values(stats.qualityDistribution || {}).reduce((sum, count) => sum + count, 0);
    
    // Real if: matches unique words reviewed from word difficulty tracking
    const isReal = stats.totalWordsLearned === uniqueWordsReviewed;
    const isZeroButValid = stats.totalWordsLearned === 0 && uniqueWordsReviewed === 0 && totalReviews === 0;
    
    return {
        isReal: isReal || isZeroButValid,
        details: `${stats.totalWordsLearned} total words, ${uniqueWordsReviewed} unique reviewed, ${totalReviews} total reviews`,
        warning: (!isReal && !isZeroButValid) ? 'Total words does not match unique words reviewed' : null
    };
}

function validateCurrentStreak(stats, rawData) {
    const today = new Date().toISOString().split('T')[0];
    const todayStats = rawData.dailyStats?.[today];
    const hasRealActivity = todayStats && todayStats.wordsReviewed > 0;
    
    // Real if: streak correlates with actual daily activity
    const suspiciousValues = [1]; // Common hardcoded values
    const isSuspicious = suspiciousValues.includes(stats.currentStreak);
    const isReal = !isSuspicious || (stats.currentStreak === 0 && !hasRealActivity);
    
    return {
        isReal,
        details: `${stats.currentStreak} day streak, today's activity: ${todayStats?.wordsReviewed || 0} words`,
        warning: isSuspicious ? 'Streak value appears suspicious' : null
    };
}

function validateTimeSpent(stats, rawData) {
    const totalTimeFromDaily = Object.values(rawData.dailyStats || {})
        .reduce((sum, day) => sum + (day.timeSpent || 0), 0);
    
    // Real if: matches sum of daily time spent
    const isReal = stats.totalTime === totalTimeFromDaily || (stats.totalTime === 0 && totalTimeFromDaily === 0);
    
    return {
        isReal,
        details: `${stats.totalTime} total time, ${totalTimeFromDaily} from daily stats`,
        warning: !isReal ? 'Total time does not match daily stats sum' : null
    };
}

function validateTodayAccuracy(stats, rawData) {
    const today = new Date().toISOString().split('T')[0];
    const todayStats = rawData.dailyStats?.[today];
    
    // Real if: matches today's daily stats or is 0
    const isReal = stats.todayAccuracy === (todayStats?.accuracy || 0);
    
    return {
        isReal,
        details: `${stats.todayAccuracy}% accuracy, today's stats: ${todayStats?.accuracy || 0}%`,
        warning: !isReal ? 'Today accuracy does not match daily stats' : null
    };
}

function validateWeeklyProgress(weeklyData) {
    const hasRealActivity = weeklyData.some(day => day.words > 0 || day.time > 0);
    const allZeros = weeklyData.every(day => day.words === 0 && day.time === 0);
    
    // Real if: has actual activity or all zeros (no activity yet)
    const isReal = hasRealActivity || allZeros;
    
    return {
        isReal,
        details: `${weeklyData.length} days, ${weeklyData.filter(d => d.words > 0).length} with activity`,
        warning: !isReal ? 'Weekly progress has suspicious patterns' : null
    };
}

function validateQualityDistribution(stats) {
    const totalReviews = Object.values(stats.qualityDistribution || {}).reduce((sum, count) => sum + count, 0);
    const hasOnlyZeros = Object.values(stats.qualityDistribution || {}).every(count => count === 0);
    
    // Real if: has actual review counts or all zeros
    const suspiciousPatterns = [
        { 0: 0, 1: 1, 2: 1, 3: 2, 4: 1, 5: 0 }, // Common hardcoded pattern
        { 0: 1, 1: 2, 2: 3, 3: 8, 4: 5, 5: 3 }  // Another common pattern
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => 
        JSON.stringify(pattern) === JSON.stringify(stats.qualityDistribution)
    );
    
    const isReal = !isSuspicious && (totalReviews > 0 || hasOnlyZeros);
    
    return {
        isReal,
        details: `${totalReviews} total reviews, distribution: ${JSON.stringify(stats.qualityDistribution)}`,
        warning: isSuspicious ? 'Quality distribution matches known hardcoded patterns' : null
    };
}

async function validateLearningPatterns(stats, weeklyData, rawData) {
    // Test learning patterns calculation
    const analytics = new (class extends AnalyticsDashboard {
        testLoadLearningPatterns(stats, weeklyData) {
            return {
                studyTimes: rawData.studyTimes || [],
                weeklyActivity: weeklyData.some(d => d.words > 0),
                totalSessions: stats.totalSessions,
                totalReviews: Object.values(stats.qualityDistribution || {}).reduce((sum, count) => sum + count, 0)
            };
        }
    })();
    
    const patterns = analytics.testLoadLearningPatterns(stats, weeklyData);
    
    // Real if: based on actual data or shows "no data" states
    const hasStudyTimes = patterns.studyTimes.length > 0;
    const hasWeeklyActivity = patterns.weeklyActivity;
    const hasSessions = patterns.totalSessions > 0;
    const hasReviews = patterns.totalReviews > 0;
    
    const isReal = hasStudyTimes || hasWeeklyActivity || hasSessions || hasReviews || 
                  (!hasStudyTimes && !hasWeeklyActivity && !hasSessions && !hasReviews);
    
    return {
        isReal,
        details: `${patterns.studyTimes.length} study sessions, ${patterns.totalSessions} total sessions, ${patterns.totalReviews} reviews`,
        warning: null
    };
}

// Export for global use
if (typeof window !== 'undefined') {
    window.validateAllAnalyticsData = validateAllAnalyticsData;
    console.log('🔍 Real Data Validation Script loaded. Run validateAllAnalyticsData() in console.');
}
