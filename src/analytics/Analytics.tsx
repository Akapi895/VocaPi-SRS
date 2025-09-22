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
  Download
} from 'lucide-react';

const Analytics: React.FC = () => {
  const { data, loading, error } = useChromeStorage();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-secondary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Get comprehensive analytics summary using utils
  const analyticsSummary = getAnalyticsSummary(data);
  const {
    coreStats,
    wordDistribution: wordsByDifficulty,
    streakInfo,
    weeklyProgress,
    studyPatterns,
    achievements,
    levelProgress,
    userRank,
    difficultWords
  } = analyticsSummary;

  // Extract commonly used values for easier access
  const { totalWords, accuracy, dueWords, averageSessionTime, totalStudyTime } = coreStats;
  const { currentStreak, longestStreak } = streakInfo;

  // Helper function for export
  const exportAnalytics = () => {
    exportAnalyticsData(data?.analytics, data?.gamification, totalWords);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.close()}
                className="btn btn-text btn-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  Learning Analytics
                </h1>
                <p className="text-sm text-gray-600">Track your vocabulary learning progress</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="input text-sm"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              
              <button 
                onClick={exportAnalytics}
                className="btn btn-outline btn-sm"
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
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Words</p>
                <p className="text-3xl font-bold text-blue-600">{totalWords}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>New: {wordsByDifficulty.new}</span>
                <span>Learning: {wordsByDifficulty.learning}</span>
                <span>Review: {wordsByDifficulty.review}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-3xl font-bold text-green-600">{currentStreak}</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600">
                Longest: {longestStreak} days
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Study Time</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatTime(Math.round(totalStudyTime / 1000 / 60))}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600">
                Avg session: {formatTime(Math.round(averageSessionTime / 1000 / 60))}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                <p className="text-3xl font-bold text-orange-600">{Math.round(accuracy)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600">
                Due now: {dueWords} words
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
                    <div className="text-sm text-gray-600">{day.time} min</div>
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
        </div>

        {/* Learning Patterns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
              <Award className="w-5 h-5 text-orange-600" />
              Achievements ({achievements.filter(a => a.unlocked).length})
            </h3>
            
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
