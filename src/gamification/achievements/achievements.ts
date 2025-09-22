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
  
  // Advanced Word Count Achievements (500-3000+)
  {
    id: 'vocabulary_titan',
    icon: '🏛️',
    name: 'Vocabulary Titan',
    description: 'Mastered 750 words - reaching intermediate level',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.LEGENDARY,
    points: 750,
    checkUnlocked: (data) => data.totalWords >= 750
  },
  {
    id: 'millennium_master',
    icon: '🌟',
    name: 'Millennium Master',
    description: 'Conquered 1000 words - true milestone!',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.LEGENDARY,
    points: 1000,
    checkUnlocked: (data) => data.totalWords >= 1000
  },
  {
    id: 'intermediate_scholar',
    icon: '🎯',
    name: 'Intermediate Scholar',
    description: 'Achieved 1250 words - solid intermediate level',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.LEGENDARY,
    points: 1250,
    checkUnlocked: (data) => data.totalWords >= 1250
  },
  {
    id: 'vocabulary_sage',
    icon: '🧙‍♂️',
    name: 'Vocabulary Sage',
    description: 'Mastered 1500 words - approaching advanced level',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.MYTHIC,
    points: 1500,
    checkUnlocked: (data) => data.totalWords >= 1500
  },
  {
    id: 'word_wizard',
    icon: '🔮',
    name: 'Word Wizard',
    description: 'Enchanted with 1750 words - magical achievement!',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.MYTHIC,
    points: 1750,
    checkUnlocked: (data) => data.totalWords >= 1750
  },
  {
    id: 'vocabulary_grandmaster',
    icon: '👑',
    name: 'Vocabulary Grandmaster',
    description: 'Conquered 2000 words - advanced English level!',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.MYTHIC,
    points: 2000,
    checkUnlocked: (data) => data.totalWords >= 2000
  },
  {
    id: 'english_scholar',
    icon: '🎓',
    name: 'English Scholar',
    description: 'Mastered 2250 words - academic excellence',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.MYTHIC,
    points: 2250,
    checkUnlocked: (data) => data.totalWords >= 2250
  },
  {
    id: 'linguistic_prodigy',
    icon: '🌈',
    name: 'Linguistic Prodigy',
    description: 'Achieved 2500 words - exceptional vocabulary',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.MYTHIC,
    points: 2500,
    checkUnlocked: (data) => data.totalWords >= 2500
  },
  {
    id: 'vocabulary_deity',
    icon: '✨',
    name: 'Vocabulary Deity',
    description: 'Transcended with 3000 words - divine mastery!',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.DIVINE,
    points: 3000,
    checkUnlocked: (data) => data.totalWords >= 3000
  },
  {
    id: 'ultimate_wordsmith',
    icon: '🌌',
    name: 'Ultimate Wordsmith',
    description: 'Beyond mortal limits - 4000 words conquered!',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.DIVINE,
    points: 4000,
    checkUnlocked: (data) => data.totalWords >= 4000
  },
  {
    id: 'vocabulary_immortal',
    icon: '🔥',
    name: 'Vocabulary Immortal',
    description: 'Legendary status - 5000 words mastered!',
    category: AchievementCategory.WORDS,
    rarity: AchievementRarity.DIVINE,
    points: 5000,
    checkUnlocked: (data) => data.totalWords >= 5000
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
    id: 'fortnight_fighter',
    icon: '🛡️',
    name: 'Fortnight Fighter',
    description: '14-day learning streak',
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.RARE,
    points: 140,
    checkUnlocked: (data) => data.currentStreak >= 14
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
    id: 'quarterly_champion',
    icon: '🏆',
    name: 'Quarterly Champion',
    description: '90-day learning streak',
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.LEGENDARY,
    points: 900,
    checkUnlocked: (data) => data.currentStreak >= 90
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
  {
    id: 'half_year_hero',
    icon: '🌞',
    name: 'Half Year Hero',
    description: '180-day learning streak - incredible dedication!',
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.MYTHIC,
    points: 1800,
    checkUnlocked: (data) => data.currentStreak >= 180
  },
  {
    id: 'year_long_legend',
    icon: '🎆',
    name: 'Year-Long Legend',
    description: '365-day learning streak - unstoppable force!',
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.DIVINE,
    points: 3650,
    checkUnlocked: (data) => data.currentStreak >= 365
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
  {
    id: 'flawless_performer',
    icon: '💯',
    name: 'Flawless Performer',
    description: '90% accuracy with 100+ words - consistent excellence',
    category: AchievementCategory.ACCURACY,
    rarity: AchievementRarity.LEGENDARY,
    points: 450,
    checkUnlocked: (data) => data.accuracy >= 90 && data.totalWords >= 100
  },
  {
    id: 'accuracy_virtuoso',
    icon: '🎼',
    name: 'Accuracy Virtuoso',
    description: '92% accuracy with 250+ words - masterful precision',
    category: AchievementCategory.ACCURACY,
    rarity: AchievementRarity.LEGENDARY,
    points: 600,
    checkUnlocked: (data) => data.accuracy >= 92 && data.totalWords >= 250
  },
  {
    id: 'precision_perfectionist',
    icon: '⚡',
    name: 'Precision Perfectionist',
    description: '94% accuracy with 500+ words - near perfection',
    category: AchievementCategory.ACCURACY,
    rarity: AchievementRarity.MYTHIC,
    points: 940,
    checkUnlocked: (data) => data.accuracy >= 94 && data.totalWords >= 500
  },
  {
    id: 'accuracy_god',
    icon: '✨',
    name: 'Accuracy God',
    description: '96% accuracy with 1000+ words - divine precision!',
    category: AchievementCategory.ACCURACY,
    rarity: AchievementRarity.DIVINE,
    points: 1920,
    checkUnlocked: (data) => data.accuracy >= 96 && data.totalWords >= 1000
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
    id: 'dedicated_student',
    icon: '📖',
    name: 'Dedicated Student',
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
    id: 'study_marathon',
    icon: '🏃‍♂️',
    name: 'Study Marathon',
    description: '25 hours of focused learning',
    category: AchievementCategory.TIME,
    rarity: AchievementRarity.RARE,
    points: 375,
    checkUnlocked: (data) => {
      if (!data.totalStudyTime || data.totalStudyTime <= 0) return false;
      const studyHours = Math.floor(data.totalStudyTime / (1000 * 60 * 60));
      return studyHours >= 25;
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
  {
    id: 'century_scholar',
    icon: '💯',
    name: 'Century Scholar',
    description: '100 hours of dedicated learning',
    category: AchievementCategory.TIME,
    rarity: AchievementRarity.LEGENDARY,
    points: 1000,
    checkUnlocked: (data) => {
      if (!data.totalStudyTime || data.totalStudyTime <= 0) return false;
      const studyHours = Math.floor(data.totalStudyTime / (1000 * 60 * 60));
      return studyHours >= 100;
    }
  },
  {
    id: 'academic_champion',
    icon: '🏆',
    name: 'Academic Champion',
    description: '200 hours of intensive study',
    category: AchievementCategory.TIME,
    rarity: AchievementRarity.LEGENDARY,
    points: 2000,
    checkUnlocked: (data) => {
      if (!data.totalStudyTime || data.totalStudyTime <= 0) return false;
      const studyHours = Math.floor(data.totalStudyTime / (1000 * 60 * 60));
      return studyHours >= 200;
    }
  },
  {
    id: 'time_master',
    icon: '⌛',
    name: 'Time Master',
    description: '500 hours of mastery pursuit',
    category: AchievementCategory.TIME,
    rarity: AchievementRarity.MYTHIC,
    points: 5000,
    checkUnlocked: (data) => {
      if (!data.totalStudyTime || data.totalStudyTime <= 0) return false;
      const studyHours = Math.floor(data.totalStudyTime / (1000 * 60 * 60));
      return studyHours >= 500;
    }
  },
  {
    id: 'eternal_learner',
    icon: '🌌',
    name: 'Eternal Learner',
    description: '1000 hours - true dedication to mastery!',
    category: AchievementCategory.TIME,
    rarity: AchievementRarity.DIVINE,
    points: 10000,
    checkUnlocked: (data) => {
      if (!data.totalStudyTime || data.totalStudyTime <= 0) return false;
      const studyHours = Math.floor(data.totalStudyTime / (1000 * 60 * 60));
      return studyHours >= 1000;
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
    id: 'retention_expert',
    icon: '🧪',
    name: 'Retention Expert',
    description: '50 words mastered in review phase',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.EPIC,
    points: 250,
    checkUnlocked: (data) => {
      return data.wordDistribution && data.wordDistribution.review >= 50;
    }
  },
  {
    id: 'memory_champion',
    icon: '🏅',
    name: 'Memory Champion',
    description: '100 words mastered in review phase',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.LEGENDARY,
    points: 500,
    checkUnlocked: (data) => {
      return data.wordDistribution && data.wordDistribution.review >= 100;
    }
  },
  {
    id: 'vocabulary_architect',
    icon: '🏗️',
    name: 'Vocabulary Architect',
    description: '500 words actively being learned',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.MYTHIC,
    points: 750,
    checkUnlocked: (data) => {
      return data.wordDistribution && data.wordDistribution.learning >= 500;
    }
  },
  {
    id: 'english_polymath',
    icon: '🎭',
    name: 'English Polymath',
    description: 'Master 1000+ words with 90%+ accuracy',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.MYTHIC,
    points: 1500,
    checkUnlocked: (data) => data.totalWords >= 1000 && data.accuracy >= 90
  },
  {
    id: 'linguistic_savant',
    icon: '🎯',
    name: 'Linguistic Savant',
    description: '2000+ words with 92%+ accuracy and 90+ day streak',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.DIVINE,
    points: 3000,
    checkUnlocked: (data) => 
      data.totalWords >= 2000 && 
      data.accuracy >= 92 && 
      data.currentStreak >= 90
  },
  {
    id: 'vocabulary_overlord',
    icon: '👑',
    name: 'Vocabulary Overlord',
    description: 'Ultimate achievement: 3000+ words, 95%+ accuracy, 180+ day streak',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.DIVINE,
    points: 5000,
    checkUnlocked: (data) => 
      data.totalWords >= 3000 && 
      data.accuracy >= 95 && 
      data.currentStreak >= 180
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
  },
  {
    id: 'weekly_warrior',
    icon: '⚔️',
    name: 'Weekly Warrior',
    description: '50+ words learned this week',
    category: AchievementCategory.WEEKLY,
    rarity: AchievementRarity.RARE,
    points: 150,
    checkUnlocked: (data) => {
      if (!data.weeklyProgress || data.weeklyProgress.length === 0) return false;
      const weeklyWordsCount = data.weeklyProgress.reduce((sum, day) => sum + (day.words || 0), 0);
      return weeklyWordsCount >= 50;
    }
  },
  {
    id: 'weekly_legend',
    icon: '🌟',
    name: 'Weekly Legend',
    description: '100+ words conquered this week!',
    category: AchievementCategory.WEEKLY,
    rarity: AchievementRarity.EPIC,
    points: 300,
    checkUnlocked: (data) => {
      if (!data.weeklyProgress || data.weeklyProgress.length === 0) return false;
      const weeklyWordsCount = data.weeklyProgress.reduce((sum, day) => sum + (day.words || 0), 0);
      return weeklyWordsCount >= 100;
    }
  },
  {
    id: 'weekly_overlord',
    icon: '🔥',
    name: 'Weekly Overlord',
    description: '200+ words mastered this week - incredible pace!',
    category: AchievementCategory.WEEKLY,
    rarity: AchievementRarity.LEGENDARY,
    points: 500,
    checkUnlocked: (data) => {
      if (!data.weeklyProgress || data.weeklyProgress.length === 0) return false;
      const weeklyWordsCount = data.weeklyProgress.reduce((sum, day) => sum + (day.words || 0), 0);
      return weeklyWordsCount >= 200;
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