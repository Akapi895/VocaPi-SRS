import { UserRank, GamificationAnalysisData } from '../core/types';

/**
 * Rank definitions based on total words and other criteria
 */
export const RANK_DEFINITIONS: UserRank[] = [
  {
    name: 'Beginner',
    icon: '🌱',
    color: 'text-green-600',
    minWords: 0,
    maxWords: 9
  },
  {
    name: 'Learner',
    icon: '📚',
    color: 'text-blue-600',
    minWords: 10,
    maxWords: 49
  },
  {
    name: 'Scholar',
    icon: '🎓',
    color: 'text-purple-600',
    minWords: 50,
    maxWords: 99
  },
  {
    name: 'Expert',
    icon: '🏆',
    color: 'text-yellow-600',
    minWords: 100,
    maxWords: 249
  },
  {
    name: 'Master',
    icon: '👑',
    color: 'text-orange-600',
    minWords: 250,
    maxWords: 499
  },
  {
    name: 'Legend',
    icon: '⚡',
    color: 'text-red-600',
    minWords: 500
  }
];

/**
 * Special ranks based on achievements and performance
 */
export const SPECIAL_RANKS: UserRank[] = [
  {
    name: 'Perfectionist',
    icon: '💎',
    color: 'text-cyan-600',
    minWords: 50 // Requires 95%+ accuracy
  },
  {
    name: 'Marathon Runner',
    icon: '🏃',
    color: 'text-indigo-600',
    minWords: 30 // Requires 30+ day streak
  },
  {
    name: 'Speed Demon',
    icon: '⚡',
    color: 'text-yellow-500',
    minWords: 100 // Fast learning rate
  },
  {
    name: 'Consistent',
    icon: '📈',
    color: 'text-green-500',
    minWords: 50 // Regular daily practice
  },
  {
    name: 'Night Owl',
    icon: '🦉',
    color: 'text-purple-600',
    minWords: 30 // Most active late at night
  },
  {
    name: 'Early Riser',
    icon: '🌅',
    color: 'text-orange-400',
    minWords: 30 // Most active in early morning
  },
  {
    name: 'Comeback King',
    icon: '👑',
    color: 'text-red-500',
    minWords: 50 // Bounced back from low accuracy
  },
  {
    name: 'Quality Focus',
    icon: '🎯',
    color: 'text-blue-600',
    minWords: 40 // High accuracy with decent volume
  }
];

/**
 * Get user rank based on total words
 * @param totalWords Total number of vocabulary words
 * @returns User rank information
 */
export const getUserRank = (totalWords: number): UserRank => {
  // Safety check
  if (totalWords < 0) totalWords = 0;
  
  // Find the appropriate rank based on word count
  // Start from highest rank and work down for efficiency
  for (const rank of RANK_DEFINITIONS) {
    const meetsMin = totalWords >= rank.minWords;
    const meetsMax = rank.maxWords === undefined || totalWords <= rank.maxWords;
    
    if (meetsMin && meetsMax) {
      return rank;
    }
  }
  
  // If no match found (shouldn't happen), return highest rank for very high word counts
  return RANK_DEFINITIONS[RANK_DEFINITIONS.length - 1];
};

/**
 * Get special rank based on performance metrics
 * @param data Gamification analysis data
 * @returns Special rank or null if no special rank achieved
 */
export const getSpecialRank = (data: GamificationAnalysisData): UserRank | null => {
  // Safety checks
  if (!data || data.totalWords < 0) return null;
  
  // Check for Perfectionist (95%+ accuracy with sufficient words)
  if (data.accuracy >= 95 && data.totalWords >= 50) {
    return SPECIAL_RANKS.find(rank => rank.name === 'Perfectionist') || null;
  }
  
  // Check for Marathon Runner (30+ day streak)
  if (data.currentStreak >= 30 && data.totalWords >= 30) {
    return SPECIAL_RANKS.find(rank => rank.name === 'Marathon Runner') || null;
  }
  
  // Check for Speed Demon (fast learning rate: >20 words per week average)
  if (data.weeklyProgress && data.weeklyProgress.length > 0) {
    const weeklyAdded = data.weeklyProgress.reduce((sum, day) => sum + (day.added || 0), 0);
    if (weeklyAdded >= 20 && data.totalWords >= 100) {
      return SPECIAL_RANKS.find(rank => rank.name === 'Speed Demon') || null;
    }
  }
  
  // Check for Consistent (daily practice pattern)
  if (data.weeklyProgress && data.weeklyProgress.length > 0) {
    const activeDays = data.weeklyProgress.filter(day => (day.words || 0) > 0).length;
    if (activeDays >= 5 && data.totalWords >= 50) {
      return SPECIAL_RANKS.find(rank => rank.name === 'Consistent') || null;
    }
  }
  
  return null;
};

