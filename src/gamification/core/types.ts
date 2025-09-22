import { VocabWord, GamificationData, AnalyticsData } from '@/types';

// Core gamification types
export interface Achievement {
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  category: AchievementCategory;
  rarity: AchievementRarity;
  points: number;
}

export interface UserRank {
  name: string;
  icon: string;
  color: string;
  minWords: number;
  maxWords?: number;
}

export interface LevelProgress {
  currentLevel: number;
  nextLevel: number;
  progressXP: number;
  neededXP: number;
  progressPercentage: number;
  remainingXP: number;
  totalXP: number;
}

export interface WeeklyProgressData {
  day: string;
  words: number;
  time: number;
  added: number;
  reviewed: number;
}

export enum AchievementCategory {
  WORDS = 'words',
  STREAK = 'streak',
  ACCURACY = 'accuracy',
  TIME = 'time',
  SPECIAL = 'special',
  WEEKLY = 'weekly'
}

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
  DIVINE = 'divine'
}

export interface AchievementDefinition {
  id: string;
  icon: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  points: number;
  checkUnlocked: (data: GamificationAnalysisData) => boolean;
}

export interface GamificationAnalysisData {
  totalWords: number;
  currentStreak: number;
  accuracy: number;
  totalStudyTime: number;
  wordDistribution: {
    new: number;
    learning: number;
    review: number;
  };
  weeklyProgress: WeeklyProgressData[];
  words: VocabWord[];
  analytics?: AnalyticsData;
  gamification?: GamificationData;
}

export interface GamificationSummary {
  achievements: Achievement[];
  levelProgress: LevelProgress;
  userRank: UserRank;
  totalPoints: number;
  unlockedAchievements: number;
  totalAchievements: number;
  nextMilestone: Achievement | null;
}