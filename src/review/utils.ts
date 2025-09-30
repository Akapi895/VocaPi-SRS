import { VocabWord, QualityRating, ReviewSession } from '@/types';

// Import SRS core algorithm functions for internal use
import {
  calculateWordDifficulty,
  getWordMaturity,
  prioritizeWordsForReview,
  getOptimalSessionSize,
  calculateXPGained
} from './srs-algorithm';

// Re-export for external use
export type { SRSCalculationResult } from './srs-algorithm';
export {
  calculateSRSValues,
  createUpdatedWord,
  calculateWordDifficulty,
  getWordMaturity,
  calculateRetentionProbability,
  prioritizeWordsForReview,
  getOptimalSessionSize,
  calculateReviewPriority,
  getWordAnalytics,
  isValidQuality,
  requiresRetry,
  calculateXPGained
} from './srs-algorithm';

// ===============================
// Quality Rating Logic
// ===============================

export interface QualityDeterminationParams {
  isCorrect: boolean;
  usedHint: boolean;
  userSelectedQuality?: QualityRating;
  isSkipped?: boolean;
}

/**
 * Determine final quality rating based on user performance
 * @param params Parameters for quality determination
 * @returns Final quality rating (0-5)
 */
export const determineQualityRating = (params: QualityDeterminationParams): QualityRating => {
  const { isCorrect, usedHint, userSelectedQuality, isSkipped } = params;

  let finalQuality: QualityRating;

  if (isSkipped) {
    finalQuality = 0; // Skip button was pressed
  } else if (usedHint) {
    // User used hint
    if (isCorrect) {
      finalQuality = 2; // Used hint + correct = quality 2
    } else {
      finalQuality = 0; // Used hint + wrong = quality 0
    }
  } else {
    // User didn't use hint
    if (isCorrect) {
      // User can choose 3-5 based on difficulty
      finalQuality = userSelectedQuality || 3;
    } else {
      finalQuality = 1; // No hint + wrong = quality 1
    }
  }

  return finalQuality;
};

/**
 * Check if answer is correct (case-insensitive)
 * @param userAnswer User's answer
 * @param correctAnswer Correct answer
 * @returns Whether the answer is correct
 */
export const isAnswerCorrect = (userAnswer: string, correctAnswer: string): boolean => {
  return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
};



// ===============================
// Session Management
// ===============================

export interface SessionStats {
  correct: number;
  total: number;
  startTime: number;
  totalTime: number;
}

/**
 * Calculate session accuracy percentage
 * @param stats Session statistics
 * @returns Accuracy percentage (0-100)
 */
export const calculateAccuracy = (stats: SessionStats): number => {
  if (stats.total === 0) return 0;
  return (stats.correct / stats.total) * 100;
};

/**
 * Calculate session progress percentage
 * @param currentIndex Current word index
 * @param totalWords Total number of words
 * @returns Progress percentage (0-100)
 */
export const calculateProgress = (currentIndex: number, totalWords: number): number => {
  if (totalWords === 0) return 0;
  return ((currentIndex + 1) / totalWords) * 100;
};

/**
 * Calculate session duration in minutes
 * @param startTime Session start time (timestamp)
 * @param endTime Session end time (timestamp, defaults to current time)
 * @returns Duration in minutes
 */
export const calculateSessionDuration = (startTime: number, endTime: number = Date.now()): number => {
  return Math.round((endTime - startTime) / 1000 / 60);
};

/**
 * Update session statistics after answer
 * @param currentStats Current session stats
 * @param isCorrect Whether the answer was correct
 * @returns Updated session stats
 */
export const updateSessionStats = (currentStats: SessionStats, isCorrect: boolean): SessionStats => {
  return {
    ...currentStats,
    correct: currentStats.correct + (isCorrect ? 1 : 0),
    total: currentStats.total + 1
  };
};

/**
 * Create review session record
 * @param params Session parameters
 * @returns Review session object
 */
export const createReviewSession = (params: {
  startTime: number;
  endTime: number;
  wordsReviewed: string[];
  correctAnswers: number;
  totalAnswers: number;
}): ReviewSession => {
  const { startTime, endTime, wordsReviewed, correctAnswers, totalAnswers } = params;
  const totalTime = endTime - startTime;
  
  return {
    id: `session_${Date.now()}`,
    startTime,
    endTime,
    wordsReviewed,
    correctAnswers,
    totalAnswers,
    averageResponseTime: totalTime / totalAnswers,
    quality: correctAnswers / totalAnswers
  };
};

