function updateStreak(data) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  if (data.dailyStats[yesterdayStr] || data.currentStreak === 0) {
    data.currentStreak++;
  } else {
    data.currentStreak = 1;
  }

  if (data.currentStreak > data.bestStreak) {
    data.bestStreak = data.currentStreak;
  }
}

export async function recordWordReview(
  data,
  wordId,
  userAnswer,
  correctAnswer,
  quality,
  timeSpent,
  gamification,
  saveFn
) {
  const now = new Date();
  const today = now.toDateString();
  const isCorrect =
    userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

  // Nếu từ lần đầu tiên được review
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

  // Cập nhật dữ liệu của từ
  const wordData = data.wordsLearned[wordId];
  wordData.reviewCount++;
  if (isCorrect) wordData.correctCount++;
  wordData.totalTimeSpent += timeSpent;
  wordData.averageQuality =
    (wordData.averageQuality * (wordData.reviewCount - 1) + quality) /
    wordData.reviewCount;
  wordData.lastReviewed = now.toISOString();

  // Cập nhật daily stats
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

  // Cập nhật streak
  updateStreak(data);

  // Lưu lại session
  data.reviewSessions.push({
    timestamp: now.toISOString(),
    wordId,
    userAnswer,
    correctAnswer,
    isCorrect,
    quality,
    timeSpent,
  });

  // Giới hạn số session (tối đa 1000)
  if (data.reviewSessions.length > 1000) {
    data.reviewSessions = data.reviewSessions.slice(-1000);
  }

  // Tổng thời gian + ngày review cuối
  data.totalTimeSpent += timeSpent;
  data.lastReviewDate = now.toISOString();

  // Lưu vào storage
  await saveFn("vocabAnalytics", data);

  // Gamification (nếu có)
  if (gamification) {
    await gamification.handleWordReview(
      wordId,
      isCorrect,
      quality,
      timeSpent
    );
  }

  console.log("📊 Word review recorded:", {
    wordId,
    isCorrect,
    quality,
    timeSpent,
  });
}