/**
 * Get the best rank (primary or special) for the user
 * @param data Gamification analysis data
 * @returns Best applicable rank
 */
export const getBestRank = (data: GamificationAnalysisData): UserRank => {
  const primaryRank = getUserRank(data.totalWords);
  const specialRank = getSpecialRank(data);
  
  // Return special rank if achieved, otherwise primary rank
  return specialRank || primaryRank;
};

/**
 * Get next rank requirements
 * @param currentRank Current user rank
 * @returns Next rank and requirements
 */
export const getNextRankRequirements = (currentRank: UserRank): {
  nextRank: UserRank | null;
  wordsNeeded: number;
  requirements: string[];
} => {
  const currentIndex = RANK_DEFINITIONS.findIndex(rank => rank.name === currentRank.name);
  
  if (currentIndex === -1 || currentIndex === RANK_DEFINITIONS.length - 1) {
    return {
      nextRank: null,
      wordsNeeded: 0,
      requirements: ['You have reached the highest rank!']
    };
  }
  
  const nextRank = RANK_DEFINITIONS[currentIndex + 1];
  const wordsNeeded = Math.max(0, nextRank.minWords - (currentRank.maxWords || 0) - 1);
  
  const requirements = [`Add ${wordsNeeded} more words to reach ${nextRank.name}`];
  
  return {
    nextRank,
    wordsNeeded,
    requirements
  };
};

/**
 * Get rank progress percentage
 * @param totalWords Current total words
 * @param currentRank Current rank
 * @returns Progress percentage to next rank
 */
export const getRankProgress = (totalWords: number, currentRank: UserRank): number => {
  if (!currentRank.maxWords) {
    return 100; // Max rank achieved
  }
  
  const progress = ((totalWords - currentRank.minWords) / (currentRank.maxWords - currentRank.minWords)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

/**
 * Get all available ranks for display
 * @returns Array of all rank definitions
 */
export const getAllRanks = (): UserRank[] => {
  return [...RANK_DEFINITIONS];
};

/**
 * Get special ranks requirements
 * @returns Object with special rank requirements
 */
export const getSpecialRankRequirements = () => {
  return {
    perfectionist: {
      name: 'Perfectionist',
      requirements: ['Achieve 95%+ accuracy', 'Have at least 50 words'],
      icon: '💎',
      description: 'Master of precision in vocabulary learning'
    },
    marathonRunner: {
      name: 'Marathon Runner',
      requirements: ['Maintain 30+ day streak', 'Have at least 30 words'],
      icon: '🏃',
      description: 'Consistent long-term learner'
    },
    speedDemon: {
      name: 'Speed Demon',
      requirements: ['Learn 20+ words per week', 'Have at least 100 words'],
      icon: '⚡',
      description: 'Fast and efficient learner'
    },
    consistent: {
      name: 'Consistent',
      requirements: ['Practice 5+ days per week', 'Have at least 50 words'],
      icon: '📈',
      description: 'Regular and steady learner'
    }
  };
};

/**
 * Calculate rank score for leaderboard purposes
 * @param data Gamification analysis data
 * @returns Numeric score for ranking
 */
export const calculateRankScore = (data: GamificationAnalysisData): number => {
  // Safety checks
  if (!data) return 0;
  
  const baseScore = (data.totalWords || 0) * 10;
  const accuracyBonus = (data.accuracy || 0) * 5;
  const streakBonus = (data.currentStreak || 0) * 20;
  const reviewBonus = (data.wordDistribution?.review || 0) * 15;
  
  return Math.floor(baseScore + accuracyBonus + streakBonus + reviewBonus);
};

/**
 * Format rank display with icon and color
 * @param rank User rank
 * @returns Formatted rank display
 */
export const formatRankDisplay = (rank: UserRank): string => {
  return `${rank.icon} ${rank.name}`;
};