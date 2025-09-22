import { useState, useEffect, useCallback } from 'react';
import { StorageData, VocabWord, GamificationData, AnalyticsData, Settings } from '@/types';

export const useChromeStorage = () => {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await chrome.storage.local.get([
        'vocabWords',
        'gamification',
        'analytics',
        'settings',
        'dailyStats',
        'reviewSessions'
      ]);

      const storageData: StorageData = {
        vocabWords: result.vocabWords || [],
        gamification: result.gamification || {
          xp: 0,
          level: 1,
          streak: 0,
          achievements: [],
          dailyGoal: 20,
          weeklyGoal: 100,
          totalStudyTime: 0,
          lastStreakUpdate: 0
        },
        analytics: result.analytics || {
          totalWords: 0,
          learnedWords: 0,
          reviewWords: 0,
          newWords: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalStudyTime: 0,
          averageSessionTime: 0,
          accuracy: 0,
          weeklyProgress: [],
          dailyStats: [],
          bestStudyTime: '',
          mostActiveDay: '',
          difficultWords: []
        },
        settings: result.settings || {
          theme: 'light',
          language: 'en',
          notifications: true,
          soundEnabled: true,
          autoPlay: false,
          reviewReminders: true,
          dailyGoal: 20,
          weeklyGoal: 100,
          maxReviewsPerDay: 50,
          showPhonetics: true,
          showExamples: true
        },
        dailyStats: result.dailyStats || [],
        reviewSessions: result.reviewSessions || []
      };

      setData(storageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveData = useCallback(async (newData: Partial<StorageData>) => {
    try {
      setError(null);
      await chrome.storage.local.set(newData);
      
      if (data) {
        setData({ ...data, ...newData });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save data');
    }
  }, [data]);

  const addWord = useCallback(async (word: VocabWord) => {
    if (!data) return;
    
    const updatedWords = [...data.vocabWords, word];
    await saveData({ vocabWords: updatedWords });
  }, [data, saveData]);

  const updateWord = useCallback(async (wordId: string, updates: Partial<VocabWord>) => {
    if (!data) return;
    
    const updatedWords = data.vocabWords.map(word => 
      word.id === wordId ? { ...word, ...updates, updatedAt: Date.now() } : word
    );
    await saveData({ vocabWords: updatedWords });
  }, [data, saveData]);

  const deleteWord = useCallback(async (wordId: string) => {
    if (!data) return;
    
    const updatedWords = data.vocabWords.filter(word => word.id !== wordId);
    await saveData({ vocabWords: updatedWords });
  }, [data, saveData]);

  const updateGamification = useCallback(async (updates: Partial<GamificationData>) => {
    if (!data) return;
    
    const updatedGamification = { ...data.gamification, ...updates };
    await saveData({ gamification: updatedGamification });
  }, [data, saveData]);

  const updateAnalytics = useCallback(async (updates: Partial<AnalyticsData>) => {
    if (!data) return;
    
    const updatedAnalytics = { ...data.analytics, ...updates };
    await saveData({ analytics: updatedAnalytics });
  }, [data, saveData]);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    if (!data) return;
    
    const updatedSettings = { ...data.settings, ...updates };
    await saveData({ settings: updatedSettings });
  }, [data, saveData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    loadData,
    saveData,
    addWord,
    updateWord,
    deleteWord,
    updateGamification,
    updateAnalytics,
    updateSettings
  };
};
