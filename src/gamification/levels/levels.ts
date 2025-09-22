import { LevelProgress, GamificationAnalysisData } from '../core/types';
import { GamificationData } from '@/types';

/**
 * Level configuration
 */
export interface LevelConfig {
  level: number;
  xpRequired: number;
  title: string;
  icon: string;
  color: string;
  benefits: string[];
}

/**
 * Level definitions with XP requirements and benefits
 */
export const LEVEL_DEFINITIONS: LevelConfig[] = [
  {
    level: 1,
    xpRequired: 0,
    title: 'Beginner',
    icon: '🌱',
    color: 'text-green-500',
    benefits: ['Basic vocabulary tracking', 'Simple review system']
  },
  {
    level: 2,
    xpRequired: 100,
    title: 'Novice',
    icon: '📖',
    color: 'text-blue-500',
    benefits: ['Achievement tracking', 'Basic statistics']
  },
  {
    level: 3,
    xpRequired: 250,
    title: 'Learner',
    icon: '📝',
    color: 'text-green-600',
    benefits: ['Word difficulty insights', 'Progress tracking']
  },
  {
    level: 5,
    xpRequired: 500,
    title: 'Student',
    icon: '🎓',
    color: 'text-purple-500',
    benefits: ['Advanced review options', 'Study pattern insights']
  },
  {
    level: 7,
    xpRequired: 800,
    title: 'Dedicated',
    icon: '📚',
    color: 'text-blue-600',
    benefits: ['Weekly challenges', 'Performance analytics']
  },
  {
    level: 10,
    xpRequired: 1500,
    title: 'Scholar',
    icon: '🏅',
    color: 'text-indigo-500',
    benefits: ['Custom difficulty settings', 'Export/Import data']
  },
  {
    level: 15,
    xpRequired: 3000,
    title: 'Expert',
    icon: '🏆',
    color: 'text-yellow-500',
    benefits: ['Advanced analytics', 'Performance optimization']
  },
  {
    level: 20,
    xpRequired: 5000,
    title: 'Master',
    icon: '👑',
    color: 'text-orange-500',
    benefits: ['AI-powered suggestions', 'Advanced gamification']
  },
  {
    level: 25,
    xpRequired: 7500,
    title: 'Sage',
    icon: '🔮',
    color: 'text-purple-600',
    benefits: ['Predictive analytics', 'Learning optimization']
  },
  {
    level: 30,
    xpRequired: 10000,
    title: 'Grandmaster',
    icon: '⚡',
    color: 'text-red-500',
    benefits: ['Premium features', 'Exclusive achievements']
  },
  {
    level: 40,
    xpRequired: 15000,
    title: 'Virtuoso',
    icon: '🌟',
    color: 'text-yellow-400',
    benefits: ['Elite status', 'Community features']
  },
  {
    level: 50,
    xpRequired: 25000,
    title: 'Legend',
    icon: '💫',
    color: 'text-pink-500',
    benefits: ['All features unlocked', 'Legendary status']
  }
];

/**
 * Calculate XP required for a specific level
 * @param level Target level
 * @returns XP required for the level
 */
export const getXPRequiredForLevel = (level: number): number => {
  if (level <= 1) return 0;
  
  // Find exact level definition first
  const exactLevelDef = LEVEL_DEFINITIONS.find(def => def.level === level);
  if (exactLevelDef) return exactLevelDef.xpRequired;
  
  // Find the closest lower level definition
  const lowerLevelDef = LEVEL_DEFINITIONS
    .filter(def => def.level < level)
    .sort((a, b) => b.level - a.level)[0];
  
  // Find the closest higher level definition
  const higherLevelDef = LEVEL_DEFINITIONS
    .filter(def => def.level > level)
    .sort((a, b) => a.level - b.level)[0];
  
  // Interpolate between levels if both exist
  if (lowerLevelDef && higherLevelDef) {
    const levelDiff = higherLevelDef.level - lowerLevelDef.level;
    const xpDiff = higherLevelDef.xpRequired - lowerLevelDef.xpRequired;
    const targetDiff = level - lowerLevelDef.level;
    
    return Math.floor(lowerLevelDef.xpRequired + (xpDiff * targetDiff / levelDiff));
  }
  
  // If only lower level exists, use moderate exponential growth
  if (lowerLevelDef) {
    const levelGap = level - lowerLevelDef.level;
    return Math.floor(lowerLevelDef.xpRequired * Math.pow(1.3, levelGap));
  }
  
  // For very early levels, use simple progression
  return Math.floor(level * level * 50);
};

/**
 * Get level configuration for a specific level
 * @param level Target level
 * @returns Level configuration
 */
export const getLevelConfig = (level: number): LevelConfig => {
  // Find exact level definition first
  const exactLevelDef = LEVEL_DEFINITIONS.find(def => def.level === level);
  if (exactLevelDef) return exactLevelDef;
  
  // Find the closest lower level definition for fallback
  const lowerLevelDef = LEVEL_DEFINITIONS
    .filter(def => def.level < level)
    .sort((a, b) => b.level - a.level)[0];
  
  if (lowerLevelDef) {
    // Create interpolated config based on lower level
    return {
      level,
      xpRequired: getXPRequiredForLevel(level),
      title: `Level ${level}`,
      icon: lowerLevelDef.icon, // Inherit icon from lower level
      color: lowerLevelDef.color, // Inherit color from lower level
      benefits: [`Unlock Level ${level} benefits`, ...lowerLevelDef.benefits]
    };
  }
  
  // Default config for very early levels
  return {
    level,
    xpRequired: getXPRequiredForLevel(level),
    title: `Level ${level}`,
    icon: '🎯',
    color: 'text-gray-500',
    benefits: [`Level ${level} achievements`, 'Continue your learning journey']
  };
};

