/**
 * Review Module - Clean API Exports
 * 
 * This module provides all the functionality needed for vocabulary review sessions
 * using advanced Spaced Repetition System (SRS) algorithms.
 */

// Core SRS Algorithm Functions
export {
  // Types
  type SRSCalculationResult,
  
  // Main SRS Functions
  calculateSRSValues,
  createUpdatedWord,
  
  // Word Analytics
  calculateWordDifficulty,
  getWordMaturity,
  calculateRetentionProbability,
  getWordAnalytics,
  
  // Prioritization & Optimization
  prioritizeWordsForReview,
  calculateReviewPriority,
  getOptimalSessionSize,
  
  // Validation & Utils
  isValidQuality,
  requiresRetry,
  calculateXPGained
} from './srs-algorithm';

// Utility Functions
export {
  // Quality Rating Logic
  determineQualityRating,
  type QualityDeterminationParams,
  
  // Answer Validation
  isAnswerCorrect,
  isValidInput,
  
  // Session Management
  type SessionStats,
  calculateAccuracy,
  calculateProgress,
  calculateSessionDuration,
  updateSessionStats,
  createReviewSession,
  
  // Word Management
  getWordsForReview,
  getUpcomingReviewWords,
  getReviewStatistics,
  shuffleArray,
  maskWordInSentence,
  
  // Audio & Pronunciation
  playWordPronunciation,
  
  // Analytics & Gamification
  calculateAnalyticsUpdate,
  calculateGamificationUpdate,
  updateDailyStreak,
  countWordsReviewedToday,
  
  // Advanced Learning Analytics
  calculateAdaptiveDailyGoal,
  analyzeLearningPatterns,
  calculateStreakRisk
} from './utils';

// Convenience functions for common use cases
export const initializeReviewSession = async (allWords: import('@/types').VocabWord[]) => {
  const { getWordsForReview, getOptimalSessionSize, getReviewStatistics } = await import('./utils');
  
  const stats = getReviewStatistics(allWords);
  const dueWords = getWordsForReview(allWords);
  const optimalSize = getOptimalSessionSize(dueWords.length);
  
  return {
    dueWords: dueWords.slice(0, optimalSize),
    statistics: stats,
    sessionSize: optimalSize
  };
};

export const processWordReview = async (
  word: import('@/types').VocabWord, 
  quality: import('@/types').QualityRating
) => {
  const { createUpdatedWord, calculateXPGained } = await import('./srs-algorithm');
  
  const updatedWord = createUpdatedWord(word, quality);
  const xpGained = calculateXPGained(quality);
  
  return {
    updatedWord,
    xpGained,
    wasSuccess: quality >= 3
  };
};