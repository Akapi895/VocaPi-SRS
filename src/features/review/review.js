// Vocab SRS Review Window JavaScript

class VocabSRSReview {
  constructor() {
    this.currentReviewWords = [];
    this.currentWordIndex = 0;
    this.reviewStats = { reviewed: 0, correct: 0 };
    this.currentWordData = null;
    this.userAnswer = '';
    this.isAnswerRevealed = false;
    this.wasHintUsed = false;
    this.wasSkipped = false;

    this.timeTracker = new window.TimeTracker(30000);
    this.antiPaste = new window.AntiPasteGuard();

      this.analytics = null;
    this.gamification = null;
    this.initAnalytics();
    this.initGamification();

    this.init();
    this.timeTracker.setupWindowTracking();
    this.initSRSFallback();
  }

  async initAnalytics() {
    try {
      if (window.VocabAnalytics && typeof window.VocabAnalytics === 'function') {
        this.analytics = new window.VocabAnalytics();
        await this.analytics.ensureInitialized();
      }
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  async initGamification() {
    try {
      if (window.VocabGamification && typeof window.VocabGamification === 'function') {
        this.gamification = new window.VocabGamification();
        await this.gamification.initializeGamification();
      }
    } catch (error) {
      console.error('Failed to initialize gamification:', error);
    }
  }

  async init() {
    try {
        if (window.VocabAnalytics && typeof window.VocabAnalytics === 'function') {
            this.analytics = new window.VocabAnalytics();
            await this.analytics.ensureInitialized();
        }
    } catch (err) {
      console.warn('Analytics init failed:', err);
    }

    try {
        const data = await window.ReviewData.loadReviewData();
        if (data.error) {
            window.ReviewUI.showError(data.error);
            return;
        }
        
        this.currentReviewWords = data.words;
        this.currentWordIndex = 0;
        this.reviewStats = { reviewed: 0, correct: 0 };

        window.ReviewUI.showReviewScreen.call(this);
        window.ReviewUI.updateProgressUI.call(this);
        window.ReviewUI.updateSessionStats.call(this);
        window.ReviewUI.loadCurrentCard.call(this);
        
    } catch (err) {
        console.error('Failed to load review data:', err);
        window.ReviewUI.showError('Could not load review data. Please try again.');
    }

    this.bindEvents();
  }

  initSRSFallback() {
    if (!window.SRSAlgorithm) {
        window.SRSAlgorithm = {
            fallbackSM2Algorithm: (srs, quality) => {
                if (!srs) srs = {};
                srs.repetitions = (srs.repetitions || 0) + 1;
                srs.lastQuality = quality;
                srs.lastReview = new Date().toISOString();
                
                if (quality >= 3) {
                    srs.interval = Math.max(1, (srs.interval || 1) * 2);
                } else {
                    srs.interval = 1;
                }
                
                const nextReview = new Date();
                nextReview.setDate(nextReview.getDate() + srs.interval);
                srs.nextReview = nextReview.toISOString();
                
                return srs;
            }
        };
    }
  }

  bindEvents() {
    const safeBind = (id, event, handler) => {
      const el = this.getEl(id);
      if (el) el.addEventListener(event, handler);
    };

    safeBind('close-review', 'click', () => this.endReviewEarly());
    safeBind('submit-answer-btn', 'click', () => this.checkAnswer());
    safeBind('play-audio-btn', 'click', () => this.playCurrentAudio());
    safeBind('skip-word-btn', 'click', () => this.skipWord());
    safeBind('hint-btn', 'click', () => this.showHint());

    const answerInput = this.getEl('answer-input');
    if (answerInput) {
      answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.checkAnswer();
      });
      this.antiPaste.setup(answerInput);
    }

    document.querySelectorAll('.quality-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const quality = parseInt(e.currentTarget.dataset.quality, 10);
        this.submitQuality(quality);
      });
    });

    const retypeInput = this.getEl('retype-input');
    if (retypeInput) {
      retypeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.checkRetypeAnswer();
      });
      this.antiPaste.setup(retypeInput);
    }
    safeBind('retype-submit-btn', 'click', () => this.checkRetypeAnswer());

    safeBind('close-window-btn', 'click', () => this.closeWindow());
    safeBind('continue-review-btn', 'click', () => this.continueReview());
    safeBind('end-review-btn', 'click', () => this.endReviewEarly());

    safeBind('retry-btn', 'click', () => this.init());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeWindow();

      if (this.isAnswerRevealed && e.key >= '0' && e.key <= '5') {
        e.preventDefault();
        
        if (this.pendingQuality !== null) {
          // Trường hợp 1-3: Đang trong retype flow, không cho chọn quality
          return;
        } else if (e.key >= '0' && e.key <= '2') {
          // Trường hợp 4: Không cho chọn quality thấp khi đã trả lời đúng
          return;
        } else {
          // Trường hợp 4: Chỉ cho chọn quality 3,4,5
          this.submitQuality(parseInt(e.key, 10));
        }
      }

      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        const t = e.target;
        if (t && (t.id === 'answer-input' || t.id === 'retype-input')) {
          e.preventDefault();
          this.antiPaste.showWarning();
          return false;
        }
      }
    });
  }
  
  nextCard() {
    // Clear pending quality when moving to next card
    this.pendingQuality = null;
    this.wasSkipped = false;
    
    this.currentWordIndex++;
    
    if (this.currentWordIndex < this.currentReviewWords.length) {
        window.ReviewUI.loadCurrentCard.call(this);
    } else {
        this.completeReview();
    }
  }

  async submitQuality(quality) {
    const currentWord = this.currentReviewWords[this.currentWordIndex];
    if (!currentWord) return;

    // Store current quality for streak calculation
    this.lastQuality = quality;

    try {
        if (window.AdvancedSRSAlgorithm && typeof window.AdvancedSRSAlgorithm === 'function') {
            // Use advanced SRS algorithm
            const advancedSRS = new window.AdvancedSRSAlgorithm();
            const userStats = {
                accuracy: this.reviewStats.reviewed > 0 ? this.reviewStats.correct / this.reviewStats.reviewed : 0.8,
                streak: this.getCurrentStreak(),
                categoryAccuracy: {}
            };
            
            const responseTime = this.getResponseTime();
            const srsResult = advancedSRS.calculateNextReview(currentWord, quality, responseTime, userStats);
            
            // Update word with advanced SRS data
            if (!currentWord.srs) currentWord.srs = {};
            Object.assign(currentWord.srs, srsResult);
            
        } else if (typeof window.scheduleNextReview === "function") {
            window.scheduleNextReview(currentWord, quality >= 3);
        } else if (window.SRSAlgorithm) {
            currentWord.srs = window.SRSAlgorithm.fallbackSM2Algorithm(
                currentWord.srs || {},
                quality
            );
        } else {
            if (!currentWord.srs) currentWord.srs = {};
            currentWord.srs.repetitions = (currentWord.srs.repetitions || 0) + 1;
            currentWord.srs.lastQuality = quality;
            currentWord.srs.lastReview = new Date().toISOString();
            
            if (quality >= 3) {
                currentWord.srs.interval = Math.max(1, (currentWord.srs.interval || 1) * 2);
            } else {
                currentWord.srs.interval = 1;
            }
            
            const nextReview = new Date();
            nextReview.setDate(nextReview.getDate() + currentWord.srs.interval);
            currentWord.srs.nextReview = nextReview.toISOString();
        }

        try {
            await window.VocabStorage.updateWord(currentWord.id, currentWord);
        } catch (storageError) {
            console.warn("Storage update failed, continuing with local data:", storageError);
        }

        if (!this.analytics && window.VocabAnalytics && typeof window.VocabAnalytics === 'function') {
          try {
            this.analytics = new window.VocabAnalytics();
            await this.analytics.ensureInitialized();
          } catch (analyticsError) {
            console.error('Failed to create VocabAnalytics instance:', analyticsError);
          }
        }

        if (!this.gamification && window.VocabGamification && typeof window.VocabGamification === 'function') {
          try {
            this.gamification = new window.VocabGamification();
            await this.gamification.initializeGamification();
          } catch (gamificationError) {
            console.error('Failed to create Gamification instance:', gamificationError);
          }
        }

        if (this.analytics && typeof this.analytics.recordWordReview === 'function') {
          try {
            await this.analytics.recordWordReview(
              currentWord.id,
              this.userAnswer || '(quality only)',
              currentWord.word,
              quality,
              this.getResponseTime() || 0
            );
            
            if (this.gamification && typeof this.gamification.handleWordReview === 'function') {
              try {
                const isCorrect = this.userAnswer.toLowerCase() === currentWord.word.toLowerCase();
                await this.gamification.handleWordReview(
                  currentWord.id,
                  isCorrect,
                  quality,
                  this.getResponseTime() || 0
                );
              } catch (gamificationError) {
                console.error('Failed to update gamification:', gamificationError);
              }
            }
            
            const event = new CustomEvent('wordReviewed', {
              detail: { 
                wordId: currentWord.id, 
                userAnswer: this.userAnswer || '(quality only)',
                correctAnswer: currentWord.word,
                quality: quality,
                timeSpent: this.getResponseTime() || 0
              }
            });
            window.dispatchEvent(event);
            
          } catch (analyticsError) {
            console.error('Failed to record analytics:', analyticsError);
          }
        }

         // Only update stats for quality >= 3 (immediate completion)
         // For quality < 3, stats will be updated in saveReviewData()
         if (quality >= 3) {
           this.reviewStats.reviewed++;
           this.reviewStats.correct++;
           console.log('DEBUG: submitQuality - Quality >= 3, updated stats immediately:', {
             reviewed: this.reviewStats.reviewed,
             correct: this.reviewStats.correct
           });
         } else {
           console.log('DEBUG: submitQuality - Quality < 3, stats will be updated in saveReviewData()');
         }

         this.updateProgressInfo();
         
         // Update session stats display
         window.ReviewUI.updateSessionStats.call(this);
         
         // Update active time display
         if (this.timeTracker && typeof this.timeTracker.updateActiveTimeDisplay === 'function') {
           this.timeTracker.updateActiveTimeDisplay();
         }

         const qualityButtonsContainer = document.querySelector('.quality-buttons');
         if (qualityButtonsContainer) {
             qualityButtonsContainer.style.display = 'none';
         }

         const isLastWord = (this.currentWordIndex === this.currentReviewWords.length - 1);
         
         if (isLastWord) {
             this.completeReview();
         } else {
             if (quality >= 3) {
                 this.showContinueButton();
             } else {
                 // For quality 0, 1, 2: store quality and show retype section
                 this.pendingQuality = quality;
                 this.showRetypeSection();
             }
         }
        
    } catch (error) {
        console.error("Error updating review:", error);
        if (window.ReviewUI && window.ReviewUI.showError) {
            window.ReviewUI.showError(`Failed to update review: ${error.message}`);
        }
    }
  }

  checkAnswer() {
    const userInput = this.getEl('answer-input').value.trim();
    const currentWord = this.currentReviewWords[this.currentWordIndex];
    if (!currentWord) return;

    const isCorrect = userInput.toLowerCase() === currentWord.word.toLowerCase();
    
    this.userAnswer = userInput;
    
    if (this.wasHintUsed && !isCorrect) {
      this.pendingQuality = 0;
    } else if (!this.wasHintUsed && !isCorrect) {
      this.pendingQuality = 1;
    } else if (this.wasHintUsed && isCorrect) {
      this.pendingQuality = 2;
    } else {
      this.pendingQuality = null;
    }
    
    this.showFeedback(isCorrect, currentWord.word);
    
    // Don't record analytics in checkAnswer for retype flow
    // Analytics will be recorded in checkRetypeAnswer with correct quality
    if (this.pendingQuality === null && window.VocabAnalytics && typeof window.VocabAnalytics.recordWordReview === 'function') {
      try {
        window.VocabAnalytics.recordWordReview(
          currentWord.id,
          userInput,
          currentWord.word,
          4, // Quality 4 for correct answers in normal flow
          this.getResponseTime() || 0
        );
      } catch (analyticsError) {
        console.error('Failed to record answer check:', analyticsError);
      }
    }
  }

  checkRetypeAnswer() {
    const retypeInput = this.getEl('retype-input').value.trim();
    const currentWord = this.currentReviewWords[this.currentWordIndex];
    
    if (!currentWord) {
        console.error('No current word found');
        return;
    }
    
    // Use wordType if word is invalid (like "nan"), otherwise use word
    const correctWord = (currentWord.word && currentWord.word !== 'nan' && currentWord.word.length > 1) 
      ? currentWord.word 
      : (currentWord.wordType || currentWord.word);
    
    if (!retypeInput) {
        alert('Please type the word to continue');
        return;
    }
    
    console.log('Retype check:', {
      retypeInput: retypeInput,
      correctWord: correctWord,
      currentWord: currentWord.word,
      wordType: currentWord.wordType,
      match: retypeInput.toLowerCase() === correctWord.toLowerCase()
    });
    
    if (retypeInput.toLowerCase() === correctWord.toLowerCase()) {
        // Lấy quality đã được set từ checkAnswer() hoặc skipWord()
        const quality = this.pendingQuality !== null ? this.pendingQuality : (this.wasSkipped ? 0 : 1);
        
        console.log('=== DEBUG: Retype success ===');
        console.log('Retype success:', {
          pendingQuality: this.pendingQuality,
          wasSkipped: this.wasSkipped,
          finalQuality: quality,
          currentStats: { ...this.reviewStats }
        });
        
        // Save the review data with the quality
        this.saveReviewData(currentWord, quality);
        
        // Clear pending quality after successful retype
        this.pendingQuality = null;
        this.wasSkipped = false;
        
        // Check if this is the last word before proceeding
        const isLastWord = (this.currentWordIndex === this.currentReviewWords.length - 1);
        
        if (isLastWord) {
          this.completeReview();
        } else {
          this.nextCard();
        }
    } else {
        const input = document.getElementById('retype-input');
        input.style.animation = 'shake 0.5s';
        input.value = '';
        setTimeout(() => {
            input.style.animation = '';
            input.focus();
        }, 500);
    }
  }

  skipWord() {
    console.log('=== DEBUG: skipWord called ===');
    console.log('Current stats before skip:', { ...this.reviewStats });
    
    this.wasSkipped = true;
    this.userAnswer = '(skipped)';
    this.isAnswerRevealed = true;

    // Set pending quality for retype flow
    this.pendingQuality = 0;

    window.ReviewUI.toggleSection('#input-section', false);
    window.ReviewUI.toggleSection('#result-section', true);

    window.ReviewUI.toggleSection('.hint-section', false);
    window.ReviewUI.toggleSection('.audio-section', true);

    const currentWord = this.currentReviewWords[this.currentWordIndex];
    this.getEl('correct-answer').textContent = currentWord?.word ?? '';
    this.getEl('user-answer').textContent = this.userAnswer;
    this.getEl('phonetic-display').textContent = currentWord?.phonetic || '';

    const resultDiv = this.getEl('result-section');
    const userAnswerSpan = this.getEl('user-answer');
    resultDiv?.classList.remove('correct-answer', 'incorrect-answer');
    userAnswerSpan?.classList.remove('correct', 'incorrect');
    userAnswerSpan?.classList.add('skipped');

    window.ReviewUI.toggleSection('.quality-buttons', false);

    console.log('DEBUG: skipWord - will show retype section in 3 seconds');
    setTimeout(() => this.showRetypeSection(), 3000);
    setTimeout(() => this.playCurrentAudio(), 300);
  }

  showRetypeSection() {
    window.ReviewUI.toggleSection('.quality-buttons', false);
    window.ReviewUI.toggleSection('#retype-section', true);
    
    // Hide continue button when showing retype section
    const continueBtn = document.getElementById('continue-to-next-btn');
    if (continueBtn) {
      continueBtn.remove();
    }

    const retypeInput = this.getEl('retype-input');
    if (retypeInput) {
      retypeInput.value = '';
      this.antiPaste.setup(retypeInput);
      setTimeout(() => retypeInput.focus(), 100);
    }
  }

  hideRetypeSection() {
    window.ReviewUI.toggleSection('#retype-section', false);
    window.ReviewUI.toggleSection('.quality-buttons', true);
  }

  async saveReviewData(currentWord, quality) {
    try {
      console.log('=== DEBUG: saveReviewData called ===');
      console.log('Input data:', {
        word: currentWord.word,
        quality: quality,
        currentSRS: currentWord.srs,
        currentStats: { ...this.reviewStats }
      });
      
      // Update SRS data
      if (window.AdvancedSRSAlgorithm && typeof window.AdvancedSRSAlgorithm === 'function') {
        const advancedSRS = new window.AdvancedSRSAlgorithm();
        const userStats = {
          accuracy: this.reviewStats.reviewed > 0 ? this.reviewStats.correct / this.reviewStats.reviewed : 0.8,
          streak: this.getCurrentStreak(),
          categoryAccuracy: {}
        };
        
        const responseTime = this.getResponseTime();
        const srsResult = advancedSRS.calculateNextReview(currentWord, quality, responseTime, userStats);
        
        console.log('SRS result:', {
          inputQuality: quality,
          srsResult: srsResult
        });
        
        if (!currentWord.srs) currentWord.srs = {};
        Object.assign(currentWord.srs, srsResult);
        
      } else if (typeof window.scheduleNextReview === "function") {
        window.scheduleNextReview(currentWord, quality >= 3);
      } else if (window.SRSAlgorithm) {
        const oldSRS = currentWord.srs || {};
        currentWord.srs = window.SRSAlgorithm.fallbackSM2Algorithm(
          oldSRS,
          quality
        );
        
        console.log('Fallback SRS result:', {
          inputQuality: quality,
          oldSRS: oldSRS,
          newSRS: currentWord.srs
        });
      }

      // Save to storage
      if (window.VocabStorage && typeof window.VocabStorage.updateWord === 'function') {
        await window.VocabStorage.updateWord(currentWord.id, currentWord);
      } else if (window.StorageManager && typeof window.StorageManager.saveWord === 'function') {
        await window.StorageManager.saveWord(currentWord);
      }

      // Update word metadata
      currentWord.lastModified = new Date().toISOString();
      if (!currentWord.srs) currentWord.srs = {};
      currentWord.srs.lastReview = new Date().toISOString();
      currentWord.srs.lastQuality = quality;

      // Update review stats - FIXED LOGIC
      // For retype flow, this is the first time we're counting this word
      this.reviewStats.reviewed++;
      
      // Only count as correct if quality >= 3 (successful recall)
      if (quality >= 3) {
        this.reviewStats.correct++;
        console.log('DEBUG: Quality >= 3, counting as correct');
      } else {
        console.log('DEBUG: Quality < 3, NOT counting as correct');
      }

      console.log('DEBUG: Updated stats:', {
        reviewed: this.reviewStats.reviewed,
        correct: this.reviewStats.correct,
        accuracy: this.reviewStats.reviewed > 0 ? (this.reviewStats.correct / this.reviewStats.reviewed * 100).toFixed(1) + '%' : '0%'
      });

      // Update session stats display
      window.ReviewUI.updateSessionStats.call(this);
      
      // Update active time display
      if (this.timeTracker && typeof this.timeTracker.updateActiveTimeDisplay === 'function') {
        this.timeTracker.updateActiveTimeDisplay();
      }

      console.log('Review data saved:', {
        word: currentWord.word,
        quality: quality,
        lastQuality: currentWord.srs?.lastQuality,
        nextReview: currentWord.srs?.nextReview,
        lastReview: currentWord.srs?.lastReview,
        finalSRS: currentWord.srs
      });

      // Dispatch event to update popup
      window.dispatchEvent(new CustomEvent('wordUpdated', {
        detail: { wordId: currentWord.id, word: currentWord }
      }));

    } catch (error) {
      console.error("Error saving review data:", error);
    }
  }

  showHint() {
    if (this.isAnswerRevealed) return;

    this.wasHintUsed = true;

    const audioSection = document.querySelector('.audio-section');
    if (audioSection) audioSection.style.display = 'block';

    this.updateAudioButton();

    const hintBtn = this.getEl('hint-btn');
    if (hintBtn) hintBtn.style.display = 'none';
  }  

  async playCurrentAudio() {
    const currentWord = this.currentReviewWords[this.currentWordIndex];
    if (!currentWord) {
      return;
    }

    try {
      if (window.AudioPlayer && window.AudioPlayer.playAudio) {
        // Use wordType if word is invalid (like "nan"), otherwise use word
        const textToSpeak = (currentWord.word && currentWord.word !== 'nan' && currentWord.word.length > 1) 
          ? currentWord.word 
          : (currentWord.wordType || currentWord.word);
        
        // Always try to play audio, even if audioUrl is empty (will fallback to TTS)
        await window.AudioPlayer.playAudio(textToSpeak, currentWord.audioUrl || '');
      }
    } catch (error) {
      console.error("Audio playback failed:", error);
      if (window.ReviewUI && window.ReviewUI.showError) {
        window.ReviewUI.showError("Failed to play audio. Please try again later.");
      }
    }
  }
  
  async endReviewEarly() {
    const remaining = this.currentReviewWords.length - this.currentWordIndex;
    const msg = `End review session now? ${
      remaining > 0 ? `You have ${remaining} words remaining. ` : ""
    }Your progress will be saved.`;
    
    if (confirm(msg)) {
      await this.completeReview();
      // Clear pending quality after completing review
      this.pendingQuality = null;
    }
  }
  
  continueReview() {
    if (!this.remainingWords || this.remainingWords.length === 0) {
        return;
    }

    this.currentReviewWords = [...this.remainingWords];
    this.currentWordIndex = 0;
    
    this.remainingWords = [];

    window.ReviewUI.showReviewScreen.call(this);
    window.ReviewUI.updateProgressUI.call(this);
    window.ReviewUI.updateSessionStats.call(this);
    window.ReviewUI.loadCurrentCard.call(this);
}
    
  async completeReview() {
    // If we're in retype section, save the current word with pending quality
    // But only if it hasn't been saved yet (check if pendingQuality is not null)
    if (this.pendingQuality !== null && this.currentReviewWords[this.currentWordIndex]) {
      const currentWord = this.currentReviewWords[this.currentWordIndex];
      console.log('Saving pending word before ending review:', {
        word: currentWord.word,
        quality: this.pendingQuality
      });
      
      // Save the review data with pending quality
      await this.saveReviewData(currentWord, this.pendingQuality);
      
      // Clear pending quality after saving
      this.pendingQuality = null;
    }
    
    window.ReviewUI.hideAllScreens.call(this);
    document.getElementById('review-complete').style.display = 'block';

    const timeData = this.timeTracker.finalizeTimeTracking();
    
    document.getElementById('final-reviewed-count').textContent = this.reviewStats.reviewed;
    document.getElementById('final-accuracy-rate').textContent =
        `${window.calculateAccuracy ? window.calculateAccuracy(this.reviewStats.reviewed, this.reviewStats.correct) : 
        Math.round((this.reviewStats.correct / this.reviewStats.reviewed) * 100)}%`;

    // Use currentWordIndex to calculate remaining words
    // currentWordIndex represents the next word to be reviewed
    const remaining = Math.max(0, this.currentReviewWords.length - this.currentWordIndex);
    document.getElementById('remaining-words-count').textContent = remaining;

    console.log('Complete review debug:', {
      totalWords: this.currentReviewWords.length,
      reviewed: this.reviewStats.reviewed,
      currentWordIndex: this.currentWordIndex,
      remaining: remaining,
      pendingQuality: this.pendingQuality
    });

    const header = document.querySelector('.complete-header h2');
    const text = document.querySelector('.complete-header p');
    const continueBtn = document.getElementById('continue-review-btn');

    if (remaining > 0) {
        header.textContent = 'Review Paused!';
        text.textContent = `You've reviewed ${this.reviewStats.reviewed} out of ${this.currentReviewWords.length} words. Progress saved.`;
        continueBtn.style.display = 'inline-flex';
        
        this.remainingWords = this.currentReviewWords.slice(this.reviewStats.reviewed);
    } else {
        header.textContent = 'Review Complete!';
        text.textContent = `Great job! You've finished today's review session with ${this.reviewStats.reviewed} words.`;
        continueBtn.style.display = 'none';
        this.remainingWords = [];
    }

    await this.endAnalyticsSession(timeData);
}

  async endAnalyticsSession(timeData) {
    if (!this.analytics) return;

    try {
      const enhancedStats = {
        ...this.reviewStats,
        activeTimeSpent: timeData.activeTime,
        windowTimeSpent: timeData.windowTime,
        activeTimeMinutes: timeData.activeTimeMinutes
      };
    } catch (err) {
      console.error('Failed to end analytics session:', err);
    }
  }

  getEl(id) {
    return document.getElementById(id);
  }

  getEls(selector) {
    return document.querySelectorAll(selector);
  }

  showContinueButton() {
    const isLastWord = (this.currentWordIndex === this.currentReviewWords.length - 1);
    
    if (isLastWord) {
        return;
    }
    
    const continueBtn = document.createElement('button');
    continueBtn.id = 'continue-to-next-btn';
    continueBtn.className = 'btn btn-primary';
    continueBtn.innerHTML = '<span class="btn-icon">▶️</span> Continue to Next Word';
    continueBtn.addEventListener('click', () => this.nextCard());
    
    const resultSection = this.getEl('result-section');
    if (resultSection) {
        const existingBtn = resultSection.querySelector('#continue-to-next-btn');
        if (existingBtn) existingBtn.remove();
        
        resultSection.appendChild(continueBtn);
    }
  }

  showFeedback(isCorrect, correctAnswer) {
    this.isAnswerRevealed = true;

    window.ReviewUI.toggleSection('#input-section', false);
    window.ReviewUI.toggleSection('#result-section', true);

    const currentWord = this.currentReviewWords[this.currentWordIndex];

    this.getEl('correct-answer').textContent = correctAnswer || '';
    this.getEl('user-answer').textContent = this.userAnswer || '';
    
    const phoneticDisplay = this.getEl('phonetic-display');
    if (phoneticDisplay && currentWord) {
        phoneticDisplay.textContent = currentWord.phonetic || '';
    }

    const meaningDisplay = this.getEl('meaning-display');
    if (meaningDisplay && currentWord) {
        meaningDisplay.textContent = currentWord.meaning || '';
    }

    window.ReviewUI.toggleSection('.hint-section', false);
    window.ReviewUI.toggleSection('.audio-section', true);

    this.updateAudioButton();

    const resultDiv = this.getEl('result-section');
    const userAnswerSpan = this.getEl('user-answer');
    resultDiv?.classList.remove('correct-answer', 'incorrect-answer');
    userAnswerSpan?.classList.remove('correct', 'incorrect');

    if (isCorrect) {
        resultDiv?.classList.add('correct-answer');
        userAnswerSpan?.classList.add('correct');
    } else {
        resultDiv?.classList.add('incorrect-answer');
        userAnswerSpan?.classList.add('incorrect');
    }

    this.suggestQuality(isCorrect);

    setTimeout(() => {
        this.playCurrentAudio();
    }, 500);
}

  suggestQuality(isCorrect) {
    this.getEls('.quality-btn').forEach(btn => {
        btn.classList.remove('suggested');
        btn.style.display = 'inline-block';
    });

    const qualityButtonsContainer = document.querySelector('.quality-buttons');
    if (!qualityButtonsContainer) return;

    if (this.wasSkipped) {
        // Trường hợp 1: Skip word = Quality 0 → retype section
        qualityButtonsContainer.style.display = 'none';
        console.log('DEBUG: suggestQuality - Word was skipped, will show retype section');
        setTimeout(() => {
            this.showRetypeSection();
        }, 3000);
        
    } else if (this.pendingQuality !== null) {
        // Trường hợp 1-3: Quality đã được set tự động → retype section
        qualityButtonsContainer.style.display = 'none';
        setTimeout(() => {
            this.showRetypeSection();
        }, 2000);
        
    } else {
        // Trường hợp 4: User chọn quality 3,4,5 → không retype
        qualityButtonsContainer.style.display = 'block';
        this.disableQualityButtons([0, 1, 2]);
        this.highlightQualityButtons([3, 4, 5]);
    }
}

