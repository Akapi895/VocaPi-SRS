// Core types for the vocabulary extension

export interface VocabWord {
    id: string;
    word: string;
    meaning: string;
    example?: string;
    phonetic: string;
    pronunUrl: string;
    wordType: 'noun' | 'verb' | 'adjective' | 'adverb' | 'idiom' | 'phrase' | 'other';
    audioUrl?: string;
    createdAt: number;
    updatedAt: number;
    // SRS data
    interval: number;
    repetitions: number;
    easeFactor: number;
    nextReview: number;
    quality: number;
    // Analytics
    totalReviews: number;
    correctReviews: number;
    lastReviewTime?: number;
    averageResponseTime?: number;
  }
  
  export interface GamificationData {
    xp: number;
    level: number;
    streak: number;
    achievements: Achievement[];
    dailyGoal: number;
    weeklyGoal: number;
    totalStudyTime: number;
    lastStudyDate?: number;
    lastStreakUpdate?: number;
  }
  
  export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: number;
    category: 'learning' | 'streak' | 'time' | 'accuracy' | 'special';
  }
  
  export interface AnalyticsData {
    totalWords: number;
    learnedWords: number;
    reviewWords: number;
    newWords: number;
    currentStreak: number;
    longestStreak: number;
    totalStudyTime: number;
    averageSessionTime: number;
    accuracy: number;
    weeklyProgress: WeeklyProgress[];
    dailyStats: DailyStats[];
    bestStudyTime: string;
    mostActiveDay: string;
    difficultWords: VocabWord[];
  }
  
  export interface WeeklyProgress {
    week: string;
    wordsLearned: number;
    timeSpent: number;
    accuracy: number;
    reviewsCompleted: number;
  }
  
  export interface DailyStats {
    date: string;
    wordsLearned: number;
    timeSpent: number;
    accuracy: number;
    reviewsCompleted: number;
    streak: number;
  }
  
  export interface ReviewSession {
    id: string;
    startTime: number;
    endTime?: number;
    wordsReviewed: string[];
    correctAnswers: number;
    totalAnswers: number;
    averageResponseTime: number;
    quality: number;
  }
  
  export interface Settings {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: boolean;
    soundEnabled: boolean;
    autoPlay: boolean;
    reviewReminders: boolean;
    dailyGoal: number;
    weeklyGoal: number;
    maxReviewsPerDay: number;
    showPhonetics: boolean;
    showExamples: boolean;
  }
  
  export interface StorageData {
    vocabWords: VocabWord[];
    gamification: GamificationData;
    analytics: AnalyticsData;
    settings: Settings;
    dailyStats: DailyStats[];
    reviewSessions: ReviewSession[];
  }
  
  // Chrome extension specific types
  export interface ChromeMessage {
    type: string;
    data?: any;
    tabId?: number;
  }
  
  export interface ContentScriptMessage {
    type: 'ADD_WORD' | 'GET_SELECTED_TEXT' | 'SHOW_ADD_MODAL' | 'SHOW_SUCCESS_MESSAGE' | 'SHOW_ERROR_MESSAGE' | 'TOGGLE_WORD_HIGHLIGHTING';
    data?: any;
  }
  
  export interface PopupMessage {
    type: 'GET_DATA' | 'START_REVIEW' | 'ADD_WORD' | 'UPDATE_SETTINGS';
    data?: any;
  }
  
  // Component props types
  export interface PopupProps {
    initialData?: StorageData;
  }
  
  export interface OptionsProps {
    settings: Settings;
    onSettingsChange: (settings: Settings) => void;
  }
  
  export interface ReviewProps {
    words: VocabWord[];
    onReviewComplete: (session: ReviewSession) => void;
  }
  
  export interface AnalyticsProps {
    data: AnalyticsData;
    gamification: GamificationData;
  }
  
  // Utility types
  export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;
  
  export type ReviewStatus = 'new' | 'learning' | 'review' | 'graduated';
  
  export type Theme = 'light' | 'dark' | 'auto';
  
  export type Language = 'en' | 'vi' | 'ja' | 'ko' | 'zh';
  
  // API types
  export interface DictionaryAPIResponse {
    word: string;
    phonetic?: string;
    meanings: Array<{
      partOfSpeech: string;
      definitions: Array<{
        definition: string;
        example?: string;
      }>;
    }>;
    audioUrl?: string;
  }

  // Dictionary types for offline lookup
  export interface DictionaryEntry {
    definitions: string[];
    examples: string[];
    types: string[];
    phonetic: string;
    audio?: string;
  }