/**
 * Calculate level progress from gamification data
 * @param gamification Gamification data
 * @param achievementPoints Points from achievements
 * @param analysisData Analysis data for XP calculation
 * @returns Level progress information
 */
export const calculateLevelProgress = (
  gamification?: GamificationData,
  achievementPoints: number = 0,
  analysisData?: GamificationAnalysisData
): LevelProgress => {
  // Calculate total XP from multiple sources
  const baseXP = gamification?.xp || 0;
  
  // Calculate activity-based XP if analysis data is available
  let activityXP = 0;
  if (analysisData) {
    const xpBreakdown = calculateXPBreakdown(analysisData);
    activityXP = xpBreakdown.total;
  }
  
  // Total XP = base XP + achievement points + activity XP (avoid double counting)
  const totalXP = Math.max(baseXP + achievementPoints, activityXP + achievementPoints);
  
  // Find current level more accurately
  let currentLevel = 1;
  
  // Sort levels to check from highest to lowest
  const sortedLevels = LEVEL_DEFINITIONS
    .map(def => def.level)
    .sort((a, b) => b - a);
  
  for (const level of sortedLevels) {
    const xpRequired = getXPRequiredForLevel(level);
    if (totalXP >= xpRequired) {
      currentLevel = level;
      break;
    }
  }
  
  // For levels between defined ones, check incrementally
  if (currentLevel < 50) { // Max defined level
    for (let level = currentLevel + 1; level <= 100; level++) {
      const xpRequired = getXPRequiredForLevel(level);
      if (totalXP >= xpRequired) {
        currentLevel = level;
      } else {
        break;
      }
    }
  }
  
  // Calculate progress to next level
  const nextLevel = currentLevel + 1;
  const xpForCurrentLevel = getXPRequiredForLevel(currentLevel);
  const xpForNextLevel = getXPRequiredForLevel(nextLevel);
  
  const progressXP = totalXP - xpForCurrentLevel;
  const neededXP = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = Math.min((progressXP / neededXP) * 100, 100);
  const remainingXP = Math.max(0, xpForNextLevel - totalXP);
  
  return {
    currentLevel,
    nextLevel,
    progressXP,
    neededXP,
    progressPercentage,
    remainingXP,
    totalXP
  };
};

/**
 * Calculate XP gained from various activities with performance bonuses
 * @param data Gamification analysis data
 * @returns XP breakdown with bonuses
 */
export const calculateXPBreakdown = (data: GamificationAnalysisData) => {
  const baseWordXP = data.totalWords * 10; // 10 XP per word
  const streakXP = data.currentStreak * 5; // 5 XP per day streak
  const baseAccuracyXP = Math.floor(data.accuracy * 2); // 2 XP per accuracy point
  const reviewXP = data.wordDistribution.review * 15; // 15 XP per reviewed word
  
  // Performance bonuses
  const accuracyBonus = data.accuracy >= 90 ? Math.floor(baseAccuracyXP * 0.5) : 0; // 50% bonus for 90%+ accuracy
  const streakBonus = data.currentStreak >= 7 ? Math.floor(streakXP * 0.3) : 0; // 30% bonus for week+ streak
  const consistencyBonus = data.weeklyProgress?.length >= 5 ? 
    Math.floor((baseWordXP + reviewXP) * 0.2) : 0; // 20% bonus for 5+ active days
  
  return {
    words: baseWordXP,
    streak: streakXP,
    accuracy: baseAccuracyXP,
    reviews: reviewXP,
    bonuses: {
      accuracy: accuracyBonus,
      streak: streakBonus,
      consistency: consistencyBonus,
      total: accuracyBonus + streakBonus + consistencyBonus
    },
    total: baseWordXP + streakXP + baseAccuracyXP + reviewXP + accuracyBonus + streakBonus + consistencyBonus
  };
};

/**
 * Get next level benefits
 * @param currentLevel Current user level
 * @returns Benefits for the next level
 */
export const getNextLevelBenefits = (currentLevel: number): string[] => {
  const nextLevel = currentLevel + 1;
  const nextLevelConfig = getLevelConfig(nextLevel);
  return nextLevelConfig.benefits;
};

/**
 * Check if user can access a feature based on level
 * @param userLevel Current user level
 * @param requiredLevel Required level for feature
 * @returns Whether user can access the feature
 */
export const canAccessFeature = (userLevel: number, requiredLevel: number): boolean => {
  return userLevel >= requiredLevel;
};

/**
 * Get level milestones (next significant level)
 * @param currentLevel Current user level
 * @returns Next milestone level
 */
export const getNextMilestone = (currentLevel: number): LevelConfig | null => {
  const nextMilestone = LEVEL_DEFINITIONS
    .filter(def => def.level > currentLevel)
    .sort((a, b) => a.level - b.level)[0];
  
  return nextMilestone || null;
};

/**
 * Format level display text
 * @param level Level number
 * @returns Formatted level text
 */
export const formatLevelDisplay = (level: number): string => {
  const config = getLevelConfig(level);
  return `${config.icon} ${config.title} (Level ${level})`;
};