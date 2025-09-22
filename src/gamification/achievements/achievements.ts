import { 
  Achievement, 
  AchievementDefinition, 
  AchievementCategory, 
  AchievementRarity,
  GamificationAnalysisData 
} from '../core/types';

/**
 * Achievement definitions with unlock conditions
 */
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Word Count Achievements
  {
    id: 'first_word',
    icon: '🌱',
    name: 'First Step',
    description: 'Added your first word to the dictionary',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.COMMON,
    points: 10,
    checkUnlocked: (data) => data.totalWords >= 1
  },
  {
    id: 'early_bird',
    icon: '🐣',
    name: 'Early Bird',
    description: 'Collected 5 words',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.COMMON,
    points: 15,
    checkUnlocked: (data) => data.totalWords >= 5
  },
  {
    id: 'bookworm',
    icon: '📚',
    name: 'Bookworm',
    description: 'Collected 10 words',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.COMMON,
    points: 25,
    checkUnlocked: (data) => data.totalWords >= 10
  },
  {
    id: 'word_collector',
    icon: '📝',
    name: 'Word Collector',
    description: 'Built a collection of 25 words',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.COMMON,
    points: 40,
    checkUnlocked: (data) => data.totalWords >= 25
  },
  {
    id: 'vocabulary_builder',
    icon: '🏆',
    name: 'Vocabulary Builder',
    description: 'Built a vocabulary of 50 words',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.UNCOMMON,
    points: 50,
    checkUnlocked: (data) => data.totalWords >= 50
  },
  {
    id: 'dedicated_learner',
    icon: '💪',
    name: 'Dedicated Learner',
    description: 'Mastered 75 words',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.UNCOMMON,
    points: 75,
    checkUnlocked: (data) => data.totalWords >= 75
  },
  {
    id: 'scholar',
    icon: '🎓',
    name: 'Scholar',
    description: 'Mastered 100 words',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.RARE,
    points: 100,
    checkUnlocked: (data) => data.totalWords >= 100
  },
  {
    id: 'word_enthusiast',
    icon: '📖',
    name: 'Word Enthusiast',
    description: 'Conquered 150 words',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.RARE,
    points: 150,
    checkUnlocked: (data) => data.totalWords >= 150
  },
  {
    id: 'vocabulary_expert',
    icon: '🧠',
    name: 'Vocabulary Expert',
    description: 'Conquered 200 words',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.RARE,
    points: 200,
    checkUnlocked: (data) => data.totalWords >= 200
  },
  {
    id: 'word_master',
    icon: '👑',
    name: 'Word Master',
    description: 'Conquered 250 words',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.EPIC,
    points: 250,
    checkUnlocked: (data) => data.totalWords >= 250
  },
  {
    id: 'vocabulary_legend',
    icon: '⚡',
    name: 'Vocabulary Legend',
    description: 'Achieved legendary status with 500 words',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.LEGENDARY,
    points: 500,
    checkUnlocked: (data) => data.totalWords >= 500
  },
  
  // Streak Achievements
  {
    id: 'on_fire',
    icon: '🔥',
    name: 'On Fire',
    description: '3-day learning streak',
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.COMMON,
    points: 30,
    checkUnlocked: (data) => data.currentStreak >= 3
  },
  {
    id: 'week_warrior',
    icon: '⭐',
    name: 'Week Warrior',
    description: '7-day learning streak',
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.UNCOMMON,
    points: 70,
    checkUnlocked: (data) => data.currentStreak >= 7
  },
  {
    id: 'diamond_dedication',
    icon: '💎',
    name: 'Diamond Dedication',
    description: '30-day learning streak',
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.EPIC,
    points: 300,
    checkUnlocked: (data) => data.currentStreak >= 30
  },
  {
    id: 'centurion',
    icon: '🌟',
    name: 'Centurion',
    description: '100-day learning streak',
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.LEGENDARY,
    points: 1000,
    checkUnlocked: (data) => data.currentStreak >= 100
  },
  
  // Accuracy Achievements
  {
    id: 'sharp_shooter',
    icon: '🎯',
    name: 'Sharp Shooter',
    description: '70% accuracy achieved (min 10 words)',
    category: AchievementCategory.ACCURACY,
    rarity: AchievementRarity.UNCOMMON,
    points: 70,
    checkUnlocked: (data) => data.accuracy >= 70 && data.totalWords >= 10
  },
  {
    id: 'precision_master',
    icon: '🏹',
    name: 'Precision Master',
    description: '85% accuracy achieved (min 25 words)',
    category: AchievementCategory.ACCURACY,
    rarity: AchievementRarity.RARE,
    points: 150,
    checkUnlocked: (data) => data.accuracy >= 85 && data.totalWords >= 25
  },
  {
    id: 'perfect_precision',
    icon: '🔍',
    name: 'Perfect Precision',
    description: '95% accuracy achieved (min 50 words)',
    category: AchievementCategory.ACCURACY,
    rarity: AchievementRarity.EPIC,
    points: 300,
    checkUnlocked: (data) => data.accuracy >= 95 && data.totalWords >= 50
  },
  
  // Study Time Achievements
  {
    id: 'time_keeper',
    icon: '⏰',
    name: 'Time Keeper',
    description: 'Studied for 1 hour total',
    category: AchievementCategory.TIME,
    rarity: AchievementRarity.COMMON,
    points: 60,
    checkUnlocked: (data) => {
      // Safety check for totalStudyTime
      if (!data.totalStudyTime || data.totalStudyTime <= 0) return false;
      const studyHours = Math.floor(data.totalStudyTime / (1000 * 60 * 60));
      return studyHours >= 1;
    }
  },
  {
    id: 'dedicated_learner',
    icon: '📖',
    name: 'Dedicated Learner',
    description: '10 hours of study time',
    category: AchievementCategory.TIME,
    rarity: AchievementRarity.UNCOMMON,
    points: 200,
    checkUnlocked: (data) => {
      // Safety check for totalStudyTime
      if (!data.totalStudyTime || data.totalStudyTime <= 0) return false;
      const studyHours = Math.floor(data.totalStudyTime / (1000 * 60 * 60));
      return studyHours >= 10;
    }
  },
  {
    id: 'brain_trainer',
    icon: '🧠',
    name: 'Brain Trainer',
    description: '50 hours of study time',
    category: AchievementCategory.TIME,
    rarity: AchievementRarity.EPIC,
    points: 500,
    checkUnlocked: (data) => {
      // Safety check for totalStudyTime
      if (!data.totalStudyTime || data.totalStudyTime <= 0) return false;
      const studyHours = Math.floor(data.totalStudyTime / (1000 * 60 * 60));
      return studyHours >= 50;
    }
  },
  
  // Special Achievements
  {
    id: 'review_master',
    icon: '🎪',
    name: 'Review Master',
    description: '20 words in review phase',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.RARE,
    points: 100,
    checkUnlocked: (data) => {
      // Safety check for wordDistribution
      return data.wordDistribution && data.wordDistribution.review >= 20;
    }
  },
  {
    id: 'weekly_champion',
    icon: '💪',
    name: 'Weekly Champion',
    description: 'Studied 30+ words this week',
    category: AchievementCategory.WEEKLY,
    rarity: AchievementRarity.UNCOMMON,
    points: 80,
    checkUnlocked: (data) => {
      // Safety checks
      if (!data.weeklyProgress || data.weeklyProgress.length === 0) return false;
      const weeklyWordsCount = data.weeklyProgress.reduce((sum, day) => sum + (day.words || 0), 0);
      return weeklyWordsCount >= 30;
    }
  }
];

