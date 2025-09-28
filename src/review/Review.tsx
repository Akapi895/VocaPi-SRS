import React, { useState, useEffect } from 'react';
import { useChromeStorage } from '@/hooks/useChromeStorage';
import { useCustomizationSettings } from '@/hooks/useCustomizationSettings';
import { VocabWord, QualityRating } from '@/types';
import {
  createUpdatedWord,
  determineQualityRating,
  isAnswerCorrect,
  calculateAccuracy,
  calculateProgress,
  calculateSessionDuration,
  updateSessionStats,
  createReviewSession,
  getWordsForReview,
  shuffleArray,
  maskWordInSentence,
  playWordPronunciation,
  calculateAnalyticsUpdate,
  calculateGamificationUpdate,
  updateDailyStreak,
  countWordsReviewedToday,
  isValidInput,
  requiresRetry
} from './utils';
import { 
  ArrowLeft,
  Lightbulb,
  Volume2,
  Check,
  SkipForward,
  Play,
  Pause,
  RotateCw,
  ArrowRight
} from 'lucide-react';

const Review: React.FC = () => {
  const { data, loading, error, updateWord, updateAnalytics, updateGamification } = useChromeStorage();
  const { srs: srsSettings, study: studySettings, audio: audioSettings } = useCustomizationSettings();
  
  // Anti-paste handler with user feedback
  const handleAntiPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    // Show user feedback that paste is not allowed
    const input = e.target as HTMLInputElement;
    const originalPlaceholder = input.placeholder;
    const originalClassList = input.className;
    
    // Visual feedback
    input.placeholder = "❌ Paste not allowed - Type manually";
    input.className = `${originalClassList} border-red-300 bg-red-50`;
    
    // Reset after 2 seconds
    setTimeout(() => {
      input.placeholder = originalPlaceholder;
      input.className = originalClassList;
    }, 2000);
  };

  // Anti-context menu handler (right-click menu)
  const handleContextMenu = (e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault(); // Disable right-click context menu
  };

  // Enhanced input change handler with paste detection
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const newValue = e.target.value;
    const oldValue = e.target.dataset.oldValue || '';
    
    // Clear retry error when user starts typing again
    if (isRetryMode && retryError) {
      setRetryError('');
    }
    
    // More strict paste detection for retry mode
    const pasteThreshold = isRetryMode ? 1 : 3;
    if (newValue.length - oldValue.length > pasteThreshold) {
      // Likely a paste operation - reject it
      e.target.value = oldValue;
      setter(oldValue);
      
      // Show feedback
      const originalPlaceholder = e.target.placeholder;
      e.target.placeholder = "❌ Please type manually";
      setTimeout(() => {
        e.target.placeholder = originalPlaceholder;
      }, 2000);
      return;
    }
    
    // Store old value for next comparison
    e.target.dataset.oldValue = newValue;
    setter(newValue);
  };

  // Handle keyboard events to prevent paste shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent Ctrl+V (paste), Ctrl+Shift+V (paste without formatting)
    if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      const input = e.target as HTMLInputElement;
      const originalPlaceholder = input.placeholder;
      input.placeholder = "❌ Paste shortcut disabled";
      setTimeout(() => {
        input.placeholder = originalPlaceholder;
      }, 2000);
      return;
    }
    
    // Prevent other paste-related shortcuts
    if (e.ctrlKey && e.shiftKey && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      return;
    }
    
    // Allow normal typing but prevent some cheating methods
    if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
      // Prevent select all to avoid copy-paste workflows
      e.preventDefault();
      return;
    }
  };
  
  // Calculate display time for session stats
  const getDisplayTime = (): number => {
    // If session is complete and totalTime is available, use it
    if (sessionComplete && sessionStats.totalTime > 0) {
      return Math.round(sessionStats.totalTime / 1000 / 60);
    }
    // Otherwise calculate from current time
    return calculateSessionDuration(sessionStats.startTime);
  };
  
  const [reviewWords, setReviewWords] = useState<VocabWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showReviewStep, setShowReviewStep] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<QualityRating | null>(null);
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [retryQuality, setRetryQuality] = useState<QualityRating | null>(null);
  const [retryError, setRetryError] = useState<string>('');

  // Initialize review session
  useEffect(() => {
    if (data) {
      const dueWords = getWordsForReview(data.vocabWords);
      if (dueWords.length > 0) {
        // Shuffle words for better learning
        const shuffled = shuffleArray(dueWords);
        setReviewWords(shuffled);
        setSessionStats(prev => ({ ...prev, startTime: Date.now() }));
      }
    }
  }, [data]);

  // Handle answer submission
  const handleAnswerSubmit = () => {
    if (!isValidInput(userAnswer)) return;
    
    const currentWord = reviewWords[currentWordIndex];
    const isCorrect = isAnswerCorrect(userAnswer, currentWord.word);
    
    // Special handling for retry mode
    if (isRetryMode) {
      if (isCorrect) {
        // Play success sound effect if enabled
        if (audioSettings.soundEffects) {
          // Create a simple success beep
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5 note
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5 note
          
          gainNode.gain.setValueAtTime(audioSettings.speechVolume * 0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        }

        // Correct answer in retry mode - session stats already updated in first attempt
        // Don't update session stats again to avoid double counting
        
        setRetryError('');
        const originalQuality = retryQuality || 1;
        
        // Reset retry mode states first
        setIsRetryMode(false);
        setRetryQuality(null);
        setUserAnswer('');
        
        // Process the word with original quality and move to next word
        // Use setTimeout to ensure state updates are processed
        setTimeout(() => {
          processQualityRating(originalQuality);
        }, 50);
        return;
      } else {
        // Play error sound effect if enabled
        if (audioSettings.soundEffects) {
          // Create a simple error beep
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3 note (lower, error sound)
          
          gainNode.gain.setValueAtTime(audioSettings.speechVolume * 0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        }

        // Wrong answer in retry mode - show error and clear input
        setRetryError('❌ Incorrect! Please try again with the correct spelling.');
        setUserAnswer('');
        return;
      }
    }
    
    // Normal mode
    setShowAnswer(true);
    
    // Update session stats immediately for first attempt (not retry)
    setSessionStats(prev => updateSessionStats(prev, isCorrect));
    
    // Auto-play pronunciation after answer check (if enabled)
    if (studySettings.autoPlayAudio) {
      playWordPronunciation(currentWord.word, currentWord.pronunUrl || currentWord.audioUrl, {
        speechRate: audioSettings.speechRate,
        speechVolume: audioSettings.speechVolume,
        voiceSelection: audioSettings.voiceSelection
      });
    }
  };

  // Handle skip - show review step immediately
  const handleSkip = () => {
    setSelectedQuality(0); // Skip = quality 0
    setShowAnswer(true);
    setShowReviewStep(true);
    
    // Auto-play pronunciation after skip (if enabled)
    const currentWord = reviewWords[currentWordIndex];
    if (studySettings.autoPlayAudio) {
      playWordPronunciation(currentWord.word, currentWord.pronunUrl || currentWord.audioUrl, {
        speechRate: audioSettings.speechRate,
        speechVolume: audioSettings.speechVolume,
        voiceSelection: audioSettings.voiceSelection
      });
    }
  };


  // Handle quality rating selection
  const handleQualityRating = (quality: QualityRating) => {
    setSelectedQuality(quality);
    setShowReviewStep(true);
  };

  // Process quality rating and move to next word
  const processQualityRating = async (quality: QualityRating) => {
    if (isProcessing) return; // Prevent multiple calls
    
    setIsProcessing(true);
    try {
      const currentWord = reviewWords[currentWordIndex];
      const isCorrect = isAnswerCorrect(userAnswer, currentWord.word);
      const finalQuality = determineQualityRating({
        isCorrect,
        usedHint: showHint,
        userSelectedQuality: quality === 0 ? undefined : quality,
        isSkipped: quality === 0
      });
      
      // Check if this word requires retry (quality <= 2) - but only if NOT already in retry mode and retry is enabled
      if (requiresRetry(finalQuality) && !isRetryMode && studySettings.retryOnMistake) {
        // DO NOT update session stats here - wait until retry is completed
        // This prevents double counting when user fails then retries successfully
        
        // Enter retry mode - stay in showReviewStep with retry interface
        setIsRetryMode(true);
        setRetryQuality(finalQuality);
        setRetryError('');
        setUserAnswer('');
        setShowHint(false);
        setSelectedQuality(quality);
        setShowReviewStep(true); // Stay in review step
        setIsProcessing(false);
        return;
      }
      
      // If we're in retry mode, use the original quality from first attempt
      // If not in retry mode, use the calculated final quality
      const actualQuality = isRetryMode ? (retryQuality || finalQuality) : finalQuality;
      
      // Create updated word with new SRS values
      const updatedWord = createUpdatedWord(currentWord, actualQuality, srsSettings);

      // Update word, analytics, and gamification - wait for all to complete
      const updatePromises = [updateWord(currentWord.id, updatedWord)];

      if (data) {
        const sessionTime = Date.now() - sessionStats.startTime;
        
        const analyticsUpdate = calculateAnalyticsUpdate({
          currentAnalytics: data.analytics,
          sessionTime,
          finalQuality
        });
        
        const gamificationUpdate = calculateGamificationUpdate({
          currentGamification: data.gamification,
          sessionTime,
          finalQuality
        });

        updatePromises.push(updateAnalytics(analyticsUpdate));
        updatePromises.push(updateGamification(gamificationUpdate));
      }

      // Wait for all updates to complete before proceeding
      await Promise.all(updatePromises);

      // Move to next word or complete review
      if (currentWordIndex < reviewWords.length - 1) {
        // Reset all states first before moving to next word
        setShowAnswer(false);
        setUserAnswer('');
        setShowHint(false);
        setShowReviewStep(false);
        setSelectedQuality(null);
        setIsRetryMode(false);
        setRetryQuality(null);
        setRetryError('');
        // Then move to next word
        setCurrentWordIndex(prev => prev + 1);
      } else {
        // Complete review session
        const endTime = Date.now();
        const totalTime = endTime - sessionStats.startTime;
        
        // Create review session record
        const reviewSession = createReviewSession({
          startTime: sessionStats.startTime,
          endTime,
          wordsReviewed: reviewWords.map(w => w.id),
          correctAnswers: sessionStats.correct,
          totalAnswers: sessionStats.total
        });

        // Save review session to chrome storage
        try {
          const result = await chrome.storage.local.get(['reviewSessions']);
          const existingSessions = result.reviewSessions || [];
          const updatedSessions = [...existingSessions, reviewSession];
          await chrome.storage.local.set({ reviewSessions: updatedSessions });
        } catch (error) {
          console.error('Failed to save review session:', error);
        }

        // Check and update daily streak after completing session
        if (data && data.vocabWords && data.gamification) {
          try {
            // Fix daily goal for existing users who have 20 set to 10
            let dailyGoal = data.gamification.dailyGoal || 10;
            if (dailyGoal === 20) {
              dailyGoal = 10;
              // Update storage with correct daily goal
              const fixedGamification = { ...data.gamification, dailyGoal: 10 };
              await updateGamification(fixedGamification);
            }
            
            const wordsReviewedToday = countWordsReviewedToday(data.vocabWords);
            
            const streakUpdate = updateDailyStreak({
              currentGamification: data.gamification,
              wordsReviewedToday,
              dailyGoal
            });
            
            // Only update if streak was incremented
            if (streakUpdate.streakIncremented) {
              const streakGamificationUpdate = {
                ...data.gamification,
                streak: streakUpdate.streak,
                lastStreakUpdate: streakUpdate.lastStreakUpdate
              };
              
              await updateGamification(streakGamificationUpdate);
            }
          } catch (error) {
            console.error('Failed to update daily streak:', error);
          }
        }

        // Update session stats and complete session atomically
        setSessionStats(prev => ({ ...prev, totalTime }));
        setIsRetryMode(false);
        setRetryQuality(null);
        setTimeout(() => {
          setSessionComplete(true);
        }, 0);
      }
    } catch (error) {
      // Continue to next word even if there's an error
      if (currentWordIndex < reviewWords.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      } else {
        setSessionComplete(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Restart review
  const handleRestart = () => {
    if (!data) return;
    
    const dueWords = getWordsForReview(data.vocabWords);
    if (dueWords.length > 0) {
      const shuffled = shuffleArray(dueWords);
      setReviewWords(shuffled);
      setCurrentWordIndex(0);
      setShowAnswer(false);
      setUserAnswer('');
      setShowHint(false);
      setShowReviewStep(false);
      setSelectedQuality(null);
      setIsRetryMode(false);
      setRetryQuality(null);
      setRetryError('');
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-dark-background dark:to-dark-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-foreground-secondary">Loading review session...</p>
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

  if (reviewWords.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-dark-background dark:to-dark-background-secondary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No Words to Review!</h2>
          <p className="text-foreground-secondary mb-6">
            Great job! You've completed all your reviews for today. 
            Come back later for more words to review.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.close()}
              className="btn btn-primary w-full hover-scale focus-ring"
            >
              <Check className="w-4 h-4" />
              Close Review
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = reviewWords[currentWordIndex];
  const progress = calculateProgress(currentWordIndex, reviewWords.length);
  const accuracy = calculateAccuracy(sessionStats);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-dark-background dark:to-dark-background-secondary">
      {/* Header */}
      <div className="bg-background shadow-soft border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBack}
                className="btn btn-text btn-sm hover-scale focus-ring px-4 py-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-foreground">Review Session</h1>
                  {isRetryMode && (
                    <span className="bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300 text-xs px-3 py-1 rounded-full font-medium animate-pulse-gentle">
                      Retry Mode
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground-secondary">
                  {currentWordIndex + 1} of {reviewWords.length} words
                  {isRetryMode && retryQuality !== null && (
                    <span className="text-warning-600 dark:text-warning-400 ml-2">
                      • Please retype this word correctly
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePause}
                className="btn btn-outline btn-sm hover-scale focus-ring px-4 py-2"
              >
                {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">
                  {Math.round(accuracy)}% accuracy
                </div>
                <div className="text-xs text-foreground-secondary">
                  {sessionStats.correct}/{sessionStats.total} correct
                </div>
                <div className="text-xs text-primary-600 dark:text-primary-400">
                  🔥 Streak: {data?.gamification?.streak || 0}
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          {studySettings.showProgress && (
            <div className="mt-4">
              <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {!sessionComplete ? (
          <div className="space-y-6">
            {/* Flashcard */}
            <div className="card hover-lift p-8 text-center min-h-[400px] flex flex-col justify-center bg-gradient-to-br from-background to-surface border-primary-100 dark:border-primary-900/30">
              <div className="text-3xl font-semibold mb-4 text-foreground gradient-text">
                {currentWord.meaning}
              </div>
              
              {showHint && (
                <div className="space-y-4 mb-6">
                  {/* Pronunciation Button - Always show when hint is visible */}
                  <div className="flex flex-col items-center space-y-3">
                    {(currentWord.pronunUrl || currentWord.audioUrl) && (
                      <button 
                        onClick={() => playWordPronunciation(
                          currentWord.word, 
                          currentWord.pronunUrl || currentWord.audioUrl,
                          {
                            speechRate: audioSettings.speechRate,
                            speechVolume: audioSettings.speechVolume,
                            voiceSelection: audioSettings.voiceSelection
                          }
                        )}
                        className="btn btn-outline hover-scale focus-ring px-5 py-2"
                      >
                        <Volume2 className="w-4 h-4 mr-2" />
                        Play Pronunciation
                      </button>
                    )}
                    
                    {/* Example with masked word */}
                    {currentWord.example && (
                      <div className="text-lg text-foreground-secondary p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800 max-w-2xl">
                        <div className="font-medium text-foreground mb-2">Example:</div>
                        {maskWordInSentence(currentWord.example, currentWord.word)}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {!showAnswer ? (
                // Step 1: Input form for user answer
                <div className="space-y-6">
                  {studySettings.enableHints && (
                    <button 
                      onClick={() => setShowHint(!showHint)}
                      className="btn btn-outline hover-scale focus-ring px-6 py-3 mb-4"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      {showHint ? 'Hide' : 'Show'} Hint
                    </button>
                  )}
                  
                  <div className="space-y-4">
                    <div className="text-lg text-foreground-secondary">What is the English word?</div>
                    <input 
                      type="text"
                      value={userAnswer}
                      onChange={(e) => handleInputChange(e, setUserAnswer)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                      onKeyDown={handleKeyDown}
                      onPaste={handleAntiPaste}
                      onContextMenu={handleContextMenu}
                      onDrop={(e) => e.preventDefault()} // Prevent drag & drop
                      onDragOver={(e) => e.preventDefault()}
                      className="input input-focus text-lg text-center max-w-md mx-auto"
                      placeholder="Type your answer..."
                      autoFocus
                      disabled={isPaused}
                      autoComplete="off" // Disable autocomplete
                      spellCheck={false} // Disable spell check suggestions
                    />
                    <div className="flex gap-4 justify-center mt-6">
                      <button 
                        onClick={handleAnswerSubmit}
                        className="btn btn-primary btn-lg hover-scale focus-ring px-8 py-4"
                        disabled={!isValidInput(userAnswer) || isPaused}
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Check Answer
                      </button>
                      <button 
                        onClick={handleSkip}
                        className="btn btn-outline btn-lg hover-scale focus-ring px-8 py-4"
                        disabled={isPaused}
                      >
                        <SkipForward className="w-5 h-5 mr-2" />
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              ) : showAnswer && !showReviewStep ? (
                // Step 2: Show answer result and quality rating
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="text-lg">
                      <span className="text-foreground-secondary">Your answer:</span>
                      <span className={`ml-3 font-medium text-lg ${
                        userAnswer.toLowerCase() === currentWord.word.toLowerCase() 
                          ? 'text-success-600 dark:text-success-400' 
                          : 'text-danger-600 dark:text-danger-400'
                      }`}>
                        {userAnswer || 'Skipped'}
                      </span>
                    </div>
                    <div className="text-lg">
                      <span className="text-foreground-secondary">Correct answer:</span>
                      <span className="ml-3 font-medium text-lg text-success-600 dark:text-success-400">
                        {currentWord.word}
                      </span>
                    </div>
                    {currentWord.phonetic && (
                      <div className="text-lg text-foreground-muted">
                        {currentWord.phonetic}
                      </div>
                    )}
                  </div>

                  {/* Conditional Quality Rating based on performance */}
                  {(() => {
                    const isCorrect = userAnswer.toLowerCase() === currentWord.word.toLowerCase();
                    const usedHint = showHint;
                    
                    // Auto-determine quality for incorrect answers or hint usage
                    if (usedHint && !isCorrect) {
                      // Used hint + wrong = quality 0 (auto)
                      setTimeout(() => handleQualityRating(0), 1000);
                      return (
                        <div className="text-center text-foreground-secondary animate-pulse-gentle">
                          Quality automatically set to Blackout
                        </div>
                      );
                    } else if (usedHint && isCorrect) {
                      // Used hint + correct = quality 2 (auto)
                      setTimeout(() => handleQualityRating(2), 1000);
                      return (
                        <div className="text-center text-foreground-secondary animate-pulse-gentle">
                          Quality automatically set to Merely Recognized
                        </div>
                      );
                    } else if (!usedHint && !isCorrect) {
                      // No hint + wrong = quality 1 (auto)
                      setTimeout(() => handleQualityRating(1), 1000);
                      return (
                        <div className="text-center text-foreground-secondary animate-pulse-gentle">
                          Quality automatically set to Forgotten
                        </div>
                      );
                    } else if (!usedHint && isCorrect) {
                      // No hint + correct = allow user to choose 3-5
                      return (
                        <div className="space-y-4">
                          <div className="text-lg text-foreground-secondary">How difficult was this word?</div>
                          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                            {[3, 4, 5].map(qualityValue => (
                              <button
                                key={qualityValue}
                                onClick={() => handleQualityRating(qualityValue as QualityRating)}
                                className={`btn btn-lg hover-scale focus-ring px-4 py-3 flex flex-col items-center justify-center min-h-[80px] ${
                                  qualityValue === 3 ? 'btn-outline border-orange-400 text-orange-600 hover:bg-orange-50 dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-900/20' :
                                  qualityValue === 4 ? 'btn-secondary' : 
                                  'btn-primary'
                                }`}
                                disabled={isPaused || isProcessing}
                              >
                                <div className="text-lg font-semibold mb-1">
                                  {qualityValue === 3 ? '😅' : qualityValue === 4 ? '🙂' : '😎'}
                                </div>
                                <div className="text-sm font-medium">
                                  {qualityValue === 3 ? 'Hard to recall' :
                                   qualityValue === 4 ? 'Not bad' : 'Too Easy'}
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
              ) : showAnswer && showReviewStep ? (
                // Step 3: Review step - show word details and allow continue
                <div className="space-y-6">
                  {/* Review Step - Show word details and audio */}
                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-success-600 dark:text-success-400 mb-4 gradient-text">
                      {currentWord.word}
                    </div>
                    
                    {currentWord.phonetic && (
                      <div className="text-lg text-foreground-muted mb-4">
                        {currentWord.phonetic}
                      </div>
                    )}
                    
                    <div className="text-lg text-foreground-secondary mb-4">
                      <strong className="text-foreground">Meaning:</strong> {currentWord.meaning}
                    </div>
                    
                    {/* Audio Button */}
                    {(currentWord.pronunUrl || currentWord.audioUrl) && (
                      <button 
                        onClick={() => playWordPronunciation(
                          currentWord.word, 
                          currentWord.pronunUrl || currentWord.audioUrl,
                          {
                            speechRate: audioSettings.speechRate,
                            speechVolume: audioSettings.speechVolume,
                            voiceSelection: audioSettings.voiceSelection
                          }
                        )}
                        className="btn btn-outline hover-scale focus-ring px-6 py-3 mb-6"
                      >
                        <Volume2 className="w-4 h-4 mr-2" />
                        Listen to Pronunciation
                      </button>
                    )}
                    
                    {/* Example */}
                    {currentWord.example && (
                      <div className="text-lg text-foreground-secondary p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800 mb-4">
                        <strong className="text-foreground">Example:</strong> {currentWord.example}
                      </div>
                    )}
                  </div>

                  {/* Retry Interface or Continue Button */}
                  {isRetryMode ? (
                    // Show retry interface within review step
                    <div className="space-y-6">
                      <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-6">
                        <div className="text-center mb-4">
                          <div className="text-2xl mb-2">🔄</div>
                          <div className="text-lg font-semibold text-amber-800 mb-2">
                            Practice this word again
                          </div>
                          <div className="text-sm text-amber-700">
                            Please retype the correct answer to proceed to the next word
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <input 
                            type="text"
                            value={userAnswer}
                            onChange={(e) => handleInputChange(e, setUserAnswer)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                            onKeyDown={handleKeyDown}
                            onPaste={handleAntiPaste}
                            onContextMenu={handleContextMenu}
                            onDrop={(e) => e.preventDefault()}
                            onDragOver={(e) => e.preventDefault()}
                            className="input text-lg text-center max-w-md mx-auto border-amber-300 focus:border-amber-500 bg-white"
                            placeholder="Retype the correct word..."
                            autoFocus
                            disabled={isPaused}
                            autoComplete="off"
                            spellCheck={false}
                          />
                          
                          {/* Retry error message */}
                          {retryError && (
                            <div className="text-red-600 text-sm text-center font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2 mx-auto max-w-md">
                              {retryError}
                            </div>
                          )}
                          
                          <div className="text-center mt-4">
                            <button 
                              onClick={handleAnswerSubmit}
                              className="btn btn-warning btn-lg px-8 py-4"
                              disabled={!isValidInput(userAnswer) || isPaused}
                            >
                              <Check className="w-5 h-5 mr-2" />
                              Submit Retry
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Normal continue button
                    <div className="space-y-4">
                      <button 
                        onClick={() => processQualityRating(selectedQuality!)}
                        className="btn btn-primary btn-lg px-8 py-4 mt-6"
                        disabled={isProcessing}
                      >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <ArrowRight className="w-5 h-5 mr-2" />
                              Continue to Next Word
                            </>
                          )}
                        </button>
                      </div>
                  )}
                </div>
              ) : null}
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
                  {getDisplayTime()}m
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
                    {getDisplayTime()}m
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
              
              <div className="space-y-4">
                <button 
                  onClick={handleRestart}
                  className="btn btn-primary btn-lg w-full px-8 py-4"
                >
                  <RotateCw className="w-5 h-5 mr-3" />
                  Review Again
                </button>
                <button 
                  onClick={() => window.close()}
                  className="btn btn-secondary w-full px-8 py-4"
                >
                  <Check className="w-4 h-4 mr-3" />
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
            <div className="flex gap-4 justify-end">
              <button 
                onClick={cancelAction}
                className="btn btn-outline px-6 py-3"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAction}
                className="btn btn-primary px-6 py-3"
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
                  {calculateSessionDuration(sessionStats.startTime)}m
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
            
            <div className="space-y-4">
              {pendingAction === 'pause' ? (
                <>
                  <button 
                    onClick={() => {
                      setShowStatsModal(false);
                      setIsPaused(false);
                    }}
                    className="btn btn-primary w-full px-8 py-4"
                  >
                    <Play className="w-4 h-4 mr-3" />
                    Resume Review
                  </button>
                  <button 
                    onClick={() => window.close()}
                    className="btn btn-secondary w-full px-8 py-4"
                  >
                    <Check className="w-4 h-4 mr-3" />
                    End Review
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => window.close()}
                    className="btn btn-primary w-full px-8 py-4"
                  >
                    <Check className="w-4 h-4 mr-3" />
                    Close Review
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
