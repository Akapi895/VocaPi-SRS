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
          // In retype flow, quality selection disabled
          return;
        } else if (e.key >= '0' && e.key <= '2') {
          // Low quality selection disabled for correct answers
          return;
        } else {
          // Only allow quality 3,4,5
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

         if (quality >= 3) {
           this.reviewStats.reviewed++;
           this.reviewStats.correct++;
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

  async checkRetypeAnswer() {
    const retypeInput = this.getEl('retype-input').value.trim();
    const currentWord = this.currentReviewWords[this.currentWordIndex];
    
    if (!currentWord) {
        return;
    }
    
    const correctWord = (currentWord.word && currentWord.word !== 'nan' && currentWord.word.length > 1) 
      ? currentWord.word 
      : (currentWord.wordType || currentWord.word);
    
    if (!retypeInput) {
        alert('Please type the word to continue');
        return;
    }
    
    
    if (retypeInput.toLowerCase() === correctWord.toLowerCase()) {
        const quality = this.pendingQuality !== null ? this.pendingQuality : (this.wasSkipped ? 0 : 1);
        
        // Save the review data with the quality
        await this.saveReviewData(currentWord, quality);
        
        this.pendingQuality = null;
        this.wasSkipped = false;
        
        const isLastWord = (this.currentWordIndex === this.currentReviewWords.length - 1);
        
        if (isLastWord) {
          await this.completeReview();
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
    
    this.wasSkipped = true;
    this.userAnswer = '(skipped)';
    this.isAnswerRevealed = true;

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

    setTimeout(() => this.showRetypeSection(), 3000);
    setTimeout(() => this.playCurrentAudio(), 300);
  }

  showRetypeSection() {
    window.ReviewUI.toggleSection('.quality-buttons', false);
    window.ReviewUI.toggleSection('#retype-section', true);
    
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

      this.reviewStats.reviewed++;
      
      if (quality >= 3) {
        this.reviewStats.correct++;
      }

      // Update session stats display
      window.ReviewUI.updateSessionStats.call(this);
      
      // Update active time display
      if (this.timeTracker && typeof this.timeTracker.updateActiveTimeDisplay === 'function') {
        this.timeTracker.updateActiveTimeDisplay();
      }

      if (!this.analytics && window.VocabAnalytics && typeof window.VocabAnalytics === 'function') {
        try {
          this.analytics = new window.VocabAnalytics();
          await this.analytics.ensureInitialized();
        } catch (analyticsError) {
          console.error('Failed to create VocabAnalytics instance in saveReviewData:', analyticsError);
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
              const isCorrect = (this.userAnswer || '').toLowerCase() === currentWord.word.toLowerCase();
              await this.gamification.handleWordReview(
                currentWord.id,
                isCorrect,
                quality,
                this.getResponseTime() || 0
              );
            } catch (gamificationError) {
              console.error('Failed to update gamification in saveReviewData:', gamificationError);
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
          console.error('Failed to record analytics in saveReviewData:', analyticsError);
        }
      }

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
        const textToSpeak = (currentWord.word && currentWord.word !== 'nan' && currentWord.word.length > 1) 
          ? currentWord.word 
          : (currentWord.wordType || currentWord.word);
        
        await window.AudioPlayer.playAudio(textToSpeak, currentWord.audioUrl || '');
      }
    } catch (error) {
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
    if (this.pendingQuality !== null && this.currentReviewWords[this.currentWordIndex]) {
      const currentWord = this.currentReviewWords[this.currentWordIndex];
      
      await this.saveReviewData(currentWord, this.pendingQuality);
      
      this.pendingQuality = null;
    }
    
    window.ReviewUI.hideAllScreens.call(this);
    document.getElementById('review-complete').style.display = 'block';

    const timeData = this.timeTracker.finalizeTimeTracking();
    
    const reviewed = this.reviewStats?.reviewed || 0;
    document.getElementById('final-reviewed-count').textContent = reviewed;
    
    document.getElementById('final-accuracy-rate').textContent =
        `${window.calculateAccuracy ? window.calculateAccuracy(this.reviewStats.reviewed, this.reviewStats.correct) : 
        Math.round((this.reviewStats.correct / this.reviewStats.reviewed) * 100)}%`;

    const remaining = Math.max(0, this.currentReviewWords.length - this.reviewStats.reviewed);
    document.getElementById('remaining-words-count').textContent = remaining;


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
        // Skip word = Quality 0 → retype section
        qualityButtonsContainer.style.display = 'none';
        setTimeout(() => {
            this.showRetypeSection();
        }, 3000);
        
    } else if (this.pendingQuality !== null) {
        // Quality set automatically → retype section
        qualityButtonsContainer.style.display = 'none';
        setTimeout(() => {
            this.showRetypeSection();
        }, 2000);
        
    } else {
        // User selects quality 3,4,5 → no retype
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
        try {
            window.close();
        } catch (fallbackError) {
            alert('Please close this window manually. Your progress has been saved.');
        }
    }
}
}

if (typeof window !== 'undefined') {
  window.VocabSRSReview = VocabSRSReview;
}