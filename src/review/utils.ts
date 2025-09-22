import { VocabWord, QualityRating, ReviewSession } from '@/types';

// ===============================
// SRS Algorithm Utilities
// ===============================

export interface SRSCalculationResult {
  newInterval: number;
  newEaseFactor: number;
  nextReview: number;
}

/**
 * Calculate new SRS values based on quality rating
 * @param word Current word data
 * @param quality Quality rating (0-5)
 * @returns New interval, ease factor, and next review date
 */
export const calculateSRSValues = (word: VocabWord, quality: QualityRating): SRSCalculationResult => {
  let newInterval = word.interval;
  let newEaseFactor = word.easeFactor;

  if (quality >= 3) {
    // Correct answer - increase interval
    newInterval = Math.min(word.interval * 2, 365);
    newEaseFactor = Math.max(
      1.3, 
      word.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
  } else {
    // Incorrect answer - reset interval and decrease ease factor
    newInterval = 1;
    newEaseFactor = Math.max(1.3, word.easeFactor - 0.2);
  }

  const nextReview = Date.now() + (newInterval * 24 * 60 * 60 * 1000);

  return {
    newInterval,
    newEaseFactor,
    nextReview
  };
};

/**
 * Create updated word object with new SRS values
 * @param word Current word
 * @param quality Quality rating
 * @returns Updated word object
 */
export const createUpdatedWord = (word: VocabWord, quality: QualityRating): VocabWord => {
  const srsValues = calculateSRSValues(word, quality);
  
  return {
    ...word,
    quality,
    repetitions: word.repetitions + 1,
    lastReviewTime: Date.now(),
    totalReviews: word.totalReviews + 1,
    correctReviews: word.correctReviews + (quality >= 3 ? 1 : 0),
    interval: srsValues.newInterval,
    easeFactor: srsValues.newEaseFactor,
    nextReview: srsValues.nextReview
  };
};

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
 * @returns Final quality rating
 */
export const determineQualityRating = (params: QualityDeterminationParams): QualityRating => {
  const { isCorrect, usedHint, userSelectedQuality, isSkipped } = params;

  if (isSkipped) {
    return 0; // Skip button was pressed
  }

  if (usedHint) {
    // User used hint
    if (isCorrect) {
      return 2; // Used hint + correct = quality 2
    } else {
      return 0; // Used hint + wrong = quality 0
    }
  } else {
    // User didn't use hint
    if (isCorrect) {
      // User can choose 3-5 based on difficulty
      return userSelectedQuality || 3;
    } else {
      return 1; // No hint + wrong = quality 1
    }
  }
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

/**
 * Check if quality requires retry (quality 0-2)
 * @param quality Quality rating
 * @returns Whether retry is required
 */
export const requiresRetry = (quality: QualityRating): boolean => {
  return quality <= 2;
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
// Word Management
// ===============================

/**
 * Get words that are due for review
 * @param words Array of vocabulary words
 * @param currentTime Current timestamp (defaults to now)
 * @returns Words due for review
 */
export const getWordsForReview = (words: VocabWord[], currentTime: number = Date.now()): VocabWord[] => {
  return words.filter(word => word.nextReview <= currentTime);
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
export const playWordPronunciation = async (word: string, audioUrl?: string): Promise<void> => {
  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl);
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
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  } else {
    console.warn('Speech synthesis not supported');
  }
};

// ===============================
// Gamification and Analytics Updates
// ===============================

/**
 * Calculate XP gained based on quality rating
 * @param quality Quality rating (0-5)
 * @returns XP points earned
 */
export const calculateXPGained = (quality: QualityRating): number => {
  if (quality >= 3) return 10; // Correct answers
  if (quality === 2) return 5;  // Partial credit
  return 2; // Participation points
};

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
 * Update daily streak based on daily goal completion
 * @param params Streak update parameters
 * @returns Updated gamification data with proper streak handling
 */
export const updateDailyStreak = (params: {
  currentGamification: any;
  wordsReviewedToday: number;
  dailyGoal: number;
  currentDate?: Date;
}): { streak: number; lastStreakUpdate: number; streakIncremented: boolean } => {
  const { currentGamification, wordsReviewedToday, dailyGoal, currentDate = new Date() } = params;
  
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
  
  // If already updated today, don't increment again
  if (lastUpdateTimestamp === todayTimestamp) {
    return {
      streak: currentStreak,
      lastStreakUpdate: lastStreakUpdate,
      streakIncremented: false
    };
  }
  
  // Check if daily goal is met
  if (wordsReviewedToday >= dailyGoal) {
    // Check if this is consecutive day
    const oneDayMs = 24 * 60 * 60 * 1000;
    const isConsecutiveDay = (todayTimestamp - lastUpdateTimestamp) === oneDayMs;
    
    let newStreak;
    if (lastStreakUpdate === 0 || isConsecutiveDay) {
      // First time or consecutive day - increment streak
      newStreak = currentStreak + 1;
    } else {
      // Gap in days - reset to 1
      newStreak = 1;
    }
    
    return {
      streak: newStreak,
      lastStreakUpdate: todayTimestamp,
      streakIncremented: true
    };
  }
  
  // Goal not met yet - keep current streak
  return {
    streak: currentStreak,
    lastStreakUpdate: lastStreakUpdate,
    streakIncremented: false
  };
};

/**
 * Count words reviewed today
 * @param words Array of vocabulary words
 * @param currentDate Current date (defaults to today)
 * @returns Number of words reviewed today
 */
export const countWordsReviewedToday = (words: VocabWord[], currentDate: Date = new Date()): number => {
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();
  const todayEnd = todayStart + (24 * 60 * 60 * 1000) - 1;
  
  return words.filter(word => {
    return word.lastReviewTime && 
           word.lastReviewTime >= todayStart && 
           word.lastReviewTime <= todayEnd;
  }).length;
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

/**
 * Validate quality rating (0-5)
 * @param quality Quality rating to validate
 * @returns Whether quality is valid
 */
export const isValidQuality = (quality: any): quality is QualityRating => {
  return typeof quality === 'number' && quality >= 0 && quality <= 5;
};