// ===============================
// Word Management & Statistics  
// ===============================

// ===============================
// Word Management
// ===============================

/**
 * Get words that are due for review, sorted by priority
 * Fixed: Better duplicate detection and stricter due time checking
 * @param words Array of vocabulary words
 * @param currentTime Current timestamp (defaults to now)
 * @param maxWords Maximum number of words to return (optional)
 * @returns Words due for review, prioritized and deduplicated
 */
export const getWordsForReview = (
  words: VocabWord[], 
  currentTime: number = Date.now(),
  maxWords?: number
): VocabWord[] => {
  // Use Map to deduplicate by ID first
  const uniqueWords = new Map<string, VocabWord>();
  
  words.forEach(word => {
    // Safety checks
    if (!word || typeof word !== 'object' || !word.id) return;
    
    // Only keep the most recent version if there are duplicates
    if (!uniqueWords.has(word.id) || 
        (uniqueWords.get(word.id)!.updatedAt || 0) < (word.updatedAt || 0)) {
      uniqueWords.set(word.id, word);
    }
  });
  
  // Filter words that are actually due
  const dueWords = Array.from(uniqueWords.values()).filter(word => {
    // Check if nextReview exists and is a valid number
    if (!word.nextReview || typeof word.nextReview !== 'number' || isNaN(word.nextReview)) {
      // If no nextReview is set, only include new words (repetitions === 0)
      return word.repetitions === 0;
    }
    
    // Add a small buffer (1 minute) to prevent timing issues
    // Word is due if nextReview time has passed (with 1 minute tolerance)
    const dueTime = word.nextReview - (60 * 1000); // 1 minute buffer
    return dueTime <= currentTime;
  });
  
  // Prioritize the due words  
  const prioritizedWords = prioritizeWordsForReview(dueWords, currentTime);
  
  // Return limited number if specified
  return maxWords ? prioritizedWords.slice(0, maxWords) : prioritizedWords;
};

/**
 * Get words approaching review time (within next 24 hours)
 * @param words Array of vocabulary words
 * @param currentTime Current timestamp (defaults to now)
 * @param hoursAhead Hours to look ahead (default 24)
 * @returns Words approaching review time
 */
export const getUpcomingReviewWords = (
  words: VocabWord[], 
  currentTime: number = Date.now(),
  hoursAhead: number = 24
): VocabWord[] => {
  const futureTime = currentTime + (hoursAhead * 60 * 60 * 1000);
  
  return words.filter(word => {
    if (!word.nextReview || word.nextReview <= currentTime) return false;
    return word.nextReview <= futureTime;
  });
};

/**
 * Get review statistics for planning
 * @param words Array of vocabulary words
 * @param currentTime Current timestamp (defaults to now)
 * @returns Review statistics
 */
