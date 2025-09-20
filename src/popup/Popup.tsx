import React, { useState, useEffect } from 'react';
import { useChromeStorage } from '@/hooks/useChromeStorage';
import { useChromeMessages } from '@/hooks/useChromeMessages';
import { VocabWord, QualityRating } from '@/types';
import { 
  BookOpen, 
  Play, 
  BarChart3, 
  Settings, 
  Upload, 
  Download,
  HelpCircle,
  ArrowLeft,
  Lightbulb,
  Volume2,
  Check,
  SkipForward,
  Search,
  Trophy,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';

const Popup: React.FC = () => {
  const { data, loading, error, updateWord, updateGamification, updateAnalytics } = useChromeStorage();
  const { getSelectedText, showAddModal } = useChromeMessages();
  
  const [currentScreen, setCurrentScreen] = useState<'main' | 'review' | 'wordList' | 'complete'>('main');
  const [reviewWords, setReviewWords] = useState<VocabWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [reviewStats, setReviewStats] = useState({ correct: 0, total: 0 });

  // Get words due for review
  const getDueWords = (): VocabWord[] => {
    if (!data) return [];
    const now = Date.now();
    return data.vocabWords.filter(word => word.nextReview <= now);
  };

  // Start review session
  const startReview = () => {
    const dueWords = getDueWords();
    if (dueWords.length === 0) {
      alert('No words due for review!');
      return;
    }
    setReviewWords(dueWords);
    setCurrentWordIndex(0);
    setCurrentScreen('review');
    setShowAnswer(false);
    setUserAnswer('');
    setShowHint(false);
    setReviewStats({ correct: 0, total: 0 });
  };

  // Handle answer submission
  const handleAnswerSubmit = () => {
    if (!userAnswer.trim()) return;
    
    const currentWord = reviewWords[currentWordIndex];
    const isCorrect = userAnswer.toLowerCase().trim() === currentWord.word.toLowerCase();
    
    setShowAnswer(true);
    setReviewStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
  };

  // Handle quality rating
  const handleQualityRating = async (quality: QualityRating) => {
    const currentWord = reviewWords[currentWordIndex];
    
    // Update word with SRS algorithm
    const updatedWord = {
      ...currentWord,
      quality,
      repetitions: currentWord.repetitions + 1,
      lastReviewTime: Date.now(),
      totalReviews: currentWord.totalReviews + 1,
      correctReviews: currentWord.correctReviews + (quality >= 3 ? 1 : 0)
    };

    // Simple SRS calculation (you can replace with your advanced algorithm)
    let newInterval = currentWord.interval;
    if (quality >= 3) {
      newInterval = Math.min(currentWord.interval * 2, 365);
    } else {
      newInterval = 1;
    }

    updatedWord.interval = newInterval;
    updatedWord.nextReview = Date.now() + (newInterval * 24 * 60 * 60 * 1000);

    await updateWord(currentWord.id, updatedWord);

    // Move to next word or complete review
    if (currentWordIndex < reviewWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setShowAnswer(false);
      setUserAnswer('');
      setShowHint(false);
    } else {
      setCurrentScreen('complete');
    }
  };

  // Add word from selected text
  const handleAddWord = async () => {
    const selectedText = await getSelectedText();
    if (selectedText) {
      await showAddModal(selectedText);
    } else {
      await showAddModal();
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-secondary btn-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const dueWords = getDueWords();
  const currentWord = reviewWords[currentWordIndex];

  return (
    <div className="w-96 h-[600px] bg-white flex flex-col">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              VocaPi
            </h1>
            <p className="text-sm opacity-90">Spaced Repetition Learning</p>
          </div>
          <button 
            className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
            title="Keyboard Shortcuts (Alt+H)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Screen */}
      {currentScreen === 'main' && (
        <div className="flex-1 p-4 space-y-4">
          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3 text-center">
              <div className="text-2xl font-bold text-primary-600">
                {data?.vocabWords.length || 0}
              </div>
              <div className="text-xs text-gray-600">Total Words</div>
            </div>
            <div className="card p-3 text-center bg-warning-50 border-warning-200">
              <div className="text-2xl font-bold text-warning-600">
                {dueWords.length}
              </div>
              <div className="text-xs text-gray-600">Due Now</div>
            </div>
          </div>

          {/* Gamification Widget */}
          <div className="card p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-yellow-500" />
                <span className="text-gray-600">Level:</span>
                <span className="font-semibold">{data?.gamification.level || 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-blue-500" />
                <span className="text-gray-600">XP:</span>
                <span className="font-semibold">{data?.gamification.xp || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-green-500" />
                <span className="text-gray-600">Streak:</span>
                <span className="font-semibold">{data?.gamification.streak || 0} days</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-purple-500" />
                <span className="text-gray-600">Accuracy:</span>
                <span className="font-semibold">{data?.analytics.accuracy || 0}%</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button 
              onClick={startReview}
              className="btn btn-primary w-full btn-lg"
              disabled={dueWords.length === 0}
            >
              <Play className="w-4 h-4" />
              Start Review ({dueWords.length} words)
            </button>
            
            <button 
              onClick={() => setCurrentScreen('wordList')}
              className="btn btn-secondary w-full"
            >
              <BookOpen className="w-4 h-4" />
              View All Words
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('analytics.html') })}
              className="btn btn-outline btn-sm p-2"
              title="View learning analytics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('options.html') })}
              className="btn btn-outline btn-sm p-2"
              title="Settings & Cloud Sync"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={handleAddWord}
              className="btn btn-outline btn-sm p-2"
              title="Add word from selection"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              className="btn btn-outline btn-sm p-2"
              title="Import vocabulary"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Review Screen */}
      {currentScreen === 'review' && currentWord && (
        <div className="flex-1 flex flex-col">
          {/* Review Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setCurrentScreen('main')}
                className="btn btn-text btn-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="text-sm text-gray-600">
                {currentWordIndex + 1} / {reviewWords.length}
              </div>
            </div>
          </div>

          {/* Flashcard */}
          <div className="flex-1 p-4 space-y-4">
            <div className="card p-6 text-center min-h-[200px] flex flex-col justify-center">
              <div className="text-2xl font-semibold mb-2">
                {currentWord.meaning}
              </div>
              {showHint && (
                <div className="text-sm text-gray-600 mb-4">
                  {currentWord.example}
                </div>
              )}
              
              {!showAnswer ? (
                <div className="space-y-4">
                  <button 
                    onClick={() => setShowHint(!showHint)}
                    className="btn btn-outline btn-sm"
                  >
                    <Lightbulb className="w-4 h-4" />
                    {showHint ? 'Hide' : 'Show'} Hint
                  </button>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">What is the English word?</div>
                    <input 
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                      className="input w-full"
                      placeholder="Type your answer..."
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleAnswerSubmit}
                        className="btn btn-primary flex-1"
                      >
                        <Check className="w-4 h-4" />
                        Check Answer
                      </button>
                      <button 
                        onClick={() => handleQualityRating(0)}
                        className="btn btn-outline"
                      >
                        <SkipForward className="w-4 h-4" />
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Your answer:</span>
                      <span className={`ml-2 font-medium ${userAnswer.toLowerCase() === currentWord.word.toLowerCase() ? 'text-green-600' : 'text-red-600'}`}>
                        {userAnswer}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Correct answer:</span>
                      <span className="ml-2 font-medium text-green-600">{currentWord.word}</span>
                    </div>
                    {currentWord.phonetic && (
                      <div className="text-sm text-gray-500">
                        {currentWord.phonetic}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">How difficult was this word?</div>
                    <div className="grid grid-cols-3 gap-1">
                      {[0, 1, 2, 3, 4, 5].map(quality => (
                        <button
                          key={quality}
                          onClick={() => handleQualityRating(quality as QualityRating)}
                          className={`btn btn-sm p-2 text-xs ${
                            quality <= 2 ? 'btn-danger' : 
                            quality === 3 ? 'btn-warning' : 'btn-success'
                          }`}
                        >
                          {quality}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Word List Screen */}
      {currentScreen === 'wordList' && (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentScreen('main')}
                className="btn btn-text btn-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h2 className="font-semibold">All Words</h2>
            </div>
          </div>
          
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search words..."
                className="input pl-10"
              />
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data?.vocabWords.map((word) => (
                <div key={word.id} className="card p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{word.word}</div>
                      <div className="text-sm text-gray-600">{word.meaning}</div>
                      {word.example && (
                        <div className="text-xs text-gray-500 mt-1">{word.example}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(word.nextReview).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review Complete Screen */}
      {currentScreen === 'complete' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-4">Review Complete!</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card p-3">
              <div className="text-2xl font-bold text-primary-600">
                {reviewStats.total}
              </div>
              <div className="text-xs text-gray-600">words reviewed</div>
            </div>
            <div className="card p-3">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((reviewStats.correct / reviewStats.total) * 100)}%
              </div>
              <div className="text-xs text-gray-600">accuracy</div>
            </div>
          </div>
          
          <button 
            onClick={() => setCurrentScreen('main')}
            className="btn btn-primary"
          >
            <Check className="w-4 h-4" />
            Finish
          </button>
        </div>
      )}
    </div>
  );
};

export default Popup;
