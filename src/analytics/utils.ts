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
  
  // Use analytics data if available, otherwise calculate from words
  let totalStudyTime = analytics?.totalStudyTime || 0;
  let averageSessionTime = analytics?.averageSessionTime || 0;
  
  // If no analytics data, estimate from word data
  if (!analytics?.totalStudyTime && totalWords > 0) {
    // Estimate: 3 minutes per new word + 5 minutes per review
    const totalReviewsEstimate = words.reduce((sum, w) => sum + (w.totalReviews || 0), 0);
    totalStudyTime = (totalWords * 3 + totalReviewsEstimate * 5) * 60 * 1000; // Convert to milliseconds
    averageSessionTime = totalStudyTime / Math.max(Math.ceil(totalWords / 5), 1); // Assume 5 words per session
  }
  
  // Calculate accuracy from word data
  const wordsWithReviews = words.filter((w: VocabWord) => w.totalReviews > 0);
  const totalCorrectReviews = wordsWithReviews.reduce((sum: number, w: VocabWord) => sum + (w.correctReviews || 0), 0);
  const totalReviews = wordsWithReviews.reduce((sum: number, w: VocabWord) => sum + (w.totalReviews || 0), 0);
  const accuracy = totalReviews > 0 ? Math.round((totalCorrectReviews / totalReviews) * 100) : 0;
  
  // Get words due for review (safe check)
  const now = Date.now();
  const dueWords = words.filter((w: VocabWord) => {
    // Safety checks for valid word object
    if (!w || typeof w !== 'object') return false;
    
    // Check if nextReview exists and is valid
    if (!w.nextReview || typeof w.nextReview !== 'number' || isNaN(w.nextReview)) {
      // New words without nextReview are considered due
      return (w.repetitions || 0) === 0;
    }
    
    // Word is due if nextReview time has passed
    return w.nextReview <= now;
  }).length;

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
  // Set to start of today to avoid timezone issues
  today.setHours(0, 0, 0, 0);
  
  const weeklyData: WeeklyProgressData[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get start of current week (Sunday)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  
  // Debug logging for development
  const debugMode = false; // Set to true for debugging
  
  for (let i = 0; i < 7; i++) {
    // Create a new date for each day to avoid mutation issues
    const currentDay = new Date(weekStart);
    currentDay.setDate(weekStart.getDate() + i);
    const dayStart = currentDay.getTime();
    const dayEnd = dayStart + (24 * 60 * 60 * 1000) - 1; // End of day
    
    // Count words added on this day
    const wordsAddedToday = words.filter((w: VocabWord) => {
      if (!w.createdAt) return false;
      const isInRange = w.createdAt >= dayStart && w.createdAt <= dayEnd;
      if (debugMode && isInRange) {
        console.log(`Word added on ${dayNames[i]}:`, w.word, new Date(w.createdAt));
      }
      return isInRange;
    });
    
    // Count unique words that were reviewed on this day
    // (avoid double counting if a word was reviewed multiple times)
    const wordsReviewedToday = words.filter((w: VocabWord) => {
      if (!w.lastReviewTime) return false;
      const isInRange = w.lastReviewTime >= dayStart && w.lastReviewTime <= dayEnd;
      if (debugMode && isInRange) {
        console.log(`Word reviewed on ${dayNames[i]}:`, w.word, new Date(w.lastReviewTime));
      }
      return isInRange;
    });
    
    // Calculate UNIQUE words interacted with today (no double counting)
    // A word should only be counted once even if it was both added AND reviewed today
    const uniqueWordsToday = new Set<string>();
    
    // Add words that were added today
    wordsAddedToday.forEach(w => uniqueWordsToday.add(w.id));
    
    // Add words that were reviewed today (Set automatically handles duplicates)
    wordsReviewedToday.forEach(w => uniqueWordsToday.add(w.id));
    
    // Get final counts
    const wordsAddedCount = wordsAddedToday.length;
    const wordsReviewedCount = wordsReviewedToday.length;
    const uniqueWordsCount = uniqueWordsToday.size;
    
    // Count total review sessions (estimate based on word activity)
    // Assume each word reviewed = 1 session, plus each new word = potential review
    const totalReviewSessions = wordsReviewedCount + Math.floor(wordsAddedCount * 0.3); // 30% of new words get immediate practice
    
    // Calculate day.words as unique vocabulary interactions
    // This represents the breadth of vocabulary work (unique words touched)
    // NO DOUBLE COUNTING: A word that was both added AND reviewed today counts as 1
    const uniqueWordsWorkedOn = uniqueWordsCount;
    
    // More realistic time estimation based on research and SRS best practices
    const avgTimePerNewWord = 4; // minutes (includes initial learning, example reading, note-taking)
    const avgTimePerReview = 2; // minutes (includes thinking, answering, feedback)
    const setupTime = uniqueWordsWorkedOn > 0 ? 2 : 0; // App setup time if any activity
    
    const estimatedTime = Math.round(
      (wordsAddedCount * avgTimePerNewWord) + 
      (totalReviewSessions * avgTimePerReview) + 
      setupTime
    );
    
    if (debugMode) {
      console.log(`${dayNames[i]} summary:`, {
        wordsAddedCount,
        wordsReviewedCount,
        uniqueWordsWorkedOn,
        totalReviewSessions,
        estimatedTime,
        dayStart: new Date(dayStart),
        dayEnd: new Date(dayEnd)
      });
    }
    
    weeklyData.push({
      day: dayNames[i],
      words: uniqueWordsWorkedOn, // UNIQUE words interacted with (no double counting)
      time: estimatedTime,
      added: wordsAddedCount,
      reviewed: wordsReviewedCount // Unique words reviewed, not total review sessions
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
    .filter((w: VocabWord) => {
      // Safe checks for required properties
      const totalReviews = w.totalReviews || 0;
      return totalReviews >= minReviews && w.word && w.meaning;
    })
    .map((w: VocabWord) => {
      const totalReviews = w.totalReviews || 0;
      const correctReviews = w.correctReviews || 0;
      return {
        ...w,
        successRate: totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0
      };
    })
    .filter((w: DifficultWord) => w.successRate < maxSuccessRate) // Less than specified success rate
    .sort((a: DifficultWord, b: DifficultWord) => {
      // Sort by success rate first, then by total reviews (more reviews = more reliable)
      if (a.successRate !== b.successRate) {
        return a.successRate - b.successRate;
      }
      return (b.totalReviews || 0) - (a.totalReviews || 0);
    })
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
  let totalActivities = 0;
  
  words.forEach((w: VocabWord) => {
    // Count word creation time
    if (w.createdAt) {
      const date = new Date(w.createdAt);
      if (!isNaN(date.getTime())) { // Valid date check
        hourCounts[date.getHours()]++;
        dayCounts[date.getDay()]++;
        totalActivities++;
      }
    }
    
    // Count review activities
    if (w.lastReviewTime) {
      const date = new Date(w.lastReviewTime);
      if (!isNaN(date.getTime())) { // Valid date check
        hourCounts[date.getHours()]++;
        dayCounts[date.getDay()]++;
        totalActivities++;
      }
    }
  });
  
  // Find peak activity times with fallback
  const bestHour = hourCounts.length > 0 ? hourCounts.indexOf(Math.max(...hourCounts)) : 9; // Default 9 AM
  const bestDay = dayCounts.length > 0 ? dayCounts.indexOf(Math.max(...dayCounts)) : 1; // Default Monday
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Better session estimation
  const estimatedSessions = Math.max(
    Math.ceil(totalActivities / 8), // Average 8 activities per session
    Math.ceil(words.length / 5),    // Or 5 words per session
    1 // Minimum 1 session
  );
  
  return {
    bestStudyTime: `${bestHour.toString().padStart(2, '0')}:00 - ${(bestHour + 1).toString().padStart(2, '0')}:00`,
    mostActiveDay: dayNames[bestDay] || 'Monday',
    totalSessions: estimatedSessions
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
 * Get advanced analytics metrics for power users
 * @param words Array of vocabulary words
 * @returns Advanced metrics object
 */
export const getAdvancedAnalytics = (words: VocabWord[]) => {
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const oneMonth = 30 * 24 * 60 * 60 * 1000;
  
  // Learning velocity (words per day)
  const oldestWordTime = words.reduce((oldest, w) => 
    w.createdAt && w.createdAt < oldest ? w.createdAt : oldest, now
  );
  const daysSinceStart = Math.max((now - oldestWordTime) / (24 * 60 * 60 * 1000), 1);
  const learningVelocity = Math.round((words.length / daysSinceStart) * 10) / 10;
  
  // Retention rate (words still being reviewed vs total learned)
  const learnedWords = words.filter(w => (w.repetitions || 0) >= 3);
  const activeWords = words.filter(w => (w.lastReviewTime || 0) > (now - oneMonth));
  const retentionRate = learnedWords.length > 0 ? 
    Math.round((activeWords.length / learnedWords.length) * 100) : 100;
  
  // Recent activity
  const recentlyAdded = words.filter(w => (w.createdAt || 0) > (now - oneWeek)).length;
  const recentlyReviewed = words.filter(w => (w.lastReviewTime || 0) > (now - oneWeek)).length;
  
  // Word type distribution
  const wordTypes = words.reduce((acc: any, w) => {
    const type = w.wordType || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  return {
    learningVelocity,
    retentionRate,
    recentActivity: {
      added: recentlyAdded,
      reviewed: recentlyReviewed
    },
    wordTypes,
    totalDaysActive: Math.ceil(daysSinceStart)
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
 * @param vocabWords Vocabulary words array
 * @param settings Settings data
 * @returns Export data object compatible with popup import
 */
export const createAnalyticsExportData = (
  analytics?: AnalyticsData,
  gamification?: GamificationData,
  vocabWords: VocabWord[] = [],
  settings?: any
) => {
  return {
    vocabWords: vocabWords || [],
    analytics: analytics || {},
    gamification: gamification || {},
    settings: settings || {},
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
 * @param data Complete application data
 * @returns void - Downloads file directly
 */
export const exportAnalyticsData = (data?: any): void => {
  const exportData = createAnalyticsExportData(
    data?.analytics,
    data?.gamification,
    data?.vocabWords || [],
    data?.settings
  );
  const filename = generateAnalyticsExportFilename();
  downloadAnalyticsData(exportData, filename);
};