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
    
    this.init();
  }
  
  async init() {
    console.log('Initializing Vocab SRS Review Window');
    
    // Initialize analytics tracking
    if (window.VocabAnalytics) {
      await window.VocabAnalytics.startSession();
    }
    
    await this.loadReviewData();
    this.bindEvents();
  }
  
  async loadReviewData() {
    try {
      // Get due words from storage
      this.currentReviewWords = await window.VocabUtils.VocabStorage.getDueWords();
      
      if (this.currentReviewWords.length === 0) {
        this.showError('No words are due for review');
        return;
      }
      
      this.currentWordIndex = 0;
      this.reviewStats = { reviewed: 0, correct: 0 };
      
      this.showReviewScreen();
      this.loadCurrentCard();
      
    } catch (error) {
      console.error('Error loading review data:', error);
      this.showError('Failed to load review data');
    }
  }
  
  bindEvents() {
    // Close button
    document.getElementById('close-review').addEventListener('click', () => this.closeWindow());
    
    // Review controls
    document.getElementById('submit-answer-btn').addEventListener('click', () => this.checkAnswer());
    document.getElementById('play-audio-btn').addEventListener('click', () => this.playCurrentAudio());
    document.getElementById('skip-word-btn').addEventListener('click', () => this.skipWord());
    document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
    
    // Answer input with anti-paste protection
    const answerInput = document.getElementById('answer-input');
    answerInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.checkAnswer();
      }
    });
    this.setupAntiPasteProtection(answerInput);
    
    // Quality buttons
    document.querySelectorAll('.quality-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const quality = parseInt(e.currentTarget.dataset.quality);
        this.submitQuality(quality);
      });
    });
    
    // Retype functionality with anti-paste protection
    const retypeInput = document.getElementById('retype-input');
    retypeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.checkRetypeAnswer();
      }
    });
    this.setupAntiPasteProtection(retypeInput);
    document.getElementById('retype-submit-btn').addEventListener('click', () => this.checkRetypeAnswer());
    
    // Complete screen
    document.getElementById('close-window-btn').addEventListener('click', () => this.closeWindow());
    document.getElementById('continue-review-btn').addEventListener('click', () => this.continueReview());
    
    // End review button
    document.getElementById('end-review-btn').addEventListener('click', () => this.endReviewEarly());
    
    // Error retry
    document.getElementById('retry-btn').addEventListener('click', () => this.loadReviewData());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeWindow();
      }
      
      // Quality rating shortcuts (0-5)
      if (e.key >= '0' && e.key <= '5' && this.isAnswerRevealed) {
        e.preventDefault();
        const quality = parseInt(e.key);
        this.submitQuality(quality);
      }
      
      // Prevent Ctrl+A (Select All), Ctrl+C (Copy), Ctrl+V (Paste), Ctrl+X (Cut)
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        const target = e.target;
        if (target && (target.id === 'answer-input' || target.id === 'retype-input')) {
          e.preventDefault();
          this.showAntiPasteWarning();
          return false;
        }
      }
    });
  }
  
  showReviewScreen() {
    this.hideAllScreens();
    document.querySelector('.review-main').style.display = 'flex';
    
    // Update progress
    document.getElementById('current-card').textContent = this.currentWordIndex + 1;
    document.getElementById('total-cards').textContent = this.currentReviewWords.length;
    this.updateSessionStats();
  }
  
  loadCurrentCard() {
    if (this.currentWordIndex >= this.currentReviewWords.length) {
      this.completeReview();
      return;
    }
    
    this.currentWordData = this.currentReviewWords[this.currentWordIndex];
    this.userAnswer = '';
    this.isAnswerRevealed = false;
    this.wasHintUsed = false;
    this.wasSkipped = false;
    this.currentWordStartTime = Date.now(); // Track timing for analytics
    
    // Show Vietnamese meaning first (reverse review mode)
    document.getElementById('meaning-display').textContent = this.currentWordData.meaning;
    document.getElementById('example-display').textContent = this.currentWordData.example || '';
    
    // Initially hide example and audio, show hint button
    document.getElementById('example-display').style.display = 'none';
    document.getElementById('hint-btn').style.display = 'inline-flex';
    document.getElementById('hint-btn').disabled = false;
    document.querySelector('.audio-section').style.display = 'none';
    document.querySelector('.hint-section').style.display = 'block';
    
    // Show input section, hide result section
    document.getElementById('input-section').style.display = 'block';
    document.getElementById('result-section').style.display = 'none';
    document.getElementById('retype-section').style.display = 'none';
    
    // Update progress info in end review section
    document.getElementById('current-progress').textContent = this.currentWordIndex;
    document.getElementById('total-progress').textContent = this.currentReviewWords.length;
    
    // Clear and focus input
    const answerInput = document.getElementById('answer-input');
    answerInput.value = '';
    setTimeout(() => answerInput.focus(), 100);
    
    // Apply anti-paste protection to the input
    this.setupAntiPasteProtection(answerInput);
    
    // Reset quality buttons visibility
    const qualityBtns = document.querySelectorAll('.quality-btn');
    qualityBtns.forEach(btn => {
      btn.style.display = 'inline-block';
    });
    
    // Update progress
    document.getElementById('current-card').textContent = this.currentWordIndex + 1;
    
    // Show audio button (always available with TTS fallback)
    const audioBtn = document.getElementById('play-audio-btn');
    if (this.currentWordData.audioUrl) {
      audioBtn.innerHTML = '<span class="btn-icon">🔊</span> Pronunciation';
    } else {
      audioBtn.innerHTML = '<span class="btn-icon">🗣️</span> Pronunciation (TTS)';
    }
  }
  
  showHint() {
    if (this.isAnswerRevealed) return;
    
    this.wasHintUsed = true;
    
    // Show only audio, don't show example
    document.querySelector('.audio-section').style.display = 'block';
    
    // Update audio button based on availability
    const audioBtn = document.getElementById('play-audio-btn');
    if (this.currentWordData.audioUrl) {
      audioBtn.innerHTML = '<span class="btn-icon">🔊</span> Pronunciation';
    } else {
      audioBtn.innerHTML = '<span class="btn-icon">🗣️</span> Pronunciation (TTS)';
    }
    
    // Disable hint button
    const hintBtn = document.getElementById('hint-btn');
    hintBtn.style.display = 'none'; // Hide completely instead of showing "Hint Used"
  }
  
  checkAnswer() {
    if (this.isAnswerRevealed) return;
    
    const userInput = document.getElementById('answer-input').value.trim();
    if (!userInput) {
      alert('Please enter your answer first');
      return;
    }
    
    this.userAnswer = userInput;
    this.isAnswerRevealed = true;
    
    // Hide input section, show result section
    document.getElementById('input-section').style.display = 'none';
    document.getElementById('result-section').style.display = 'block';
    
    // Hide hint button and always show audio button in result section
    document.querySelector('.hint-section').style.display = 'none';
    document.querySelector('.audio-section').style.display = 'block';
    
    // Show the correct answer and user's answer
    document.getElementById('correct-answer').textContent = this.currentWordData.word;
    document.getElementById('user-answer').textContent = this.userAnswer;
    document.getElementById('phonetic-display').textContent = this.currentWordData.phonetic || '';
    
    // Check if answer is correct (case-insensitive, trim spaces)
    const isCorrect = this.userAnswer.toLowerCase() === this.currentWordData.word.toLowerCase();
    
    // Show result styling
    const resultDiv = document.getElementById('result-section');
    const userAnswerSpan = document.getElementById('user-answer');
    const qualityButtons = document.querySelector('.quality-buttons');
    
    if (isCorrect) {
      resultDiv.classList.add('correct-answer');
      resultDiv.classList.remove('incorrect-answer');
      userAnswerSpan.classList.add('correct');
      userAnswerSpan.classList.remove('incorrect');
      
      if (this.wasHintUsed) {
        // Used hint + correct = auto-select Hard (2)
        qualityButtons.style.display = 'none';
        setTimeout(() => {
          this.submitQuality(2);
        }, 3000);
      } else {
        // No hint + correct = show quality buttons (3, 4, 5 only)
        qualityButtons.style.display = 'block';
        // Hide lower quality buttons (0, 1, 2) and show only 3, 4, 5
        const qualityBtns = qualityButtons.querySelectorAll('.quality-btn');
        qualityBtns.forEach(btn => {
          const quality = parseInt(btn.dataset.quality);
          if (quality < 3) {
            btn.style.display = 'none';
          } else {
            btn.style.display = 'inline-block';
          }
        });
      }
      
      // Auto-suggest quality based on correctness
      this.suggestQuality(isCorrect);
    } else {
      resultDiv.classList.add('incorrect-answer');
      resultDiv.classList.remove('correct-answer');
      userAnswerSpan.classList.add('incorrect');
      userAnswerSpan.classList.remove('correct');
      
      // Wrong answer = require user to retype the word
      qualityButtons.style.display = 'none';
      
      // Show a "Continue" button instead of auto-advancing
      setTimeout(() => {
        this.showRetypeSection();
      }, 3000); // 3 seconds to see the result
    }
    
    // Auto-play audio after showing answer (always play for all cases)
    setTimeout(() => {
      this.playCurrentAudio();
    }, 300);
  }
  
  suggestQuality(isCorrect) {
    // Reset all quality buttons
    document.querySelectorAll('.quality-btn').forEach(btn => {
      btn.classList.remove('suggested');
    });
    
    // Auto-suggest quality based on user actions
    let suggestedQuality;
    
    if (this.wasSkipped) {
      // If user skipped, suggest blackout (0)
      suggestedQuality = 0;
    } else if (!isCorrect) {
      // If incorrect answer, suggest incorrect (1)
      suggestedQuality = 1;
    } else if (this.wasHintUsed) {
      // If hint was used but answer is correct, suggest hard (2)
      suggestedQuality = 2;
    } else if (isCorrect) {
      // If correct without hint, highlight the good options (3, 4, 5) but don't auto-select
      // Let user choose their level of confidence
      document.querySelectorAll('[data-quality="3"], [data-quality="4"], [data-quality="5"]').forEach(btn => {
        btn.classList.add('suggested');
      });
      return; // Don't auto-select a single button
    }
    
    // Auto-select for specific cases (skip, wrong, hint)
    if (suggestedQuality !== undefined) {
      const suggestedBtn = document.querySelector(`[data-quality="${suggestedQuality}"]`);
      if (suggestedBtn) {
        suggestedBtn.classList.add('suggested');
      }
    }
  }
  
  skipWord() {
    // Mark as skipped
    this.wasSkipped = true;
    
    // Show the answer without user input
    this.userAnswer = '(skipped)';
    this.isAnswerRevealed = true;
    
    document.getElementById('input-section').style.display = 'none';
    document.getElementById('result-section').style.display = 'block';
    
    // Hide hint button and always show audio button in result section
    document.querySelector('.hint-section').style.display = 'none';
    document.querySelector('.audio-section').style.display = 'block';
    
    document.getElementById('correct-answer').textContent = this.currentWordData.word;
    document.getElementById('user-answer').textContent = this.userAnswer;
    document.getElementById('phonetic-display').textContent = this.currentWordData.phonetic || '';
    
    // Style as skipped
    const resultDiv = document.getElementById('result-section');
    const userAnswerSpan = document.getElementById('user-answer');
    const qualityButtons = document.querySelector('.quality-buttons');
    
    resultDiv.classList.remove('correct-answer', 'incorrect-answer');
    userAnswerSpan.classList.remove('correct', 'incorrect');
    userAnswerSpan.classList.add('skipped');
    
    // Hide quality buttons for skipped words - require retype
    qualityButtons.style.display = 'none';
    
    // Show retype section instead of auto-advancing
    setTimeout(() => {
      this.showRetypeSection();
    }, 3000); // 3 seconds to see the result

    // Auto-play audio after showing answer for skipped words
    setTimeout(() => {
      this.playCurrentAudio();
    }, 300);
  }
  
  showRetypeSection() {
    // Hide quality buttons and show retype section
    document.querySelector('.quality-buttons').style.display = 'none';
    document.getElementById('retype-section').style.display = 'block';
    
    // Clear and focus retype input
    const retypeInput = document.getElementById('retype-input');
    retypeInput.value = '';
    
    // Apply anti-paste protection
    this.setupAntiPasteProtection(retypeInput);
    
    setTimeout(() => retypeInput.focus(), 100);
  }
  
  checkRetypeAnswer() {
    const retypeInput = document.getElementById('retype-input').value.trim();
    const correctWord = this.currentWordData.word;
    
    if (!retypeInput) {
      alert('Please type the word to continue');
      return;
    }
    
    // Check if retyped word is correct (case-insensitive)
    if (retypeInput.toLowerCase() === correctWord.toLowerCase()) {
      // Correct retype - determine quality based on original attempt
      const quality = this.wasSkipped ? 0 : 1; // 0 for skipped, 1 for wrong answer
      this.submitQuality(quality);
    } else {
      // Still wrong - shake the input and clear it
      const input = document.getElementById('retype-input');
      input.style.animation = 'shake 0.5s';
      input.value = '';
      setTimeout(() => {
        input.style.animation = '';
        input.focus();
      }, 500);
    }
  }

  // Anti-paste protection setup
  setupAntiPasteProtection(inputElement) {
    if (!inputElement) return;
    
    // Prevent all forms of paste
    inputElement.addEventListener('paste', (e) => {
      e.preventDefault();
      this.showAntiPasteWarning();
      return false;
    });
    
    // Prevent drag and drop
    inputElement.addEventListener('drop', (e) => {
      e.preventDefault();
      this.showAntiPasteWarning();
      return false;
    });
    
    inputElement.addEventListener('dragover', (e) => {
      e.preventDefault();
      return false;
    });
    
    // Prevent context menu (right-click)
    inputElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showAntiPasteWarning();
      return false;
    });
    
    // Monitor for suspicious rapid input (possible programmatic input)
    let lastInputTime = 0;
    let rapidInputCount = 0;
    
    inputElement.addEventListener('input', (e) => {
      const currentTime = Date.now();
      
      // If multiple characters were added at once (length > 1), it might be paste
      const inputLength = e.target.value.length;
      const timeDiff = currentTime - lastInputTime;
      
      if (inputLength > 1 && timeDiff < 50) {
        rapidInputCount++;
        if (rapidInputCount > 2) {
          // Suspicious activity - clear input and warn
          e.target.value = '';
          this.showAntiPasteWarning();
          rapidInputCount = 0;
        }
      } else {
        rapidInputCount = 0;
      }
      
      lastInputTime = currentTime;
    });
    
    // Additional protection: monitor clipboard API
    inputElement.addEventListener('keydown', (e) => {
      // Block Ctrl+V, Cmd+V, Ctrl+Shift+V, etc.
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        this.showAntiPasteWarning();
        return false;
      }
    });
  }
  
  showAntiPasteWarning() {
    // Create or update warning message
    let warningDiv = document.getElementById('anti-paste-warning');
    
    if (!warningDiv) {
      warningDiv = document.createElement('div');
      warningDiv.id = 'anti-paste-warning';
      warningDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ef4444;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        text-align: center;
        animation: antiPasteShake 0.6s ease-in-out;
      `;
      
      // Add CSS animation
      if (!document.getElementById('anti-paste-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'anti-paste-styles';
        styleSheet.textContent = `
          @keyframes antiPasteShake {
            0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
            10%, 30%, 50%, 70%, 90% { transform: translate(-50%, -50%) rotate(-3deg); }
            20%, 40%, 60%, 80% { transform: translate(-50%, -50%) rotate(3deg); }
          }
          
          .shake {
            animation: shake 0.5s ease-in-out;
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
        `;
        document.head.appendChild(styleSheet);
      }
      
      document.body.appendChild(warningDiv);
    }
    
    warningDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px;">🚫</span>
        <div>
          <div style="font-weight: bold; margin-bottom: 4px;">No Copy-Paste Allowed!</div>
          <div style="font-size: 14px; opacity: 0.9;">Please type the word manually to learn effectively</div>
        </div>
      </div>
    `;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (warningDiv && warningDiv.parentNode) {
        warningDiv.remove();
      }
    }, 3000);
    
    // Add shake effect to current input
    const activeInput = document.activeElement;
    if (activeInput && (activeInput.id === 'answer-input' || activeInput.id === 'retype-input')) {
      activeInput.classList.add('shake');
      setTimeout(() => {
        activeInput.classList.remove('shake');
      }, 500);
    }
  }

  async playCurrentAudio() {
    if (!this.currentWordData) return;
    
    const audioBtn = document.getElementById('play-audio-btn');
    const originalText = audioBtn.innerHTML;
    
    try {
      audioBtn.innerHTML = '<span class="btn-icon">⏸</span> Playing...';
      audioBtn.disabled = true;
      
      const word = this.currentWordData.word;
      const audioUrl = this.currentWordData.audioUrl;
      
      await window.VocabAPI.AudioPlayer.playAudio(word, audioUrl);
      
    } catch (error) {
      console.error('Audio playback error:', error);
    } finally {
      audioBtn.innerHTML = originalText;
      audioBtn.disabled = false;
    }
  }
  
  async submitQuality(quality) {
    if (!this.currentWordData || !this.isAnswerRevealed) return;
    
    try {
      console.log('Submitting quality:', quality, 'for word:', this.currentWordData.word);
      console.log('Current SRS data:', this.currentWordData.srs);
      
      // Validate quality parameter
      if (typeof quality !== 'number' || quality < 0 || quality > 5) {
        throw new Error(`Invalid quality value: ${quality}`);
      }
      
      // Ensure current word has valid SRS data
      if (!this.currentWordData.srs || typeof this.currentWordData.srs !== 'object') {
        console.error('Invalid SRS data:', this.currentWordData.srs);
        throw new Error('Invalid SRS data structure');
      }
      
      // Update SRS data with fallback to basic algorithm
      let updatedSRS;
      try {
        updatedSRS = window.VocabUtils.SRSAlgorithm.updateCard(this.currentWordData.srs, quality, {
          useAdvanced: false  // Force use of basic algorithm for stability
        });
      } catch (srsError) {
        console.error('SRS algorithm error:', srsError);
        // Fallback to manual SRS update
        updatedSRS = this.fallbackSRSUpdate(this.currentWordData.srs, quality);
      }
      
      console.log('Updated SRS data:', updatedSRS);
      
      // Validate updated SRS data
      if (!updatedSRS || typeof updatedSRS !== 'object') {
        throw new Error('Failed to generate valid SRS data');
      }
      
      // Save updated word
      await window.VocabUtils.VocabStorage.updateWord(this.currentWordData.id, { srs: updatedSRS });
      console.log('Successfully saved word update');
      
      // Update stats
      this.reviewStats.reviewed++;
      
      // Track analytics
      if (window.VocabAnalytics) {
        const timeSpent = Date.now() - (this.currentWordStartTime || Date.now());
        await window.VocabAnalytics.recordWordReview(
          this.currentWordData.id,
          this.userAnswer,
          this.currentWordData.word,
          quality,
          timeSpent
        );
      }
      
      // Consider correct if user got it right AND rated quality >= 3
      const wasCorrect = this.userAnswer.toLowerCase() === this.currentWordData.word.toLowerCase();
      if (wasCorrect && quality >= 3) {
        this.reviewStats.correct++;
      }
      
      // Update session stats display
      this.updateSessionStats();
      
      // Move to next card
      this.currentWordIndex++;
      this.loadCurrentCard();
      
    } catch (error) {
      console.error('Error submitting quality:', error);
      console.error('Error details:', {
        wordId: this.currentWordData?.id,
        quality: quality,
        srsData: this.currentWordData?.srs,
        errorMessage: error.message,
        errorStack: error.stack
      });
      this.showError(`Failed to save review result: ${error.message}`);
    }
  }
  
  // Fallback SRS update method
  fallbackSRSUpdate(srsData, quality) {
    const updatedSRS = { ...srsData };
    
    // Basic SM-2 Algorithm implementation
    if (quality >= 3) {
      // Successful review
      if (updatedSRS.repetitions === 0) {
        updatedSRS.interval = 1;
      } else if (updatedSRS.repetitions === 1) {
        updatedSRS.interval = 6;
      } else {
        updatedSRS.interval = Math.round(updatedSRS.interval * (updatedSRS.easiness || 2.5));
      }
      
      updatedSRS.repetitions = (updatedSRS.repetitions || 0) + 1;
      updatedSRS.easiness = (updatedSRS.easiness || 2.5) + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      
      if (updatedSRS.easiness < 1.3) {
        updatedSRS.easiness = 1.3;
      }
    } else {
      // Failed review
      updatedSRS.repetitions = 0;
      updatedSRS.interval = 1;
    }
    
    // Set next review date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextReview = new Date(today);
    nextReview.setDate(today.getDate() + updatedSRS.interval);
    updatedSRS.nextReview = nextReview.toISOString();
    
    return updatedSRS;
  }
  
  endReviewEarly() {
    const remainingWords = this.currentReviewWords.length - this.currentWordIndex;
    const confirmMessage = remainingWords > 0 
      ? `End review session now? You have ${remainingWords} words remaining. Your progress will be saved.`
      : 'End review session now? Your progress will be saved.';
      
    if (confirm(confirmMessage)) {
      this.completeReview();
    }
  }
  
  continueReview() {
    // Reset to show the review screen and continue from where we left off
    this.showReviewScreen();
    this.loadCurrentCard();
  }
  
  updateSessionStats() {
    document.getElementById('reviewed-count').textContent = this.reviewStats.reviewed;
    
    const accuracy = this.reviewStats.reviewed > 0 
      ? Math.round((this.reviewStats.correct / this.reviewStats.reviewed) * 100)
      : 0;
    document.getElementById('accuracy-display').textContent = `${accuracy}%`;
  }
  
  completeReview() {
    this.hideAllScreens();
    document.getElementById('review-complete').style.display = 'block';
    
    // Show final stats
    document.getElementById('final-reviewed-count').textContent = this.reviewStats.reviewed;
    
    const accuracy = this.reviewStats.reviewed > 0 
      ? Math.round((this.reviewStats.correct / this.reviewStats.reviewed) * 100)
      : 0;
    document.getElementById('final-accuracy-rate').textContent = `${accuracy}%`;
    
    // Calculate and show remaining words
    const remainingWords = this.currentReviewWords.length - this.currentWordIndex;
    document.getElementById('remaining-words-count').textContent = remainingWords;
    
    // Update complete message and show continue button if there are remaining words
    const completeHeader = document.querySelector('.complete-header h2');
    const completeText = document.querySelector('.complete-header p');
    const continueBtn = document.getElementById('continue-review-btn');
    
    if (remainingWords > 0) {
      completeHeader.textContent = 'Review Paused!';
      completeText.textContent = `You've reviewed ${this.reviewStats.reviewed} out of ${this.currentReviewWords.length} words. Your progress has been saved.`;
      continueBtn.style.display = 'inline-flex';
    } else {
      completeHeader.textContent = 'Review Complete!';
      completeText.textContent = "Great job! You've finished today's review session.";
      continueBtn.style.display = 'none';
    }
  }
  
  closeWindow() {
    if (confirm('Are you sure you want to close the review session?')) {
      // End analytics session
      if (window.VocabAnalytics) {
        window.VocabAnalytics.endSession(this.reviewStats);
      }
      
      window.close();
    }
  }
  
  showLoading() {
    this.hideAllScreens();
    document.getElementById('loading-state').style.display = 'block';
  }
  
  showError(message) {
    this.hideAllScreens();
    document.getElementById('error-state').style.display = 'block';
    document.getElementById('error-message').textContent = message;
  }
  
  hideAllScreens() {
    const screens = [
      '.review-main',
      '#review-complete',
      '#loading-state',
      '#error-state'
    ];
    
    screens.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.display = 'none';
      }
    });
  }
}

// Initialize review window when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new VocabSRSReview();
});
