function updateStreak(data) {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const todayStats = data.dailyStats[today];
  const yesterdayStats = data.dailyStats[yesterdayStr];
  
  // Kiểm tra điều kiện streak hôm nay
  const hasEnoughReviewsToday = todayStats && todayStats.reviewsCount >= 5;
  const hadEnoughReviewsYesterday = yesterdayStats && yesterdayStats.reviewsCount >= 5;
  
  if (hasEnoughReviewsToday) {
    if (hadEnoughReviewsYesterday) {
      // Tiếp tục streak
      data.currentStreak++;
    } else if (data.currentStreak === 0) {
      // Bắt đầu streak mới
      data.currentStreak = 1;
    }
    // Nếu hôm qua không đủ reviews nhưng hôm nay có, giữ nguyên streak
  } else {
    // Hôm nay không đủ reviews, reset streak về 0
    data.currentStreak = 0;
  }

  // Cập nhật best streak
  if (data.currentStreak > data.bestStreak) {
    data.bestStreak = data.currentStreak;
  }
}

async function recordWordReview(data, wordId, userAnswer, correctAnswer, quality, timeSpent, gamification, saveFn) {
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

  // Cập nhật streak mỗi khi review để đảm bảo tính chính xác
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

  // Giới hạn số session (tối đa 1000) - tối ưu performance
  if (data.reviewSessions.length > 1000) {
    data.reviewSessions = data.reviewSessions.slice(-1000);
  }

  // ✅ THÊM: Debug logs cho time
  console.log('⏱️ Time debug:', {
    originalTimeSpent: timeSpent,
    timeSpentMinutes: Math.round(timeSpent / 60000 * 100) / 100,
    currentTotalTime: data.totalTimeSpent,
    newTotalTime: data.totalTimeSpent + Math.round(timeSpent / 60000 * 100) / 100
  });
  
  // Update total time spent (in minutes)
  const timeSpentMinutes = Math.round(timeSpent / 60000 * 100) / 100;
  data.totalTimeSpent += timeSpentMinutes;
  
  // Tổng thời gian + ngày review cuối
  data.lastReviewDate = now.toISOString();

  // Lưu vào storage
  if (saveFn) {
    try {
      console.log('💾 Saving analytics data to storage:', data);
      console.log('🔍 Data keys:', Object.keys(data));
      console.log('🔍 Review sessions count:', data.reviewSessions?.length);
      console.log('🔍 Daily stats:', data.dailyStats);
      
      // ✅ SỬA: Gọi saveFn với đúng tham số
      await saveFn(data);
      console.log('✅ Analytics data saved successfully');
      
      // ✅ THÊM: Verify data was saved
      if (window.AnalyticsStorage) {
        const savedData = await window.AnalyticsStorage.getData();
        console.log('🔍 Verified saved data:', savedData);
      }
    } catch (error) {
      console.error('❌ Failed to save analytics data:', error);
    }
  }

  // Gamification (nếu có)
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

  console.log("📊 Word review recorded:", {
    wordId,
    isCorrect,
    quality,
    timeSpent,
  });
}

// Export for use in extension
if (typeof window !== 'undefined') {
  window.recordWordReview = recordWordReview;
}