/**
 * Generate achievements based on user progress
 * @param data Gamification analysis data
 * @returns Array of achievements with unlock status
 */
export const generateAchievements = (data: GamificationAnalysisData): Achievement[] => {
  return ACHIEVEMENT_DEFINITIONS.map(definition => ({
    icon: definition.icon,
    name: definition.name,
    description: definition.description,
    unlocked: definition.checkUnlocked(data),
    category: definition.category,
    rarity: definition.rarity,
    points: definition.points
  }));
};

/**
 * Get unlocked achievements
 * @param achievements Array of achievements
 * @returns Array of unlocked achievements
 */
export const getUnlockedAchievements = (achievements: Achievement[]): Achievement[] => {
  return achievements.filter(achievement => achievement.unlocked);
};

/**
 * Get achievements by category
 * @param achievements Array of achievements
 * @param category Achievement category
 * @returns Filtered achievements
 */
export const getAchievementsByCategory = (
  achievements: Achievement[], 
  category: AchievementCategory
): Achievement[] => {
  return achievements.filter(achievement => achievement.category === category);
};

/**
 * Get next milestone achievement (closest unlockable achievement)
 * @param data Gamification analysis data
 * @returns Next achievement to unlock or null
 */
export const getNextMilestone = (data: GamificationAnalysisData): Achievement | null => {
  const lockedAchievements = ACHIEVEMENT_DEFINITIONS
    .filter(def => !def.checkUnlocked(data))
    .map(def => ({
      icon: def.icon,
      name: def.name,
      description: def.description,
      unlocked: false,
      category: def.category,
      rarity: def.rarity,
      points: def.points
    }));

  if (lockedAchievements.length === 0) return null;

  // Sort by points (assuming lower points = easier to achieve)
  return lockedAchievements.sort((a, b) => a.points - b.points)[0];
};

/**
 * Calculate total points from achievements
 * @param achievements Array of achievements
 * @returns Total points earned
 */
export const calculateAchievementPoints = (achievements: Achievement[]): number => {
  return achievements
    .filter(achievement => achievement.unlocked)
    .reduce((total, achievement) => total + achievement.points, 0);
};

/**
 * Get achievement statistics
 * @param achievements Array of achievements
 * @returns Achievement statistics
 */
export const getAchievementStats = (achievements: Achievement[]) => {
  const unlocked = getUnlockedAchievements(achievements);
  const total = achievements.length;
  const completionRate = total > 0 ? Math.round((unlocked.length / total) * 100) : 0;
  const totalPoints = calculateAchievementPoints(achievements);

  return {
    unlocked: unlocked.length,
    total,
    completionRate,
    totalPoints,
    byCategory: {
      [AchievementCategory.WORDS]: getAchievementsByCategory(unlocked, AchievementCategory.WORDS).length,
      [AchievementCategory.STREAK]: getAchievementsByCategory(unlocked, AchievementCategory.STREAK).length,
      [AchievementCategory.ACCURACY]: getAchievementsByCategory(unlocked, AchievementCategory.ACCURACY).length,
      [AchievementCategory.TIME]: getAchievementsByCategory(unlocked, AchievementCategory.TIME).length,
      [AchievementCategory.SPECIAL]: getAchievementsByCategory(unlocked, AchievementCategory.SPECIAL).length,
      [AchievementCategory.WEEKLY]: getAchievementsByCategory(unlocked, AchievementCategory.WEEKLY).length
    }
  };
};