export const getReviewStatistics = (words: VocabWord[], currentTime: number = Date.now()) => {
  const dueNow = getWordsForReview(words, currentTime);
  const upcoming24h = getUpcomingReviewWords(words, currentTime, 24);
  const upcoming7d = getUpcomingReviewWords(words, currentTime, 24 * 7);
  
  const maturityCounts = words.reduce((acc, word) => {
    const maturity = getWordMaturity(word);
    acc[maturity] = (acc[maturity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const avgDifficulty = words.length > 0 
    ? words.reduce((sum, word) => sum + calculateWordDifficulty(word), 0) / words.length
    : 0;
  
  return {
    total: words.length,
    dueNow: dueNow.length,
    upcoming24h: upcoming24h.length,
    upcoming7d: upcoming7d.length,
    maturityDistribution: maturityCounts,
    averageDifficulty: Math.round(avgDifficulty * 100) / 100,
    recommendedSessionSize: getOptimalSessionSize(dueNow.length)
  };
};

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param array Array to shuffle
 * @returns Shuffled array (new array)
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Mask words in example sentences for hints
 * @param sentence Original sentence
 * @param wordToMask Word to be masked
 * @param maskSymbol Symbol to use for masking (defaults to '_____')
 * @returns Sentence with word masked
 */
export const maskWordInSentence = (
  sentence: string, 
  wordToMask: string, 
  maskSymbol: string = '_____'
): string => {
  const regex = new RegExp(`\\b${wordToMask}\\b`, 'gi');
  return sentence.replace(regex, maskSymbol);
};

// ===============================
// Audio and Pronunciation
// ===============================

/**
 * Play word pronunciation with fallback to TTS
 * @param word Word to pronounce
 * @param audioUrl Audio URL (optional)
 * @returns Promise that resolves when audio starts playing
 */
export const playWordPronunciation = async (
  word: string, 
  audioUrl?: string, 
  audioSettings?: {
    speechRate?: number;
    speechVolume?: number;
    voiceSelection?: string;
  }
): Promise<void> => {
  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      if (audioSettings?.speechVolume) {
        audio.volume = audioSettings.speechVolume;
      }
      await audio.play();
      return;
    } catch (error) {
      console.warn('Failed to play audio URL, falling back to TTS:', error);
    }
  }

  // Fallback to Speech Synthesis
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    
    // Apply audio settings
    if (audioSettings) {
      utterance.rate = audioSettings.speechRate || 1.0;
      utterance.volume = audioSettings.speechVolume || 0.8;
      
      // Set voice if specified
      if (audioSettings.voiceSelection && audioSettings.voiceSelection !== 'default') {
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes(audioSettings.voiceSelection!.toLowerCase())
        );
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
    } else {
      // Default values
      utterance.rate = 1.0;
      utterance.volume = 0.8;
    }
    
    speechSynthesis.speak(utterance);
  } else {
    console.warn('Speech synthesis not supported');
  }
};

// ===============================
// Gamification and Analytics Updates
// ===============================



/**
 * Calculate analytics update data
 * @param params Update parameters
 * @returns Analytics update object
 */
export const calculateAnalyticsUpdate = (params: {
  currentAnalytics: any;
  sessionTime: number;
  finalQuality: QualityRating;
}) => {
  const { currentAnalytics, sessionTime, finalQuality } = params;
  
  return {
    totalStudyTime: (currentAnalytics.totalStudyTime || 0) + sessionTime,
    averageSessionTime: ((currentAnalytics.averageSessionTime || 0) + sessionTime) / 2,
    totalWords: currentAnalytics.totalWords || 0,
    learnedWords: (currentAnalytics.learnedWords || 0) + (finalQuality >= 3 ? 1 : 0),
    accuracy: currentAnalytics.accuracy || 0
  };
};

/**
 * Calculate gamification update data
 * @param params Update parameters
 * @returns Gamification update object
 */
export const calculateGamificationUpdate = (params: {
  currentGamification: any;
  sessionTime: number;
  finalQuality: QualityRating;
}) => {
  const { currentGamification, sessionTime, finalQuality } = params;
  const xpGained = calculateXPGained(finalQuality);
  
  // Don't modify streak here - it should be handled by daily goal tracking
  // This function is called for each word review, but streak should only increase once per day
  return {
    xp: (currentGamification.xp || 0) + xpGained,
    totalStudyTime: (currentGamification.totalStudyTime || 0) + sessionTime,
    // Keep existing streak value - don't increment per word
    streak: currentGamification.streak || 0
  };
};

/**
 * Update daily streak based on new logic:
 * - ≥10 từ: streak++  
 * - 1-9 từ: streak giữ nguyên
 * - 0 từ: streak = 0
 * @param params Streak update parameters
 * @returns Updated gamification data with proper streak handling
 */
export const updateDailyStreak = (params: {
  currentGamification: any;
  wordsReviewedToday: number;
  dailyGoal?: number; // Optional for backward compatibility
  currentDate?: Date;
}): { streak: number; lastStreakUpdate: number; streakIncremented: boolean; shouldResetStreak: boolean } => {
  const { currentGamification, wordsReviewedToday, currentDate = new Date() } = params;
  
  // Get current streak and last update date
  const currentStreak = currentGamification.streak || 0;
  const lastStreakUpdate = currentGamification.lastStreakUpdate || 0;
  
  // Check if today is different from last streak update day
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  
  const lastUpdateDate = new Date(lastStreakUpdate);
  lastUpdateDate.setHours(0, 0, 0, 0);
  const lastUpdateTimestamp = lastUpdateDate.getTime();
  
  // Check if we need to process yesterday's result (gap detection)
  const oneDayMs = 24 * 60 * 60 * 1000;
  const daysDiff = Math.round((todayTimestamp - lastUpdateTimestamp) / oneDayMs);
  
  // If there was a gap of more than 1 day, reset streak to 0
  if (lastStreakUpdate > 0 && daysDiff > 1) {
    return {
      streak: 0,
      lastStreakUpdate: todayTimestamp,
      streakIncremented: false,
      shouldResetStreak: true
    };
  }
  
  // If already processed today, don't update again
  if (lastUpdateTimestamp === todayTimestamp) {
    return {
      streak: currentStreak,
      lastStreakUpdate: lastStreakUpdate,
      streakIncremented: false,
      shouldResetStreak: false
    };
  }
  
  // New streak logic:
  let newStreak = currentStreak;
  let streakIncremented = false;
  let shouldResetStreak = false;
  
  if (wordsReviewedToday >= 10) {
    // ≥10 từ: streak++
    if (lastStreakUpdate === 0) {
      // First time streak
      newStreak = 1;
    } else if (daysDiff === 1) {
      // Consecutive day - increment streak
      newStreak = currentStreak + 1;
    } else {
      // Gap handled above, this shouldn't happen
      newStreak = 1;
    }
    streakIncremented = true;
  } else if (wordsReviewedToday > 0 && wordsReviewedToday < 10) {
    // 1-9 từ: streak giữ nguyên
    newStreak = currentStreak;
    streakIncremented = false;
  } else {
    // 0 từ: streak = 0 (only if this is end of day check)
    newStreak = 0;
    shouldResetStreak = true;
  }
  
  return {
    streak: newStreak,
    lastStreakUpdate: todayTimestamp,
    streakIncremented: streakIncremented,
    shouldResetStreak: shouldResetStreak
  };
};

/**
 * Count words reviewed today - Fixed to count unique words only
 * @param words Array of vocabulary words
 * @param currentDate Current date (defaults to today)
 * @returns Number of unique words reviewed today
 */
export const countWordsReviewedToday = (words: VocabWord[], currentDate: Date = new Date()): number => {
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();
  const todayEnd = todayStart + (24 * 60 * 60 * 1000) - 1;
  
  // Use Set to ensure unique word IDs only
  const uniqueWordsReviewedToday = new Set<string>();
  
  words.forEach(word => {
    // Check if word was reviewed today (has lastReviewTime in today's range)
    // Also count words that have totalReviews > 0 and updated recently
    const wasReviewedToday = word.lastReviewTime && 
      word.lastReviewTime >= todayStart && 
      word.lastReviewTime <= todayEnd;
      
    const wasUpdatedToday = word.updatedAt && 
      word.updatedAt >= todayStart && 
      word.updatedAt <= todayEnd &&
      (word.totalReviews || 0) > 0;
    
    if (wasReviewedToday || wasUpdatedToday) {
      uniqueWordsReviewedToday.add(word.id);
    }
  });
  
  return uniqueWordsReviewedToday.size;
};

// ===============================
// Adaptive Learning & Performance Tracking
// ===============================

/**
 * Calculate dynamic daily goal based on user performance and available time
 * @param currentPerformance Recent performance metrics
 * @param availableStudyTime Available study time in minutes
 * @param currentGoal Current daily goal
 * @returns Suggested daily goal adjustment
 */
export const calculateAdaptiveDailyGoal = (params: {
  recentAccuracy: number;
  averageTimePerWord: number; // in seconds
  availableStudyTime: number; // in minutes
  currentGoal: number;
  completionRate: number; // how often daily goal is met (0-1)
}): number => {
  const { recentAccuracy, averageTimePerWord, availableStudyTime, currentGoal, completionRate } = params;
  
  // Calculate how many words can fit in available time
  const maxWordsInTime = Math.floor((availableStudyTime * 60) / averageTimePerWord);
  
  let adjustedGoal = currentGoal;
  
  // Adjust based on completion rate
  if (completionRate >= 0.8 && recentAccuracy >= 0.75) {
    // User is consistently meeting goals with good accuracy - increase slightly
    adjustedGoal = Math.min(currentGoal + 2, maxWordsInTime);
  } else if (completionRate < 0.5 || recentAccuracy < 0.6) {
    // User struggling - decrease goal
    adjustedGoal = Math.max(5, currentGoal - 2);
  }
  
  // Ensure goal is realistic for available time
  return Math.min(adjustedGoal, maxWordsInTime);
};

/**
 * Detect learning patterns and suggest optimizations
 * @param words User's vocabulary words
 * @param sessions Recent review sessions
 * @returns Learning insights and recommendations
 */
export const analyzeLearningPatterns = (words: VocabWord[], sessions: ReviewSession[]) => {
  const insights = {
    difficultWordTypes: [] as string[],
    bestStudyTimes: [] as string[],
    strugglingCategories: [] as string[],
    recommendations: [] as string[]
  };
  
  // Analyze difficult word types
  const wordTypeAccuracy = words.reduce((acc, word) => {
    if (word.totalReviews > 0) {
      const accuracy = word.correctReviews / word.totalReviews;
      if (!acc[word.wordType]) acc[word.wordType] = [];
      acc[word.wordType].push(accuracy);
    }
    return acc;
  }, {} as Record<string, number[]>);
  
  // Find word types with low average accuracy
  Object.entries(wordTypeAccuracy).forEach(([type, accuracies]) => {
    const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    if (avgAccuracy < 0.7) {
      insights.difficultWordTypes.push(type);
      insights.strugglingCategories.push(`${type} (${Math.round(avgAccuracy * 100)}% accuracy)`);
    }
  });
  
  // Analyze session timing patterns
  if (sessions.length >= 5) {
    const sessionsByHour = sessions.reduce((acc, session) => {
      const hour = new Date(session.startTime).getHours();
      if (!acc[hour]) acc[hour] = [];
      acc[hour].push(session.quality);
      return acc;
    }, {} as Record<number, number[]>);
    
    // Find hours with best performance
    const hourPerformance = Object.entries(sessionsByHour)
      .map(([hour, qualities]) => ({
        hour: parseInt(hour),
        avgQuality: qualities.reduce((sum, q) => sum + q, 0) / qualities.length
      }))
      .sort((a, b) => b.avgQuality - a.avgQuality);
    
    if (hourPerformance.length > 0) {
      insights.bestStudyTimes = hourPerformance
        .slice(0, 3)
        .map(hp => `${hp.hour}:00 (${Math.round(hp.avgQuality * 100)}% avg quality)`);
    }
  }
  
  // Generate recommendations
  if (insights.difficultWordTypes.length > 0) {
    insights.recommendations.push(`Focus extra practice on ${insights.difficultWordTypes.join(', ')} word types`);
  }
  
  if (insights.bestStudyTimes.length > 0) {
    insights.recommendations.push(`Schedule reviews during your peak hours: ${insights.bestStudyTimes[0].split(' ')[0]}`);
  }
  
  // Check for overdue words
  const overdueWords = words.filter(word => 
    word.nextReview && word.nextReview < Date.now() - (7 * 24 * 60 * 60 * 1000)
  );
  
  if (overdueWords.length > 10) {
    insights.recommendations.push(`You have ${overdueWords.length} words overdue by more than a week. Consider smaller daily sessions to catch up.`);
  }
  
  return insights;
};

/**
 * Calculate streak preservation probability
 * @param currentStreak Current streak count
 * @param todaysProgress Today's progress (0-1)
 * @param averageSessionQuality Recent average session quality
 * @returns Probability of maintaining streak (0-1)
 */
export const calculateStreakRisk = (
  currentStreak: number,
  todaysProgress: number,
  averageSessionQuality: number
): { risk: number; recommendation: string } => {
  let risk = 0;
  
  // Higher risk for longer streaks (more to lose)
  const streakPressure = Math.min(currentStreak / 30, 1) * 0.3;
  
  // Risk based on today's progress
  const progressRisk = (1 - todaysProgress) * 0.5;
  
  // Risk based on recent quality (low quality suggests difficulty)
  const qualityRisk = (1 - averageSessionQuality) * 0.2;
  
  risk = streakPressure + progressRisk + qualityRisk;
  
  let recommendation = '';
  if (risk > 0.7) {
    recommendation = 'High risk of breaking streak! Complete a few easy reviews now.';
  } else if (risk > 0.4) {
    recommendation = 'Moderate streak risk. Try to complete your daily goal today.';
  } else {
    recommendation = 'Streak is safe. Keep up the good work!';
  }
  
  return { risk, recommendation };
};

// ===============================
// Validation Helpers
// ===============================

/**
 * Validate user input (non-empty, trimmed)
 * @param input User input string
 * @returns Whether input is valid
 */
export const isValidInput = (input: string): boolean => {
  return input.trim().length > 0;
};

