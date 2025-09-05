function updateStreak(data) {
  const now = new Date();
  const today = now.toDateString();
  
  const todayStats = data.dailyStats[today];
  const hasEnoughReviewsToday = todayStats && todayStats.reviewsCount >= 5;
  
  // Check if streak has already been updated for today
  const streakUpdatedToday = data.lastStreakUpdateDate === today;
  
  // Check if there's a gap of more than 1 day since last streak update
  let hasGap = false;
  if (data.lastStreakUpdateDate) {
    const lastUpdateDate = new Date(data.lastStreakUpdateDate);
    const daysDiff = Math.floor((now - lastUpdateDate) / (1000 * 60 * 60 * 24));
    hasGap = daysDiff > 1;
  }
  
  if (hasGap) {
    // Reset streak if there's a gap of more than 1 day
    data.currentStreak = 0;
  }
  
  if (!streakUpdatedToday) {
    if (hasEnoughReviewsToday) {
      // If today has enough reviews, increment streak
      data.currentStreak++;
    } else {
      // If today doesn't have enough reviews, reset streak to 0
      data.currentStreak = 0;
    }
    data.lastStreakUpdateDate = today;
  }

  if (data.currentStreak > data.bestStreak) {
    data.bestStreak = data.currentStreak;
  }
}

async function recordWordReview(data, wordId, userAnswer, correctAnswer, quality, timeSpent, gamification, saveFn) {
  const now = new Date();
  const today = now.toDateString();
  const isCorrect =
    userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

  if (!data.wordsLearned[wordId]) {
    data.wordsLearned[wordId] = {
      firstReviewed: now.toISOString(),
      reviewCount: 0,
      correctCount: 0,
      totalTimeSpent: 0,
      averageQuality: 0,
      lastReviewed: null,
    };
    data.totalWords++;
  }

  const wordData = data.wordsLearned[wordId];
  wordData.reviewCount++;
  if (isCorrect) wordData.correctCount++;
  wordData.totalTimeSpent += timeSpent;
  wordData.averageQuality =
    (wordData.averageQuality * (wordData.reviewCount - 1) + quality) /
    wordData.reviewCount;
  wordData.lastReviewed = now.toISOString();

  if (!data.dailyStats[today]) {
    data.dailyStats[today] = {
      reviewsCount: 0,
      correctCount: 0,
      timeSpent: 0,
      uniqueWords: [],
    };
  }

  const dailyData = data.dailyStats[today];
  dailyData.reviewsCount++;
  if (isCorrect) dailyData.correctCount++;
  dailyData.timeSpent += timeSpent;
  if (!dailyData.uniqueWords.includes(wordId))
    dailyData.uniqueWords.push(wordId);

  updateStreak(data);

  data.reviewSessions.push({
    timestamp: now.toISOString(),
    wordId,
    userAnswer,
    correctAnswer,
    isCorrect,
    quality,
    timeSpent,
  });

  if (data.reviewSessions.length > 1000) {
    data.reviewSessions = data.reviewSessions.slice(-1000);
  }

  data.lastReviewDate = now.toISOString();

  if (saveFn) {
    try {
      await saveFn(data);
    } catch (error) {
      console.error('Failed to save analytics data:', error);
    }
  }

  if (gamification && typeof gamification.handleWordReview === 'function') {
    try {
      await gamification.handleWordReview(
        wordId,
        isCorrect,
        quality,
        timeSpent
      );
    } catch (error) {
      console.warn('Gamification update failed:', error);
    }
  }
}


if (typeof window !== 'undefined') {
  window.recordWordReview = recordWordReview;
}
