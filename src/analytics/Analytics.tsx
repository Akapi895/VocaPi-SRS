import React, { useState } from 'react';
import { useChromeStorage } from '@/hooks/useChromeStorage';
import {
  getAnalyticsSummary,
  formatTime,
  exportAnalyticsData
} from './utils';

import { 
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Trophy,
  Zap,
  BookOpen,
  Calendar,
  Award,
  Activity,
  ArrowLeft,
  Download,
  Timer,
  Gauge,
  CheckCircle2
} from 'lucide-react';

const Analytics: React.FC = () => {
  const { data, loading, error, saveData } = useChromeStorage();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Auto-add test data if no words exist (for development)
  React.useEffect(() => {
    if (data && (!data.vocabWords || data.vocabWords.length === 0)) {
      
      const testWords = [
        {
          id: 'test-1',
          word: 'sophisticated',
          meaning: 'Having great knowledge and experience',
          phonetic: '/səˈfɪstɪkeɪtɪd/',
          pronunUrl: '',
          wordType: 'adjective' as const,
          createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000, // 6 days ago
          updatedAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
          interval: 1, repetitions: 2, easeFactor: 2.5,
          nextReview: Date.now() + 24 * 60 * 60 * 1000,
          quality: 4, totalReviews: 3, correctReviews: 2,
          lastReviewTime: Date.now() - 1 * 24 * 60 * 60 * 1000 // Yesterday
        },
        {
          id: 'test-2',
          word: 'meticulous',
          meaning: 'Very careful and precise',
          phonetic: '/məˈtɪkjələs/',
          pronunUrl: '',
          wordType: 'adjective' as const,
          createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
          updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
          interval: 1, repetitions: 1, easeFactor: 2.5,
          nextReview: Date.now() + 24 * 60 * 60 * 1000,
          quality: 3, totalReviews: 2, correctReviews: 1,
          lastReviewTime: Date.now() - 2 * 24 * 60 * 60 * 1000 // 2 days ago
        },
        {
          id: 'test-3',
          word: 'paradigm',
          meaning: 'A model or pattern',
          phonetic: '/ˈpærədaɪm/',
          pronunUrl: '',
          wordType: 'noun' as const,
          createdAt: Date.now() - 60 * 60 * 1000, // 1 hour ago (today)
          updatedAt: Date.now() - 60 * 60 * 1000,
          interval: 1, repetitions: 0, easeFactor: 2.5,
          nextReview: Date.now() + 24 * 60 * 60 * 1000,
          quality: 0, totalReviews: 0, correctReviews: 0
        }
      ];
      
      saveData({ vocabWords: testWords });
    }
  }, [data, saveData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-dark-background dark:to-dark-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-foreground-secondary">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-dark-background dark:to-dark-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-danger-600 dark:text-danger-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-secondary hover-scale focus-ring"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter data based on selected period
  const getFilteredWords = (words: any[], period: 'week' | 'month' | 'year') => {
    if (!words || words.length === 0) return [];
    
    const now = Date.now();
    const periods = {
      week: 7 * 24 * 60 * 60 * 1000,     // 7 days
      month: 30 * 24 * 60 * 60 * 1000,   // 30 days  
      year: 365 * 24 * 60 * 60 * 1000    // 365 days
    };
    
    const cutoffTime = now - periods[period];
    
    return words.filter(word => {
      // Include words added in the period
      const addedInPeriod = word.createdAt && word.createdAt >= cutoffTime;
      // Include words reviewed in the period
      const reviewedInPeriod = word.lastReviewTime && word.lastReviewTime >= cutoffTime;
      
      return addedInPeriod || reviewedInPeriod;
    });
  };

  // Get filtered data based on selected period
  const filteredWords = selectedPeriod ? getFilteredWords(data?.vocabWords || [], selectedPeriod) : (data?.vocabWords || []);
  
  // Create filtered data object for analytics
  const filteredData = {
    ...data,
    vocabWords: filteredWords
  };

  // Get comprehensive analytics summary using filtered data
  const analyticsSummary = getAnalyticsSummary(filteredData);
  const {
    coreStats,
    wordDistribution: wordsByDifficulty,
    streakInfo,
    weeklyProgress,
    studyPatterns,
    achievements,
    levelProgress,
    userRank,
    difficultWords,
    responseTimeAnalytics,
    consistencyScore
  } = analyticsSummary;
  
  // Extract commonly used values for easier access
  const { totalWords, accuracy, dueWords, averageSessionTime, totalStudyTime } = coreStats;
  const { currentStreak, longestStreak } = streakInfo;

  // Helper function for export
  const exportAnalytics = () => {
    exportAnalyticsData(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-dark-background dark:to-dark-background-secondary">
      {/* Header */}
      <div className="bg-background shadow-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.close()}
                className="btn btn-text btn-sm hover-scale focus-ring"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  Learning Analytics
                  <span className="text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full font-normal">
                    {selectedPeriod === 'week' ? 'Last 7 Days' : 
                     selectedPeriod === 'month' ? 'Last 30 Days' : 'Last 365 Days'}
                  </span>
                </h1>
                <p className="text-sm text-foreground-secondary">
                  Track your vocabulary learning progress • {filteredWords.length} words in period
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as any)}
                  className="input input-focus text-sm pr-10"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
                {filteredWords.length !== (data?.vocabWords?.length || 0) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full animate-pulse" 
                       title={`Filtered: ${filteredWords.length} / ${data?.vocabWords?.length || 0} words`}>
                  </div>
                )}
              </div>
              
              <button 
                onClick={exportAnalytics}
                className="btn btn-outline btn-sm hover-scale focus-ring"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card hover-lift p-6 bg-gradient-to-br from-background to-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Total Words</p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 gradient-text">{totalWords}</p>
              </div>
              <BookOpen className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-foreground-secondary">
                <span>New: <span className="text-accent-600 dark:text-accent-400 font-medium">{wordsByDifficulty.new}</span></span>
                <span>Learning: <span className="text-warning-600 dark:text-warning-400 font-medium">{wordsByDifficulty.learning}</span></span>
                <span>Review: <span className="text-success-600 dark:text-success-400 font-medium">{wordsByDifficulty.review}</span></span>
              </div>
            </div>
          </div>

          <div className="card hover-lift p-6 bg-gradient-to-br from-background to-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Current Streak</p>
                <p className="text-3xl font-bold text-success-600 dark:text-success-400 gradient-text">{currentStreak}</p>
              </div>
              <Target className="w-8 h-8 text-success-600 dark:text-success-400" />
            </div>
            <div className="mt-4">
              <div className="text-sm text-foreground-secondary">
                Longest: <span className="text-success-600 dark:text-success-400 font-medium">{longestStreak} days</span>
              </div>
            </div>
          </div>

          <div className="card hover-lift p-6 bg-gradient-to-br from-background to-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Total Study Time</p>
                <p className="text-3xl font-bold text-accent-600 dark:text-accent-400 gradient-text">
                  {formatTime(Math.round(totalStudyTime / 1000 / 60))}
                </p>
              </div>
              <Clock className="w-8 h-8 text-accent-600 dark:text-accent-400" />
            </div>
            <div className="mt-4">
              <div className="text-sm text-foreground-secondary">
                Avg session: <span className="text-accent-600 dark:text-accent-400 font-medium">{formatTime(Math.round(averageSessionTime / 1000 / 60))}</span>
              </div>
            </div>
          </div>

          <div className="card hover-lift p-6 bg-gradient-to-br from-background to-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Accuracy</p>
                <p className="text-3xl font-bold text-warning-600 dark:text-warning-400 gradient-text">{Math.round(accuracy)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-warning-600 dark:text-warning-400" />
            </div>
            <div className="mt-4">
              <div className="text-sm text-foreground-secondary">
                Due now: <span className="text-danger-600 dark:text-danger-400 font-medium">{dueWords} words</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Gamification Stats */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Gamification Progress
          </h2>
          
          {/* User Rank */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-full">
              <span className="text-2xl">{userRank.icon}</span>
              <span className={`font-bold ${userRank.color}`}>{userRank.name}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 relative">
                <span className="text-2xl font-bold text-white">{levelProgress.currentLevel}</span>
              </div>
              <h3 className="font-semibold text-gray-900">Level {levelProgress.currentLevel}</h3>
              <p className="text-sm text-gray-600">Current level</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">{levelProgress.progressXP}</h3>
              <p className="text-sm text-gray-600">Experience Points</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">{currentStreak}</h3>
              <p className="text-sm text-gray-600">Day Streak</p>
            </div>
          </div>
          
          {/* Level Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Level {levelProgress.currentLevel}</span>
              <span>{levelProgress.remainingXP} XP to Level {levelProgress.nextLevel}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${levelProgress.progressPercentage}%` }}
              ></div>
            </div>
            <div className="text-center text-sm text-gray-600 mt-1">
              {levelProgress.progressXP} / {levelProgress.neededXP} XP
            </div>
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Weekly Progress
          </h2>
          
          {weeklyProgress.length === 0 ? (
            <div className="text-center py-8 text-foreground-secondary">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No weekly progress data yet</p>
              <p className="text-sm">Add some vocabulary words to see your progress!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {weeklyProgress.map((day, _) => (
              <div key={day.day} className="flex items-center gap-4">
                <div className="w-12 text-sm font-medium text-gray-600">
                  {day.day}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm text-gray-600">{day.words} words</div>
                    <div className="text-sm text-gray-600">•</div>
                    <div className="text-sm text-gray-600">{formatTime(day.time)}</div>
                    {day.added > 0 && (
                      <>
                        <div className="text-sm text-gray-600">•</div>
                        <div className="text-sm text-green-600">+{day.added} new</div>
                      </>
                    )}
                    {day.reviewed > 0 && (
                      <>
                        <div className="text-sm text-gray-600">•</div>
                        <div className="text-sm text-blue-600">{day.reviewed} reviewed</div>
                      </>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((day.words / Math.max(...weeklyProgress.map(d => d.words), 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>

        {/* Learning Patterns & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Study Patterns
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Best Study Time</span>
                <span className="font-medium">{studyPatterns.bestStudyTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Most Active Day</span>
                <span className="font-medium">{studyPatterns.mostActiveDay}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Sessions</span>
                <span className="font-medium">{studyPatterns.totalSessions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Session</span>
                <span className="font-medium">{formatTime(Math.round(averageSessionTime / 1000 / 60))}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-green-600" />
              Study Consistency
            </h3>
            
            <div className="text-center mb-4">
              <div className={`text-4xl font-bold mb-2 ${
                consistencyScore >= 80 ? 'text-green-600' :
                consistencyScore >= 60 ? 'text-yellow-600' :
                consistencyScore >= 40 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {consistencyScore}%
              </div>
              <div className="text-sm text-gray-600 mb-3">Consistency Score</div>
              
              {/* Consistency Progress Ring */}
              <div className="relative w-20 h-20 mx-auto">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="transparent"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      consistencyScore >= 80 ? 'text-green-500' :
                      consistencyScore >= 60 ? 'text-yellow-500' :
                      consistencyScore >= 40 ? 'text-orange-500' : 'text-red-500'
                    }
                    strokeWidth="3"
                    strokeDasharray={`${consistencyScore}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle2 className={`w-6 h-6 ${
                    consistencyScore >= 80 ? 'text-green-600' :
                    consistencyScore >= 60 ? 'text-yellow-600' :
                    consistencyScore >= 40 ? 'text-orange-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
            </div>
            
            <div className="text-center text-xs text-gray-600">
              {consistencyScore >= 80 ? 'Excellent consistency!' :
               consistencyScore >= 60 ? 'Good study habits' :
               consistencyScore >= 40 ? 'Room for improvement' : 'Try to study more regularly'}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Timer className="w-5 h-5 text-orange-600" />
              Response Time
            </h3>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {responseTimeAnalytics.averageResponseTime}s
                </div>
                <div className="text-sm text-gray-600">Average Response</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Easy</span>
                  </div>
                  <div className="text-sm font-medium">
                    {responseTimeAnalytics.byDifficulty.easy.length > 0 
                      ? Math.round((responseTimeAnalytics.byDifficulty.easy.reduce((sum, w) => sum + w.estimatedResponseTime, 0) / responseTimeAnalytics.byDifficulty.easy.length) * 10) / 10
                      : 0}s
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Medium</span>
                  </div>
                  <div className="text-sm font-medium">
                    {responseTimeAnalytics.byDifficulty.medium.length > 0 
                      ? Math.round((responseTimeAnalytics.byDifficulty.medium.reduce((sum, w) => sum + w.estimatedResponseTime, 0) / responseTimeAnalytics.byDifficulty.medium.length) * 10) / 10
                      : 0}s
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Hard</span>
                  </div>
                  <div className="text-sm font-medium">
                    {responseTimeAnalytics.byDifficulty.hard.length > 0 
                      ? Math.round((responseTimeAnalytics.byDifficulty.hard.reduce((sum, w) => sum + w.estimatedResponseTime, 0) / responseTimeAnalytics.byDifficulty.hard.length) * 10) / 10
                      : 0}s
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 text-center mt-3">
                *Estimated based on difficulty and accuracy
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-600" />
            Achievements ({achievements.filter(a => a.unlocked).length})
          </h2>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {achievements.length > 0 ? (
              achievements.map((achievement: any, index: number) => (
                <div key={index} className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  achievement.unlocked 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' 
                    : 'bg-gray-50 border border-gray-200 opacity-60'
                }`}>
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className={`font-medium ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                      {achievement.name}
                    </div>
                    <div className={`text-sm ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                      {achievement.description}
                    </div>
                  </div>
                  {achievement.unlocked && (
                    <div className="text-green-600">
                      <Award className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Start learning to unlock achievements!</p>
              </div>
            )}
          </div>
          
          {/* Achievement Progress */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Achievement Progress</span>
              <span>{achievements.filter(a => a.unlocked).length} / {achievements.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${achievements.length > 0 ? (achievements.filter(a => a.unlocked).length / achievements.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Difficult Words */}
        {difficultWords.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-red-600" />
              Words Needing More Practice
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {difficultWords.map((word: any, index: number) => (
                <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="font-medium text-gray-900">{word.word}</div>
                  <div className="text-sm text-gray-600">{word.meaning}</div>
                  <div className="text-xs text-red-600 mt-2">
                    Success rate: {Math.round(word.successRate)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {word.totalReviews} reviews • {word.correctReviews} correct
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;