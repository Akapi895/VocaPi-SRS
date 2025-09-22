import { AnalyticsData, GamificationData, VocabWord } from '@/types';
import { 
  getGamificationSummary,
  GamificationAnalysisData,
  WeeklyProgressData
} from '@/gamification';

// Additional types for analytics
export interface StudyPatterns {
  bestStudyTime: string;
  mostActiveDay: string;
  totalSessions: number;
}

export interface WordDistribution {
  new: number;
  learning: number;
  review: number;
}

// Re-export types from gamification system for backward compatibility
export type { 
  WeeklyProgressData, 
  Achievement, 
  UserRank, 
  LevelProgress,
  GamificationAnalysisData 
} from '@/gamification';

// Legacy type for difficult words
export interface DifficultWord extends VocabWord {
  successRate: number;
}

/**
 * Calculate real-time statistics from vocab words data
 * @param words Array of vocabulary words
 * @param analytics Analytics data (optional)
 * @returns Core statistics object
 */
export const calculateCoreStatistics = (
  words: VocabWord[], 
  analytics?: AnalyticsData
) => {
  const totalWords = words.length;
  const totalStudyTime = analytics?.totalStudyTime || 0;
  const averageSessionTime = analytics?.averageSessionTime || (totalStudyTime / Math.max(totalWords / 5, 1));
  
  // Calculate accuracy from word data
  const wordsWithReviews = words.filter((w: VocabWord) => w.totalReviews > 0);
  const totalCorrectReviews = wordsWithReviews.reduce((sum: number, w: VocabWord) => sum + w.correctReviews, 0);
  const totalReviews = wordsWithReviews.reduce((sum: number, w: VocabWord) => sum + w.totalReviews, 0);
  const accuracy = totalReviews > 0 ? Math.round((totalCorrectReviews / totalReviews) * 100) : 0;
  
  // Get words due for review
  const now = Date.now();
  const dueWords = words.filter((w: VocabWord) => w.nextReview <= now).length;

  return {
    totalWords,
    totalStudyTime,
    averageSessionTime,
    accuracy,
    dueWords,
    totalReviews,
    totalCorrectReviews,
    wordsWithReviews: wordsWithReviews.length
  };
};

/**
 * Calculate word distribution by difficulty level
 * @param words Array of vocabulary words
 * @returns Word distribution object
 */
export const calculateWordDistribution = (words: VocabWord[]): WordDistribution => {
  return {
    new: words.filter((w: VocabWord) => w.repetitions === 0).length,
    learning: words.filter((w: VocabWord) => w.repetitions > 0 && w.repetitions < 5).length,
    review: words.filter((w: VocabWord) => w.repetitions >= 5).length
  };
};

/**
 * Calculate streak information from gamification data and analytics
 * @param gamification Gamification data
 * @param analytics Analytics data
 * @returns Streak information
 */
export const calculateStreakInfo = (
  gamification?: GamificationData,
  analytics?: AnalyticsData
) => {
  const currentStreak = gamification?.streak || 0;
  const longestStreak = analytics?.longestStreak || Math.max(currentStreak, analytics?.currentStreak || 0);
  
  return {
    currentStreak,
    longestStreak
  };
};

/**
 * Generate weekly progress data from vocabulary words
 * @param words Array of vocabulary words
 * @returns Array of weekly progress data
 */
export const generateWeeklyProgress = (words: VocabWord[]): WeeklyProgressData[] => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  
  const weeklyData: WeeklyProgressData[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(weekStart);
    currentDay.setDate(weekStart.getDate() + i);
    const dayStart = currentDay.getTime();
    const dayEnd = dayStart + (24 * 60 * 60 * 1000);
    
    // Count words added on this day
    const wordsAddedToday = words.filter((w: VocabWord) => 
      w.createdAt >= dayStart && w.createdAt < dayEnd
    ).length;
    
    // Count words reviewed on this day (estimate from lastReviewTime)
    const wordsReviewedToday = words.filter((w: VocabWord) => 
      w.lastReviewTime && w.lastReviewTime >= dayStart && w.lastReviewTime < dayEnd
    ).length;
    
    // Estimate study time (5 minutes per review + 3 minutes per new word)
    const estimatedTime = (wordsReviewedToday * 5) + (wordsAddedToday * 3);
    
    weeklyData.push({
      day: dayNames[i],
      words: wordsAddedToday + wordsReviewedToday,
      time: estimatedTime,
      added: wordsAddedToday,
      reviewed: wordsReviewedToday
    });
  }
  
  return weeklyData;
};

