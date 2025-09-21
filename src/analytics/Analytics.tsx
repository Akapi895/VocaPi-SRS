import React, { useState } from 'react';
import { useChromeStorage } from '@/hooks/useChromeStorage';
import { AnalyticsData, GamificationData, VocabWord } from '@/types';
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

  const analytics = data?.analytics || {} as AnalyticsData;
  const gamification = data?.gamification || {} as GamificationData;
  const words = data?.vocabWords || [];

  // Calculate real-time stats from actual data
  const totalWords = words.length;
  const totalStudyTime = analytics.totalStudyTime || 0;
  const averageSessionTime = analytics.averageSessionTime || (totalStudyTime / Math.max(totalWords / 5, 1));
  
  // Calculate accuracy from word data
  const wordsWithReviews = words.filter((w: VocabWord) => w.totalReviews > 0);
  const totalCorrectReviews = wordsWithReviews.reduce((sum: number, w: VocabWord) => sum + w.correctReviews, 0);
  const totalReviews = wordsWithReviews.reduce((sum: number, w: VocabWord) => sum + w.totalReviews, 0);
  const accuracy = totalReviews > 0 ? Math.round((totalCorrectReviews / totalReviews) * 100) : 0;
  
  const currentStreak = gamification.streak || 0;
  const longestStreak = analytics.longestStreak || Math.max(currentStreak, analytics.currentStreak || 0);

  // Get words by difficulty (based on repetitions and success rate)
  const wordsByDifficulty = {
    new: words.filter((w: VocabWord) => w.repetitions === 0).length,
    learning: words.filter((w: VocabWord) => w.repetitions > 0 && w.repetitions < 5).length,
    review: words.filter((w: VocabWord) => w.repetitions >= 5).length
  };

  // Get words due for review
  const now = Date.now();
  const dueWords = words.filter((w: VocabWord) => w.nextReview <= now).length;

  // Calculate weekly progress from real data
  const getWeeklyProgress = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    const weeklyData = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(weekStart);
      currentDay.setDate(weekStart.getDate() + i);
      const dayStart = currentDay.getTime();
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      
      // Count words added on this day
      const wordsAddedToday = words.filter((w: VocabWord) => 
        w.createdAt >= dayStart && w.createdAt < dayEnd
      ).length;
      
      // Count words reviewed on this day (estimate from lastReviewTime)
      const wordsReviewedToday = words.filter((w: VocabWord) => 
        w.lastReviewTime && w.lastReviewTime >= dayStart && w.lastReviewTime < dayEnd
      ).length;
      
      // Estimate study time (5 minutes per review + 3 minutes per new word)
      const estimatedTime = (wordsReviewedToday * 5) + (wordsAddedToday * 3);
      
      weeklyData.push({
        day: dayNames[i],
        words: wordsAddedToday + wordsReviewedToday,
        time: estimatedTime,
        added: wordsAddedToday,
        reviewed: wordsReviewedToday
      });
    }
    
    return weeklyData;
  };

  const weeklyProgress = getWeeklyProgress();

  // Get difficult words (low success rate)
  const getDifficultWords = () => {
    return words
      .filter((w: VocabWord) => w.totalReviews >= 3) // Only words with enough reviews
      .map((w: VocabWord) => ({
        ...w,
        successRate: w.totalReviews > 0 ? (w.correctReviews / w.totalReviews) * 100 : 0
      }))
      .filter((w: any) => w.successRate < 70) // Less than 70% success rate
      .sort((a: any, b: any) => a.successRate - b.successRate) // Sort by difficulty
      .slice(0, 6);
  };

  // Get study patterns
  const getStudyPatterns = () => {
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    
    words.forEach((w: VocabWord) => {
      if (w.createdAt) {
        const date = new Date(w.createdAt);
        hourCounts[date.getHours()]++;
        dayCounts[date.getDay()]++;
      }
      if (w.lastReviewTime) {
        const date = new Date(w.lastReviewTime);
        hourCounts[date.getHours()]++;
        dayCounts[date.getDay()]++;
      }
    });
    
    const bestHour = hourCounts.indexOf(Math.max(...hourCounts));
    const bestDay = dayCounts.indexOf(Math.max(...dayCounts));
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      bestStudyTime: `${bestHour}:00 - ${bestHour + 1}:00`,
      mostActiveDay: dayNames[bestDay],
      totalSessions: Math.floor(totalWords / 5) || 1 // Estimate
    };
  };

  const studyPatterns = getStudyPatterns();
  const difficultWords = getDifficultWords();

  // Enhanced gamification system
  const getAchievements = () => {
    const achievements = [];
    
    // Word count achievements
    if (totalWords >= 1) achievements.push({ icon: '🌱', name: 'First Word', description: 'Added your first word to the dictionary', unlocked: true });
    if (totalWords >= 10) achievements.push({ icon: '📚', name: 'Bookworm', description: 'Collected 10 words', unlocked: true });
    if (totalWords >= 50) achievements.push({ icon: '🏆', name: 'Vocabulary Builder', description: 'Built a vocabulary of 50 words', unlocked: true });
    if (totalWords >= 100) achievements.push({ icon: '🎓', name: 'Scholar', description: 'Mastered 100 words', unlocked: true });
    if (totalWords >= 250) achievements.push({ icon: '👑', name: 'Word Master', description: 'Conquered 250 words', unlocked: true });
    if (totalWords >= 500) achievements.push({ icon: '⚡', name: 'Vocabulary Legend', description: 'Achieved legendary status with 500 words', unlocked: true });
    
    // Streak achievements
    if (currentStreak >= 3) achievements.push({ icon: '🔥', name: 'On Fire', description: '3-day learning streak', unlocked: true });
    if (currentStreak >= 7) achievements.push({ icon: '⭐', name: 'Week Warrior', description: '7-day learning streak', unlocked: true });
    if (currentStreak >= 30) achievements.push({ icon: '💎', name: 'Diamond Dedication', description: '30-day learning streak', unlocked: true });
    if (currentStreak >= 100) achievements.push({ icon: '🌟', name: 'Centurion', description: '100-day learning streak', unlocked: true });
    
    // Accuracy achievements
    if (accuracy >= 70) achievements.push({ icon: '🎯', name: 'Sharp Shooter', description: '70% accuracy achieved', unlocked: true });
    if (accuracy >= 85) achievements.push({ icon: '🏹', name: 'Precision Master', description: '85% accuracy achieved', unlocked: true });
    if (accuracy >= 95) achievements.push({ icon: '🔍', name: 'Perfect Precision', description: '95% accuracy achieved', unlocked: true });
    
    // Study time achievements
    const studyHours = Math.floor(totalStudyTime / (1000 * 60 * 60));
    if (studyHours >= 1) achievements.push({ icon: '⏰', name: 'Time Keeper', description: 'Studied for 1 hour total', unlocked: true });
    if (studyHours >= 10) achievements.push({ icon: '📖', name: 'Dedicated Learner', description: '10 hours of study time', unlocked: true });
    if (studyHours >= 50) achievements.push({ icon: '🧠', name: 'Brain Trainer', description: '50 hours of study time', unlocked: true });
    
    // Special achievements
    if (wordsByDifficulty.review >= 20) achievements.push({ icon: '🎪', name: 'Review Master', description: '20 words in review phase', unlocked: true });
    if (weeklyProgress.reduce((sum, day) => sum + day.words, 0) >= 30) achievements.push({ icon: '💪', name: 'Weekly Champion', description: 'Studied 30+ words this week', unlocked: true });
    
    return achievements;
  };

  const achievements = getAchievements();

  // Calculate next level progress
  const getNextLevelProgress = () => {
    const currentLevel = gamification.level || 1;
    const currentXP = gamification.xp || 0;
    const xpForCurrentLevel = (currentLevel - 1) * 100;
    const xpForNextLevel = currentLevel * 100;
    const progressXP = currentXP - xpForCurrentLevel;
    const neededXP = xpForNextLevel - xpForCurrentLevel;
    const progressPercentage = Math.min((progressXP / neededXP) * 100, 100);
    
    return {
      currentLevel,
      nextLevel: currentLevel + 1,
      progressXP,
      neededXP,
      progressPercentage,
      remainingXP: neededXP - progressXP
    };
  };

  const levelProgress = getNextLevelProgress();

  // Get user rank based on total words
  const getUserRank = () => {
    if (totalWords < 10) return { name: 'Beginner', icon: '🌱', color: 'text-green-600' };
    if (totalWords < 50) return { name: 'Learner', icon: '📚', color: 'text-blue-600' };
    if (totalWords < 100) return { name: 'Scholar', icon: '🎓', color: 'text-purple-600' };
    if (totalWords < 250) return { name: 'Expert', icon: '🏆', color: 'text-yellow-600' };
    if (totalWords < 500) return { name: 'Master', icon: '👑', color: 'text-orange-600' };
    return { name: 'Legend', icon: '⚡', color: 'text-red-600' };
  };

  const userRank = getUserRank();

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const exportAnalytics = () => {
    const exportData = {
      analytics,
      gamification,
      words: words.length,
      exportDate: new Date().toISOString(),
      version: '1.0.1'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocab-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                <p className="text-3xl font-bold text-blue-600">{words.length}</p>
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
              <h3 className="font-semibold text-gray-900">{gamification.xp || 0}</h3>
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