disableQualityButtons(qualities = []) {
    qualities.forEach(q => {
        const btn = document.querySelector(`[data-quality="${q}"]`);
        if (btn) {
            btn.style.display = 'none';
            btn.disabled = true;
        }
    });
}

highlightQualityButtons(qualities = []) {
    qualities.forEach(q => {
        const btn = document.querySelector(`[data-quality="${q}"]`);
        if (btn) {
            btn.classList.add('suggested');
            btn.style.display = 'inline-block';
            btn.disabled = false;
        }
    });
}

updateAudioButton() {
    const audioBtn = this.getEl('play-audio-btn');
    if (!audioBtn) return;
    
    const currentWord = this.currentReviewWords[this.currentWordIndex];
    
    if (currentWord?.audioUrl) {
        audioBtn.innerHTML = '<span class="btn-icon">🔊</span> Pronunciation';
        audioBtn.title = 'Click to play audio again';
    } else {
        audioBtn.innerHTML = '<span class="btn-icon">🗣️</span> Pronunciation';
        audioBtn.title = 'Click to hear pronunciation (TTS)';
    }
    
    audioBtn.disabled = false;
    audioBtn.style.display = 'inline-flex';
}

updateProgressInfo() {
    const currentProgress = this.getEl('current-progress');
    const totalProgress = this.getEl('total-progress');
    
    if (currentProgress) {
        currentProgress.textContent = this.reviewStats.reviewed;
    }
    
    if (totalProgress) {
        totalProgress.textContent = this.currentReviewWords.length;
    }
  }

  getResponseTime() {
    if (this.currentWordStartTime) {
      return Date.now() - this.currentWordStartTime;
    }
    return null;
  }

  getCurrentStreak() {
    if (!this.recentQualities) {
      this.recentQualities = [];
    }
    
    this.recentQualities.push(this.lastQuality || 0);
    
    if (this.recentQualities.length > 10) {
      this.recentQualities = this.recentQualities.slice(-10);
    }
    
    let streak = 0;
    for (let i = this.recentQualities.length - 1; i >= 0; i--) {
      if (this.recentQualities[i] >= 3) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  async closeWindow() {
    try {
        const timeData = this.timeTracker.finalizeTimeTracking();
        await this.endAnalyticsSession(timeData);
        window.close();
        
    } catch (error) {
        console.error('Error closing review window:', error);
        
        try {
            window.close();
        } catch (fallbackError) {
            console.error('Fallback close also failed:', fallbackError);
            alert('Please close this window manually. Your progress has been saved.');
        }
    }
}
}

if (typeof window !== 'undefined') {
  window.VocabSRSReview = VocabSRSReview;
}