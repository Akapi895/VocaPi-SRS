
function getQualityDistribution(data) {
  const distribution = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 };
  data.reviewSessions.forEach(session => {
    if (session.quality !== undefined && distribution[session.quality] !== undefined) {
      distribution[session.quality]++;
    }
  });
  
  return distribution;
}

function getBestStudyTime(data) {
  if (!data.reviewSessions || data.reviewSessions.length === 0) return 'No data yet';

  const hourStats = {};
  data.reviewSessions.forEach(session => {
    const hour = new Date(session.timestamp).getHours();
    hourStats[hour] = (hourStats[hour] || 0) + 1;
  });

  const [bestHour] = Object.entries(hourStats)
    .sort(([,a],[,b]) => b - a)[0] || [12];

  if (bestHour >= 5 && bestHour < 8) return 'Early Morning (5-8 AM)';
  if (bestHour >= 8 && bestHour < 12) return 'Morning (8-12 PM)';
  if (bestHour >= 12 && bestHour < 14) return 'Lunch Time (12-2 PM)';
  if (bestHour >= 14 && bestHour < 18) return 'Afternoon (2-6 PM)';
  if (bestHour >= 18 && bestHour < 22) return 'Evening (6-10 PM)';
  return 'Night (10 PM-5 AM)';
}

function getMostActiveDay(data) {
  if (!data.dailyStats || Object.keys(data.dailyStats).length === 0) return 'No activity yet';

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
  if (!data.reviewSessions || data.reviewSessions.length === 0) return 0;

  const dailyStats = Object.values(data.dailyStats || {});
  if (dailyStats.length === 0) return 0;

  const activeDays = dailyStats.filter(day => (day.reviewsCount || 0) > 0);
  if (activeDays.length === 0) return 0;

  const totalTime = activeDays.reduce((sum, day) => sum + (day.timeSpent || 0), 0);
  const numberOfSessions = activeDays.length;
  
  const avgTimeMs = totalTime / numberOfSessions;
  
  return Math.round(avgTimeMs / 60000);
}

function getOverallAccuracy(data) {
  if (!data.reviewSessions || data.reviewSessions.length === 0) return 0;

  const correct = data.reviewSessions.filter(s => s.isCorrect).length;
  const total = data.reviewSessions.length;
  
  return Math.round((correct / total) * 100);
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
  const today = new Date().toDateString();
  const todayStats = data.dailyStats[today] || { reviewsCount:0, correctCount:0, timeSpent:0 };
  
  const bestStudyTime = getBestStudyTime(data);
  const mostActiveDay = getMostActiveDay(data);
  const avgSessionLength = getAverageSessionLength(data);
  const overallAccuracy = getOverallAccuracy(data);

  let totalXP = 0, achievementCount = 0;
  if (gamification) {
    const playerStats = await gamification.getPlayerStats();
    totalXP = playerStats.currentXP || 0;
    achievementCount = playerStats.achievementCount || 0;
  }

  const todayAccuracy = todayStats.reviewsCount > 0
    ? Math.round((todayStats.correctCount / todayStats.reviewsCount) * 100)
    : 0;

  let gamificationData = null;
  if (gamification && typeof gamification.getPlayerStats === 'function') {
    try {
      gamificationData = await gamification.getPlayerStats();
    } catch (error) {
      console.error('Failed to get gamification data:', error);
    }
  }

  const dailyStats = Object.values(data.dailyStats || {});
  const totalTimeSpentMs = dailyStats.reduce((sum, day) => sum + (day.timeSpent || 0), 0);
  const totalTimeSpentMinutes = Math.round(totalTimeSpentMs / 60000);

  const result = {
    totalWordsLearned: data.totalWords || 0,
    currentStreak: data.currentStreak || 0,
    totalTimeSpent: totalTimeSpentMinutes,
    todayAccuracy: todayAccuracy,
    totalXP: gamificationData?.currentXP || 0,
    achievementCount: gamificationData?.achievementCount || 0,
    weeklyProgress: getWeeklyProgress(data),
    qualityDistribution: getQualityDistribution(data),
    bestStudyTime: bestStudyTime,
    mostActiveDay: mostActiveDay,
    avgSessionLength: avgSessionLength,
    overallAccuracy: overallAccuracy
  };
  
  return result;
}

async function getDifficultWords(data) {
  const difficult = [];

  if (!window.VocabStorage) {
    console.warn('VocabStorage not available for difficult words');
    return [];
  }

  try {
    const allWords = await window.VocabStorage.getAllWords();
    const wordsMap = new Map(allWords.map(word => [word.id, word]));

    Object.entries(data.wordsLearned || {}).forEach(([wordId, w]) => {
      const word = wordsMap.get(wordId);
      if (!word) return; // Skip if word not found

      const accuracy = w.reviewCount > 0 ? (w.correctCount / w.reviewCount) * 100 : 0;
      const avgQuality = w.averageQuality || 0;

      if (w.reviewCount >= 2 && (accuracy < 80 || avgQuality < 3.5)) {
        difficult.push({
          wordId,
          word: word.word,
          meaning: word.meaning,
          accuracy: Math.round(accuracy),
          averageQuality: Number(avgQuality.toFixed(1)),
          reviewCount: w.reviewCount,
          correctCount: w.correctCount || 0,
          lastReviewed: w.lastReviewed,
          difficulty: accuracy < 50 ? 'high' : accuracy < 70 ? 'medium' : 'low'
        });
      }
    });

    difficult.sort((a, b) => {
      if (a.accuracy !== b.accuracy) {
        return a.accuracy - b.accuracy;
      }
      return b.reviewCount - a.reviewCount;
    });

    return difficult.slice(0, 10);
  } catch (error) {
    console.error('Error getting difficult words:', error);
    return [];
  }
}

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
