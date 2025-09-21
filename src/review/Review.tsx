import React, { useState, useEffect } from 'react';
import { useChromeStorage } from '@/hooks/useChromeStorage';
import { VocabWord, QualityRating, ReviewSession } from '@/types';
import { 
  ArrowLeft,
  Lightbulb,
  Volume2,
  Check,
  SkipForward,
  BookOpen,
  Play,
  Pause,
  RotateCw
} from 'lucide-react';

const Review: React.FC = () => {
  const { data, loading, error, updateWord, updateAnalytics, updateGamification } = useChromeStorage();
  
  const [reviewWords, setReviewWords] = useState<VocabWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    total: 0,
    startTime: Date.now(),
    totalTime: 0
  });
  const [isPaused, setIsPaused] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'pause' | 'stop' | null>(null);

  // Get words due for review
  const getDueWords = (): VocabWord[] => {
    if (!data) return [];
    const now = Date.now();
    return data.vocabWords.filter(word => word.nextReview <= now);
  };

  // Initialize review session
  useEffect(() => {
    if (data) {
      const dueWords = getDueWords();
      if (dueWords.length > 0) {
        // Shuffle words for better learning
        const shuffled = [...dueWords].sort(() => Math.random() - 0.5);
        setReviewWords(shuffled);
        setSessionStats(prev => ({ ...prev, startTime: Date.now() }));
      }
    }
  }, [data]);

  // Handle answer submission
  const handleAnswerSubmit = () => {
    if (!userAnswer.trim()) return;
    
    const currentWord = reviewWords[currentWordIndex];
    const isCorrect = userAnswer.toLowerCase().trim() === currentWord.word.toLowerCase();
    
    setShowAnswer(true);
    setSessionStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
  };


  // Process quality rating and move to next word
  const processQualityRating = async (quality: QualityRating) => {
    const currentWord = reviewWords[currentWordIndex];
    const isCorrect = userAnswer.toLowerCase().trim() === currentWord.word.toLowerCase();
    
    // Determine quality based on new logic
    let finalQuality: QualityRating;
    
    if (quality === 0) {
      // Skip button was pressed
      finalQuality = 0;
    } else if (showHint) {
      // User used hint
      if (isCorrect) {
        finalQuality = 2; // Used hint + correct = quality 2
      } else {
        finalQuality = 0; // Used hint + wrong = quality 0
      }
    } else {
      // User didn't use hint
      if (isCorrect) {
        finalQuality = quality; // User can choose 3-5 based on difficulty
      } else {
        finalQuality = 1; // No hint + wrong = quality 1
      }
    }
    
    // Update word with SRS algorithm
    const updatedWord = {
      ...currentWord,
      quality: finalQuality,
      repetitions: currentWord.repetitions + 1,
      lastReviewTime: Date.now(),
      totalReviews: currentWord.totalReviews + 1,
      correctReviews: currentWord.correctReviews + (finalQuality >= 3 ? 1 : 0)
    };

    // Simple SRS calculation
    let newInterval = currentWord.interval;
    let newEaseFactor = currentWord.easeFactor;

    if (finalQuality >= 3) {
      newInterval = Math.min(currentWord.interval * 2, 365);
      newEaseFactor = Math.max(1.3, currentWord.easeFactor + (0.1 - (5 - finalQuality) * (0.08 + (5 - finalQuality) * 0.02)));
    } else {
      newInterval = 1;
      newEaseFactor = Math.max(1.3, currentWord.easeFactor - 0.2);
    }

    updatedWord.interval = newInterval;
    updatedWord.easeFactor = newEaseFactor;
    updatedWord.nextReview = Date.now() + (newInterval * 24 * 60 * 60 * 1000);

    // Update word, analytics, and gamification
    await updateWord(currentWord.id, updatedWord);

    // Update analytics
    if (data) {
      const sessionTime = Date.now() - sessionStats.startTime;
      await updateAnalytics({
        totalStudyTime: (data.analytics.totalStudyTime || 0) + sessionTime,
        averageSessionTime: ((data.analytics.averageSessionTime || 0) + sessionTime) / 2,
        totalWords: data.analytics.totalWords || 0,
        learnedWords: (data.analytics.learnedWords || 0) + (finalQuality >= 3 ? 1 : 0),
        accuracy: data.analytics.accuracy || 0
      });

      // Update gamification
      const xpGained = finalQuality >= 3 ? 10 : (finalQuality === 2 ? 5 : 2);
      await updateGamification({
        xp: (data.gamification.xp || 0) + xpGained,
        totalStudyTime: (data.gamification.totalStudyTime || 0) + sessionTime,
        streak: finalQuality >= 3 ? (data.gamification.streak || 0) + 1 : 0
      });
    }

    // Move to next word or complete review
    if (currentWordIndex < reviewWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setShowAnswer(false);
      setUserAnswer('');
      setShowHint(false);
    } else {
      // Complete review session
      const endTime = Date.now();
      const totalTime = endTime - sessionStats.startTime;
      
      // Create review session record (could be saved to storage in the future)
      const reviewSession: ReviewSession = {
        id: `session_${Date.now()}`,
        startTime: sessionStats.startTime,
        endTime,
        wordsReviewed: reviewWords.map(w => w.id),
        correctAnswers: sessionStats.correct,
        totalAnswers: sessionStats.total,
        averageResponseTime: totalTime / sessionStats.total,
        quality: sessionStats.correct / sessionStats.total
      };
      
      // TODO: Save review session to storage
      console.log('Review session completed:', reviewSession);

      setSessionStats(prev => ({ ...prev, totalTime }));
      setSessionComplete(true);
    }
  };

  // Restart review
  const handleRestart = () => {
    const dueWords = getDueWords();
    if (dueWords.length > 0) {
      const shuffled = [...dueWords].sort(() => Math.random() - 0.5);
      setReviewWords(shuffled);
      setCurrentWordIndex(0);
      setShowAnswer(false);
      setUserAnswer('');
      setShowHint(false);
      setSessionStats({
        correct: 0,
        total: 0,
        startTime: Date.now(),
        totalTime: 0
      });
      setSessionComplete(false);
    }
  };

  // Toggle pause
  const togglePause = () => {
    if (!isPaused) {
      // Pausing - show confirmation
      setPendingAction('pause');
      setShowConfirmDialog(true);
    } else {
      // Resuming - no confirmation needed
      setIsPaused(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    setPendingAction('stop');
    setShowConfirmDialog(true);
  };

  // Confirm action
  const confirmAction = () => {
    if (pendingAction === 'pause') {
      // When pausing, show session statistics
      setShowStatsModal(true);
    } else if (pendingAction === 'stop') {
      setShowStatsModal(true);
    }
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  // Cancel action
  const cancelAction = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading review session...</p>
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

  if (reviewWords.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Words to Review!</h2>
          <p className="text-gray-600 mb-6">
            Great job! You've completed all your reviews for today. 
            Come back later for more words to review.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.close()}
              className="btn btn-primary w-full"
            >
              <Check className="w-4 h-4" />
              Close Review
            </button>
            <button 
              onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') })}
              className="btn btn-secondary w-full"
            >
              <BookOpen className="w-4 h-4" />
              Back to Main
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = reviewWords[currentWordIndex];
  const progress = ((currentWordIndex + 1) / reviewWords.length) * 100;
  const accuracy = sessionStats.total > 0 ? (sessionStats.correct / sessionStats.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBack}
                className="btn btn-text btn-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Review Session</h1>
                <p className="text-sm text-gray-600">
                  {currentWordIndex + 1} of {reviewWords.length} words
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePause}
                className="btn btn-outline btn-sm"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {Math.round(accuracy)}% accuracy
                </div>
                <div className="text-xs text-gray-600">
                  {sessionStats.correct}/{sessionStats.total} correct
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {!sessionComplete ? (
          <div className="space-y-6">
            {/* Flashcard */}
            <div className="card p-8 text-center min-h-[400px] flex flex-col justify-center">
              <div className="text-3xl font-semibold mb-4 text-gray-900">
                {currentWord.meaning}
              </div>
              
              {showHint && (
                <div className="space-y-4 mb-6">
                  {/* Pronunciation Button */}
                  {(currentWord.pronunUrl || currentWord.audioUrl) && (
                    <button 
                      onClick={() => {
                        const audioUrl = currentWord.pronunUrl || currentWord.audioUrl;
                        if (audioUrl) {
                          new Audio(audioUrl).play().catch(() => {
                            // Fallback to TTS
                            if ('speechSynthesis' in window) {
                              const utterance = new SpeechSynthesisUtterance(currentWord.word);
                              utterance.lang = 'en-US';
                              utterance.rate = 0.8;
                              speechSynthesis.speak(utterance);
                            }
                          });
                        }
                      }}
                      className="btn btn-outline"
                    >
                      <Volume2 className="w-4 h-4" />
                      Pronunciation
                    </button>
                  )}
                  
                  {/* Example with masked word */}
                  {currentWord.example && (
                    <div className="text-lg text-gray-600 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      {currentWord.example.replace(
                        new RegExp(`\\b${currentWord.word}\\b`, 'gi'), 
                        '_____'
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {!showAnswer ? (
                <div className="space-y-6">
                  <button 
                    onClick={() => setShowHint(!showHint)}
                    className="btn btn-outline"
                  >
                    <Lightbulb className="w-4 h-4" />
                    {showHint ? 'Hide' : 'Show'} Hint
                  </button>
                  
                  <div className="space-y-4">
                    <div className="text-lg text-gray-700">What is the English word?</div>
                    <input 
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                      className="input text-lg text-center max-w-md mx-auto"
                      placeholder="Type your answer..."
                      autoFocus
                      disabled={isPaused}
                    />
                    <div className="flex gap-3 justify-center">
                      <button 
                        onClick={handleAnswerSubmit}
                        className="btn btn-primary btn-lg"
                        disabled={!userAnswer.trim() || isPaused}
                      >
                        <Check className="w-5 h-5" />
                        Check Answer
                      </button>
                      <button 
                        onClick={() => processQualityRating(0)}
                        className="btn btn-outline btn-lg"
                        disabled={isPaused}
                      >
                        <SkipForward className="w-5 h-5" />
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="text-lg">
                      <span className="text-gray-600">Your answer:</span>
                      <span className={`ml-3 font-medium text-lg ${
                        userAnswer.toLowerCase() === currentWord.word.toLowerCase() 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {userAnswer}
                      </span>
                    </div>
                    <div className="text-lg">
                      <span className="text-gray-600">Correct answer:</span>
                      <span className="ml-3 font-medium text-lg text-green-600">
                        {currentWord.word}
                      </span>
                    </div>
                    {currentWord.phonetic && (
                      <div className="text-lg text-gray-500">
                        {currentWord.phonetic}
                      </div>
                    )}
                  </div>

                  {/* Only show difficulty question for quality 3-5 */}
                  {(() => {
                    const isCorrect = userAnswer.toLowerCase() === currentWord.word.toLowerCase();
                    const usedHint = showHint;
                    
                    // Only show difficulty selection if user didn't use hint and got it correct
                    if (!usedHint && isCorrect) {
                      return (
                        <div className="space-y-4">
                          <div className="text-lg text-gray-700">How difficult was this word?</div>
                          <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                            {[3, 4, 5].map(qualityValue => (
                              <button
                                key={qualityValue}
                                onClick={() => processQualityRating(qualityValue as QualityRating)}
                                className={`btn btn-lg p-3 text-sm ${
                                  qualityValue === 3 ? 'btn-warning' : 'btn-success'
                                }`}
                                disabled={isPaused}
                              >
                                <div className="font-bold">{qualityValue}</div>
                                <div className="text-xs">
                                  {qualityValue === 3 ? 'Correct' :
                                   qualityValue === 4 ? 'Easy' : 'Perfect'}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sessionStats.total}
                </div>
                <div className="text-sm text-gray-600">Words Reviewed</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(accuracy)}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((Date.now() - sessionStats.startTime) / 1000 / 60)}m
                </div>
                <div className="text-sm text-gray-600">Time Spent</div>
              </div>
            </div>
          </div>
        ) : (
          /* Session Complete */
          <div className="text-center max-w-2xl mx-auto">
            <div className="card p-8">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Review Complete!</h2>
              <p className="text-lg text-gray-600 mb-8">
                Great job! You've completed your review session.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {sessionStats.total}
                  </div>
                  <div className="text-sm text-gray-600">Words Reviewed</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {Math.round(accuracy)}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {Math.round(sessionStats.totalTime / 1000 / 60)}m
                  </div>
                  <div className="text-sm text-gray-600">Time Spent</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {sessionStats.correct}
                  </div>
                  <div className="text-sm text-gray-600">Correct Answers</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={handleRestart}
                  className="btn btn-primary btn-lg w-full"
                >
                  <RotateCw className="w-5 h-5" />
                  Review Again
                </button>
                <button 
                  onClick={() => window.close()}
                  className="btn btn-secondary w-full"
                >
                  <Check className="w-4 h-4" />
                  Finish Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {pendingAction === 'pause' ? 'Pause Review?' : 'Stop Review?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {pendingAction === 'pause' 
                ? 'Are you sure you want to pause this review session? You can resume later.'
                : 'Are you sure you want to stop this review session? You will see your progress statistics.'
              }
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={cancelAction}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAction}
                className="btn btn-primary"
              >
                {pendingAction === 'pause' ? 'Pause' : 'Stop'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Statistics</h2>
              <p className="text-gray-600">
                {pendingAction === 'pause' ? 'Review session paused' : 'Review session completed'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {sessionStats.total}
                </div>
                <div className="text-sm text-gray-600">Words Reviewed</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {Math.round(accuracy)}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {Math.round(sessionStats.totalTime / 1000 / 60)}m
                </div>
                <div className="text-sm text-gray-600">Time Spent</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {sessionStats.correct}
                </div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
            </div>
            
            <div className="space-y-3">
              {pendingAction === 'pause' ? (
                <>
                  <button 
                    onClick={() => {
                      setShowStatsModal(false);
                      setIsPaused(false);
                    }}
                    className="btn btn-primary w-full"
                  >
                    <Play className="w-4 h-4" />
                    Resume Review
                  </button>
                  <button 
                    onClick={() => window.close()}
                    className="btn btn-secondary w-full"
                  >
                    <Check className="w-4 h-4" />
                    End Review
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => window.close()}
                    className="btn btn-primary w-full"
                  >
                    <Check className="w-4 h-4" />
                    Close Review
                  </button>
                  <button 
                    onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') })}
                    className="btn btn-secondary w-full"
                  >
                    <BookOpen className="w-4 h-4" />
                    Back to Main
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Review;
