import { VocabWord, QualityRating } from '@/types';

// ===============================
// Core SRS Algorithm Types & Interfaces
// ===============================

export interface SRSCalculationResult {
  newInterval: number;
  newEaseFactor: number;
  nextReview: number;
}

export interface WordAnalytics {
  difficulty: number;
  maturity: 'new' | 'learning' | 'young' | 'mature';
  retentionProbability: number;
}

export interface ReviewPriority {
  word: VocabWord;
  priority: number;
}

// ===============================
// Core SRS Algorithm Implementation
// ===============================

/**
 * Calculate new SRS values based on quality rating (0-5)
 * @param word Current word data
 * @param quality Quality rating (0-5)
 * @returns New interval, ease factor, and next review date
 */
export const calculateSRSValues = (word: VocabWord, quality: QualityRating): SRSCalculationResult => {
  let newInterval = word.interval;
  let newEaseFactor = word.easeFactor;
  const repetitions = word.repetitions;

  // Advanced SuperMemo 2 algorithm with improved quality handling
  if (quality >= 3) {
    // Successful recall (quality 3, 4, 5)
    
    if (repetitions === 0) {
      // First successful review
      newInterval = 1;
    } else if (repetitions === 1) {
      // Second successful review
      newInterval = 6;
    } else {
      // Subsequent successful reviews
      // Use ease factor to calculate interval with quality-based adjustment
      const qualityMultiplier = getQualityMultiplier(quality);
      newInterval = Math.round(word.interval * newEaseFactor * qualityMultiplier);
    }
    
    // Update ease factor based on quality (SuperMemo 2 formula enhanced)
    const easeAdjustment = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    newEaseFactor = Math.max(1.3, word.easeFactor + easeAdjustment);
    
    // Apply difficulty bonus for quality 5
    if (quality === 5) {
      newEaseFactor += 0.05; // Extra bonus for perfect recall
      newInterval = Math.round(newInterval * 1.1); // 10% interval bonus
    }
    
  } else {
    // Failed recall (quality 0, 1, 2)
    
    // Reset repetition count and adjust interval based on failure severity
    newInterval = getFailureInterval(quality, repetitions);
    
    // Decrease ease factor based on failure severity
    const easePenalty = getEasePenalty(quality);
    newEaseFactor = Math.max(1.3, word.easeFactor - easePenalty);
    
    // Additional penalty for complete blackout
    if (quality === 0) {
      newEaseFactor = Math.max(1.3, newEaseFactor - 0.1);
    }
  }
  
  // Apply retention-based adjustments
  newInterval = applyRetentionAdjustment(newInterval, word, quality);
  
  // Cap maximum interval to prevent words from disappearing too long
  newInterval = Math.min(newInterval, getMaxInterval(quality, repetitions));
  
  // Ensure minimum interval
  newInterval = Math.max(newInterval, 1);
  
  const nextReview = Date.now() + (newInterval * 24 * 60 * 60 * 1000);

  return {
    newInterval,
    newEaseFactor: Math.round(newEaseFactor * 100) / 100,
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
  
  // Update repetitions based on success/failure
  let newRepetitions = word.repetitions;
  if (quality >= 3) {
    newRepetitions += 1; // Increment on success
  } else {
    // Reset repetitions on failure, but keep some progress for partial recall
    newRepetitions = quality >= 2 ? Math.floor(word.repetitions / 2) : 0;
  }
  
  return {
    ...word,
    quality,
    repetitions: newRepetitions,
    lastReviewTime: Date.now(),
    totalReviews: word.totalReviews + 1,
    correctReviews: word.correctReviews + (quality >= 3 ? 1 : 0),
    interval: srsValues.newInterval,
    easeFactor: srsValues.newEaseFactor,
    nextReview: srsValues.nextReview
  };
};

// ===============================
// SRS Helper Functions
// ===============================

/**
 * Get quality-based multiplier for interval calculation
 */
const getQualityMultiplier = (quality: QualityRating): number => {
  switch (quality) {
    case 5: return 1.0;   // Perfect - normal progression
    case 4: return 0.95;  // Good but with hesitation - slight reduction
    case 3: return 0.85;  // Difficult - more reduction
    default: return 1.0;
  }
};

/**
 * Get interval for failed reviews based on quality and repetition history
 */
const getFailureInterval = (quality: QualityRating, repetitions: number): number => {
  switch (quality) {
    case 0: return 1;  // Complete blackout - restart
    case 1: return Math.min(3, Math.max(1, Math.floor(repetitions / 2))); // Partial memory
    case 2: return Math.min(5, Math.max(2, Math.floor(repetitions / 1.5))); // Easy recall but wrong
    default: return 1;
  }
};

/**
 * Get ease factor penalty based on failure quality
 */
const getEasePenalty = (quality: QualityRating): number => {
  switch (quality) {
    case 0: return 0.3;  // Severe penalty for blackout
    case 1: return 0.2;  // Standard penalty  
    case 2: return 0.15; // Lighter penalty for near-miss
    default: return 0.2;
  }
};

/**
 * Apply retention-based adjustment considering review history and current quality
 */
const applyRetentionAdjustment = (interval: number, word: VocabWord, quality: QualityRating): number => {
  // Calculate recent performance (last 5 reviews)
  const accuracy = word.totalReviews > 0 ? word.correctReviews / word.totalReviews : 0;
  
  // Base adjustment from historical accuracy
  let adjustmentFactor = 1.0;
  
  if (accuracy >= 0.9) {
    // High performer - can handle slightly longer intervals
    adjustmentFactor = 1.1;
  } else if (accuracy <= 0.6) {
    // Struggling - need more frequent reviews
    adjustmentFactor = 0.8;
  }
  
  // Additional adjustment based on current quality for successful reviews
  if (quality >= 3) {
    const qualityBonus = (quality - 3) * 0.05; // 0%, 5%, 10% bonus for quality 3,4,5
    adjustmentFactor += qualityBonus;
  }
  
  return Math.round(interval * adjustmentFactor);
};

/**
 * Get maximum allowed interval based on quality and maturity
 */
const getMaxInterval = (quality: QualityRating, repetitions: number): number => {
  // Base maximum intervals
  const baseMax = repetitions < 5 ? 90 : 365; // Younger cards have shorter max
  
  // Adjust based on quality
  switch (quality) {
    case 5: return baseMax;           // Perfect recall - full interval
    case 4: return Math.round(baseMax * 0.8);  // Good recall - 80% of max
    case 3: return Math.round(baseMax * 0.6);  // Difficult recall - 60% of max
    default: return Math.round(baseMax * 0.3); // Failed - much shorter max
  }
};

// ===============================
// Word Analytics & Classification
// ===============================

/**
 * Calculate word difficulty based on review history
 * @param word Vocabulary word
 * @returns Difficulty score (0-1, where 1 is most difficult)
 */
export const calculateWordDifficulty = (word: VocabWord): number => {
  if (word.totalReviews === 0) return 0.5; // Unknown difficulty for new words
  
  const accuracy = word.correctReviews / word.totalReviews;
  const repetitionsFactor = Math.min(word.repetitions / 10, 1); // Max factor at 10 reps
  const easeFactor = (2.5 - word.easeFactor) / 1.2; // Normalize ease factor (1.3-2.5 -> 1-0)
  
  // Combine factors: lower accuracy + low ease factor + few repetitions = higher difficulty
  const difficulty = (1 - accuracy) * 0.6 + easeFactor * 0.3 + (1 - repetitionsFactor) * 0.1;
  
  return Math.max(0, Math.min(1, difficulty));
};

/**
 * Get word maturity level based on successful repetitions
 * @param word Vocabulary word
 * @returns Maturity level: 'new', 'learning', 'young', 'mature'
 */
export const getWordMaturity = (word: VocabWord): 'new' | 'learning' | 'young' | 'mature' => {
  if (word.repetitions === 0) return 'new';
  if (word.repetitions <= 3) return 'learning';
  if (word.repetitions <= 7) return 'young';
  return 'mature';
};

/**
 * Calculate retention probability based on time since last review
 * @param word Vocabulary word
 * @param currentTime Current timestamp
 * @returns Retention probability (0-1)
 */
export const calculateRetentionProbability = (word: VocabWord, currentTime: number = Date.now()): number => {
  if (!word.lastReviewTime || word.repetitions === 0) return 0.5;
  
  const daysSinceReview = (currentTime - word.lastReviewTime) / (24 * 60 * 60 * 1000);
  const expectedInterval = word.interval;
  
  // Use exponential decay based on ease factor and time ratio
  const timeRatio = daysSinceReview / expectedInterval;
  const decayRate = (3.0 - word.easeFactor) * 0.5; // Higher decay for difficult words
  
  return Math.max(0.1, Math.min(1.0, Math.exp(-decayRate * timeRatio)));
};

/**
 * Get comprehensive analytics for a word
 * @param word Vocabulary word
 * @param currentTime Current timestamp
 * @returns Word analytics object
 */
export const getWordAnalytics = (word: VocabWord, currentTime: number = Date.now()): WordAnalytics => {
  return {
    difficulty: calculateWordDifficulty(word),
    maturity: getWordMaturity(word),
    retentionProbability: calculateRetentionProbability(word, currentTime)
  };
};

// ===============================
// Prioritization & Sorting
// ===============================

/**
 * Calculate review priority score for a word
 * @param word Vocabulary word
 * @param currentTime Current timestamp
 * @returns Priority score (higher = more urgent)
 */
export const calculateReviewPriority = (word: VocabWord, currentTime: number = Date.now()): number => {
  const overdueDays = Math.max(0, (currentTime - word.nextReview) / (24 * 60 * 60 * 1000));
  const difficulty = calculateWordDifficulty(word);
  const retentionProb = calculateRetentionProbability(word, currentTime);
  const maturity = getWordMaturity(word);
  
  // Base priority from how overdue the word is
  let priority = overdueDays * 10;
  
  // Boost priority for difficult words
  priority += difficulty * 50;
  
  // Boost priority for words with low retention probability
  priority += (1 - retentionProb) * 30;
  
  // Adjust based on maturity (new words get higher priority)
  const maturityMultiplier = {
    'new': 1.5,
    'learning': 1.3,
    'young': 1.1,
    'mature': 1.0
  };
  priority *= maturityMultiplier[maturity];
  
  return priority;
};

/**
 * Prioritize words for review based on urgency and difficulty
 * @param words Array of due words
 * @param currentTime Current timestamp
 * @returns Sorted array with highest priority first
 */
export const prioritizeWordsForReview = (words: VocabWord[], currentTime: number = Date.now()): VocabWord[] => {
  return words
    .map(word => ({
      word,
      priority: calculateReviewPriority(word, currentTime)
    }))
    .sort((a, b) => b.priority - a.priority)
    .map(item => item.word);
};

// ===============================
// Session Optimization
// ===============================

/**
 * Get optimal review session size based on available words and user performance
 * @param availableWords Number of words available for review
 * @param userAccuracy Recent accuracy (0-1)
 * @param maxSessionSize Maximum desired session size
 * @returns Recommended session size
 */
export const getOptimalSessionSize = (
  availableWords: number, 
  userAccuracy: number = 0.8, 
  maxSessionSize: number = 20
): number => {
  // Base size on accuracy - lower accuracy = smaller sessions
  let baseSize = Math.round(maxSessionSize * (0.5 + userAccuracy * 0.5));
  
  // Ensure we don't exceed available words
  const optimalSize = Math.min(baseSize, availableWords, maxSessionSize);
  
  // Minimum session size of 5 (if available)
  return Math.max(1, Math.min(optimalSize, Math.max(5, Math.floor(availableWords * 0.3))));
};

// ===============================
// Validation & Utility Functions
// ===============================

/**
 * Validate quality rating (0-5)
 * @param quality Quality rating to validate
 * @returns Whether quality is valid
 */
export const isValidQuality = (quality: any): quality is QualityRating => {
  return typeof quality === 'number' && quality >= 0 && quality <= 5;
};

/**
 * Check if quality requires retry (retype the word)
 * @param quality Quality rating
 * @returns Whether retry is required for low quality words
 */
export const requiresRetry = (quality: QualityRating): boolean => {
  // Require retry for quality 0, 1, 2 (failed or difficult words)
  return quality <= 2;
};

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