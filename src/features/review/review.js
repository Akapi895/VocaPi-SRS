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

    this.init();
    this.timeTracker.setupWindowTracking();
    this.initSRSFallback();
  }

  async init() {
    try {
        if (window.VocabAnalytics && typeof window.VocabAnalytics === 'function') {
            this.analytics = new window.VocabAnalytics();
            await this.analytics.ensureInitialized();
            await this.analytics.startSession();
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
        this.submitQuality(parseInt(e.key, 10));
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

        this.reviewStats.reviewed++;
        if (quality >= 3) this.reviewStats.correct++;

        this.updateProgressInfo();

        const isLastWord = (this.currentWordIndex === this.currentReviewWords.length - 1);
        
        if (isLastWord) {
            this.completeReview();
        } else {
            if (quality < 3) {
                setTimeout(() => this.showRetypeSection(), 2000);
            } else {
                this.showContinueButton();
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
    
    this.showFeedback(isCorrect, currentWord.word);
    this.pendingQuality = isCorrect ? (this.wasHintUsed ? 3 : 4) : 1;
  }

  checkRetypeAnswer() {
    const retypeInput = this.getEl('retype-input').value.trim();
    const correctWord = this.currentWordData.word;
    
    if (!retypeInput) {
        alert('Please type the word to continue');
        return;
    }
    
    if (retypeInput.toLowerCase() === correctWord.toLowerCase()) {
        const quality = this.wasSkipped ? 0 : 1;
        
        this.submitQuality(quality).then(() => {
            this.nextCard();
        });
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

    const retypeInput = this.getEl('retype-input');
    if (retypeInput) {
      retypeInput.value = '';
      this.antiPaste.setup(retypeInput);
      setTimeout(() => retypeInput.focus(), 100);
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
    if (!currentWord || !currentWord.audioUrl) {
      return;
    }

    try {
      if (window.AudioPlayer && window.AudioPlayer.playAudio) {
        await window.AudioPlayer.playAudio(currentWord.word, currentWord.audioUrl);
      }
    } catch (error) {
      console.error("Audio playback failed:", error);
      if (window.ReviewUI && window.ReviewUI.showError) {
        window.ReviewUI.showError("Failed to play audio. Please try again later.");
      }
    }
  }
  
  endReviewEarly() {
    const remaining = this.currentReviewWords.length - this.currentWordIndex;
    const msg = `End review session now? ${
      remaining > 0 ? `You have ${remaining} words remaining. ` : ""
    }Your progress will be saved.`;
    
    if (confirm(msg)) this.completeReview();
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
    window.ReviewUI.hideAllScreens.call(this);
    document.getElementById('review-complete').style.display = 'block';

    const timeData = this.timeTracker.finalizeTimeTracking();
    
    document.getElementById('final-reviewed-count').textContent = this.reviewStats.reviewed;
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
        qualityButtonsContainer.style.display = 'none';
        
        setTimeout(() => {
            this.submitQuality(0);
        }, 3000);
        
    } else if (!isCorrect) {
        if (this.wasHintUsed) {
            qualityButtonsContainer.style.display = 'none';
            
            setTimeout(() => {
                this.submitQuality(0);
            }, 3000);
            
        } else {
            qualityButtonsContainer.style.display = 'none';
            
            setTimeout(() => {
                this.submitQuality(1);
            }, 3000);
        }
        
    } else {
        if (this.wasHintUsed) {
            qualityButtonsContainer.style.display = 'none';
            
            setTimeout(() => {
                this.submitQuality(2);
            }, 3000);
            
        } else {
            qualityButtonsContainer.style.display = 'block';
            
            this.disableQualityButtons([0, 1, 2]);
        }
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
    // Simple streak calculation based on recent quality scores
    if (!this.recentQualities) {
      this.recentQualities = [];
    }
    
    // Add current quality to recent qualities
    this.recentQualities.push(this.lastQuality || 0);
    
    // Keep only last 10 qualities
    if (this.recentQualities.length > 10) {
      this.recentQualities = this.recentQualities.slice(-10);
    }
    
    // Calculate streak of quality >= 3
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
        console.error('❌ Error closing review window:', error);
        
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