// Main gamification system exports
export * from './core/types';
export * from './core/cache';

// Re-export with specific names to avoid conflicts
export {
  generateAchievements,
  getUnlockedAchievements,
  calculateAchievementPoints,
  getAchievementStats,
  getNextMilestone as getNextAchievementMilestone
} from './achievements/achievements';

export {
  calculateLevelProgress,
  getLevelConfig,
  getNextLevelBenefits,
  canAccessFeature,
  formatLevelDisplay,
  getNextMilestone as getNextLevelMilestone
} from './levels/levels';

export {
  getUserRank,
  getBestRank,
  getSpecialRank,
  getNextRankRequirements,
  calculateRankScore,
  formatRankDisplay
} from './rankings/rankings';

// Main gamification service
import { GamificationAnalysisData, GamificationSummary } from './core/types';
import { getGamificationSummaryWithCache } from './core/cache';
import { generateAchievements, calculateAchievementPoints, getNextMilestone } from './achievements/achievements';
import { calculateLevelProgress } from './levels/levels';
import { getBestRank } from './rankings/rankings';

/**
 * Internal function to generate gamification summary
 */
const generateGamificationSummary = (data: GamificationAnalysisData): GamificationSummary => {
  const achievements = generateAchievements(data);
  const achievementPoints = calculateAchievementPoints(achievements);
  const levelProgress = calculateLevelProgress(data.gamification, achievementPoints, data);
  const userRank = getBestRank(data);
  const nextMilestone = getNextMilestone(data);
  
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const totalAchievements = achievements.length;
  
  return {
    achievements,
    levelProgress,
    userRank,
    totalPoints: achievementPoints,
    unlockedAchievements,
    totalAchievements,
    nextMilestone
  };
};

/**
 * Get comprehensive gamification summary with caching
 * @param data Gamification analysis data
 * @returns Complete gamification summary
 */
export const getGamificationSummary = (data: GamificationAnalysisData): GamificationSummary => {
  return getGamificationSummaryWithCache(data, generateGamificationSummary);
};