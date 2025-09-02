// Analytics Stats Functions
function getQualityDistribution(data) {
  const distribution = { 1:0, 2:0, 3:0, 4:0, 5:0 };
  data.reviewSessions.forEach(session => {
    if (session.quality && distribution[session.quality] !== undefined) {
      distribution[session.quality]++;
    }
  });
  return distribution;
}

function getBestStudyTime(data) {
  if (!data.reviewSessions.length) return null;

  const hourStats = {};
  data.reviewSessions.forEach(session => {
    const hour = new Date(session.timestamp).getHours();
    hourStats[hour] = (hourStats[hour] || 0) + 1;
  });

  const [bestHour] = Object.entries(hourStats)
    .sort(([,a],[,b]) => b - a)[0] || [0];

  if (bestHour < 6) return 'Early Morning';
  if (bestHour < 12) return 'Morning';
  if (bestHour < 18) return 'Afternoon';
  return 'Evening';
}

function getMostActiveDay(data) {
  const dayStats = {};
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  Object.keys(data.dailyStats).forEach(dateStr => {
    const day = new Date(dateStr).getDay();
    const dayName = dayNames[day];
    dayStats[dayName] = (dayStats[dayName] || 0) + (data.dailyStats[dateStr].reviewsCount || 0);
  });

  const [mostActiveDay] = Object.entries(dayStats)
    .sort(([,a],[,b]) => b - a)[0] || ['Monday'];

  return mostActiveDay;
}

function getAverageSessionLength(data) {
  if (!data.reviewSessions.length) return 0; // minutes

  const totalTime = data.reviewSessions.reduce((sum, s) => sum + s.timeSpent, 0);
  const avgTimeMs = totalTime / data.reviewSessions.length;

  return Math.round(avgTimeMs / 60000); // minutes
}

function getOverallAccuracy(data) {
  if (!data.reviewSessions.length) return 0;

  const correct = data.reviewSessions.filter(s => s.isCorrect).length;
  return Math.round((correct / data.reviewSessions.length) * 100); // %
}

function getWeeklyProgress(data) {
  const progress = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();

    const dayStats = data.dailyStats[dateStr] || { reviewsCount:0, timeSpent:0 };
    progress.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: dateStr,
      words: dayStats.reviewsCount || 0,
      time: Math.round((dayStats.timeSpent || 0) / 60000)
    });
  }

  return progress;
}

async function getDashboardStats(data, gamification) {
  console.log('🔍 getDashboardStats called with data:', data);
  console.log('🔍 Data keys:', Object.keys(data));
  console.log('🔍 Review sessions:', data.reviewSessions?.length);
  console.log('🔍 Daily stats:', data.dailyStats);
  console.log('🔍 Total words:', data.totalWords);
  console.log('🔍 Current streak:', data.currentStreak);
  console.log('🔍 Gamification:', gamification);
  
  const today = new Date().toDateString();
  const todayStats = data.dailyStats[today] || { reviewsCount:0, correctCount:0, timeSpent:0 };
  
  console.log('🔍 Today stats:', todayStats);

  // gamification
  let totalXP = 0, achievementCount = 0;
  if (gamification) {
    const playerStats = await gamification.getPlayerStats();
    totalXP = playerStats.currentXP || 0;
    achievementCount = playerStats.achievementCount || 0;
  }

  const todayAccuracy = todayStats.reviewsCount > 0
    ? Math.round((todayStats.correctCount / todayStats.reviewsCount) * 100)
    : 0;

  // ✅ THÊM: Lấy gamification data
  let gamificationData = null;
  if (gamification && typeof gamification.getPlayerStats === 'function') {
    try {
      gamificationData = await gamification.getPlayerStats();
      console.log('🎮 Gamification data:', gamificationData);
    } catch (error) {
      console.error('❌ Failed to get gamification data:', error);
    }
  }

  // ✅ SỬA: Sử dụng gamification data cho XP và achievements
  const result = {
    totalWordsLearned: data.totalWords || 0,
    currentStreak: data.currentStreak || 0,
    totalTimeSpent: data.totalTimeSpent || 0,
    todayAccuracy: todayAccuracy,
    totalXP: gamificationData?.currentXP || 0, // ✅ Sử dụng gamification XP
    achievementCount: gamificationData?.achievementCount || 0, // ✅ Sử dụng gamification achievements
    weeklyProgress: getWeeklyProgress(data),
    qualityDistribution: getQualityDistribution(data),
    bestStudyTime: getBestStudyTime(data),
    mostActiveDay: getMostActiveDay(data),
    avgSessionLength: getAverageSessionLength(data),
    overallAccuracy: getOverallAccuracy(data)
  };
  
  console.log('🔍 getDashboardStats result:', result);
  return result;
}

function getDifficultWords(data) {
  const difficult = [];

  Object.entries(data.wordsLearned).forEach(([wordId, w]) => {
    const accuracy = w.reviewCount > 0 ? (w.correctCount / w.reviewCount) * 100 : 0;
    const avgQuality = w.averageQuality || 0;

    if (w.reviewCount >= 3 && (accuracy < 70 || avgQuality < 3)) {
      difficult.push({
        wordId,
        accuracy: Math.round(accuracy),
        averageQuality: Number(avgQuality.toFixed(1)),
        reviewCount: w.reviewCount,
        lastReviewed: w.lastReviewed
      });
    }
  });

  difficult.sort((a,b) => a.accuracy - b.accuracy);
  return difficult.slice(0,10);
}

// Export for use in extension
if (typeof window !== 'undefined') {
  window.AnalyticsStats = {
    getQualityDistribution,
    getBestStudyTime,
    getMostActiveDay,
    getAverageSessionLength,
    getOverallAccuracy,
    getWeeklyProgress,
    getDashboardStats,
    getDifficultWords
  };
}