/**
 * Get difficult words (low success rate)
 * @param words Array of vocabulary words
 * @param minReviews Minimum number of reviews required
 * @param maxSuccessRate Maximum success rate to be considered difficult
 * @param limit Maximum number of words to return
 * @returns Array of difficult words with success rates
 */
export const getDifficultWords = (
  words: VocabWord[],
  minReviews: number = 3,
  maxSuccessRate: number = 70,
  limit: number = 6
): DifficultWord[] => {
  return words
    .filter((w: VocabWord) => w.totalReviews >= minReviews) // Only words with enough reviews
    .map((w: VocabWord) => ({
      ...w,
      successRate: w.totalReviews > 0 ? (w.correctReviews / w.totalReviews) * 100 : 0
    }))
    .filter((w: DifficultWord) => w.successRate < maxSuccessRate) // Less than specified success rate
    .sort((a: DifficultWord, b: DifficultWord) => a.successRate - b.successRate) // Sort by difficulty
    .slice(0, limit);
};

/**
 * Analyze study patterns from vocabulary words
 * @param words Array of vocabulary words
 * @returns Study patterns analysis
 */
export const analyzeStudyPatterns = (words: VocabWord[]): StudyPatterns => {
  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Array(7).fill(0);
  
  words.forEach((w: VocabWord) => {
    if (w.createdAt) {
      const date = new Date(w.createdAt);
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;
    }
    if (w.lastReviewTime) {
      const date = new Date(w.lastReviewTime);
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;
    }
  });
  
  const bestHour = hourCounts.indexOf(Math.max(...hourCounts));
  const bestDay = dayCounts.indexOf(Math.max(...dayCounts));
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return {
    bestStudyTime: `${bestHour}:00 - ${bestHour + 1}:00`,
    mostActiveDay: dayNames[bestDay],
    totalSessions: Math.floor(words.length / 5) || 1 // Estimate
  };
};

/**
 * Get comprehensive analytics summary
 * @param data Application data
 * @returns Complete analytics summary
 */
export const getAnalyticsSummary = (data: any) => {
  const words = data?.vocabWords || [];
  const analytics = data?.analytics || {};
  const gamification = data?.gamification || {};
  
  const coreStats = calculateCoreStatistics(words, analytics);
  const wordDistribution = calculateWordDistribution(words);
  const streakInfo = calculateStreakInfo(gamification, analytics);
  const weeklyProgress = generateWeeklyProgress(words);
  const studyPatterns = analyzeStudyPatterns(words);
  const difficultWords = getDifficultWords(words);
  
  // Create data for gamification system
  const gamificationData: GamificationAnalysisData = {
    totalWords: coreStats.totalWords,
    currentStreak: streakInfo.currentStreak,
    accuracy: coreStats.accuracy,
    totalStudyTime: coreStats.totalStudyTime,
    wordDistribution,
    weeklyProgress,
    words,
    analytics,
    gamification
  };
  
  // Get gamification summary
  const gamificationSummary = getGamificationSummary(gamificationData);
  
  return {
    coreStats,
    wordDistribution,
    streakInfo,
    weeklyProgress,
    studyPatterns,
    achievements: gamificationSummary.achievements,
    levelProgress: gamificationSummary.levelProgress,
    userRank: gamificationSummary.userRank,
    difficultWords
  };
};
  
/**
 * Format time in minutes to human-readable format
 * @param minutes Time in minutes
 * @returns Formatted time string
 */
export const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

/**
 * Create export data for analytics
 * @param analytics Analytics data
 * @param gamification Gamification data
 * @param wordsCount Total words count
 * @returns Export data object
 */
export const createAnalyticsExportData = (
  analytics?: AnalyticsData,
  gamification?: GamificationData,
  wordsCount: number = 0
) => {
  return {
    analytics,
    gamification,
    words: wordsCount,
    exportDate: new Date().toISOString(),
    version: '1.0.1'
  };
};

/**
 * Generate filename for analytics export
 * @returns Formatted filename with current date
 */
export const generateAnalyticsExportFilename = (): string => {
  return `vocab-analytics-${new Date().toISOString().split('T')[0]}.json`;
};

/**
 * Download analytics data as JSON file
 * @param exportData Data to export
 * @param filename Filename for the download
 */
export const downloadAnalyticsData = (exportData: any, filename: string): void => {
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export analytics data with proper formatting
 * @param analytics Analytics data
 * @param gamification Gamification data
 * @param wordsCount Total words count
 */
export const exportAnalyticsData = (
  analytics?: AnalyticsData,
  gamification?: GamificationData,
  wordsCount: number = 0
): void => {
  const exportData = createAnalyticsExportData(analytics, gamification, wordsCount);
  const filename = generateAnalyticsExportFilename();
  downloadAnalyticsData(exportData, filename);
};