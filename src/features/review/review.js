// Vocab SRS Review Window JavaScript
import { SRSAlgorithm, calculateAccuracy } from "../../core/utils.js"; 
import { AudioPlayer } from "../../core/api.js";
import VocabStorage from "../../core/storage.js";
import VocabAnalytics from "../analytics/core/vocab-analytics.js"; 
import { scheduleNextReview } from "../srs/index.js";

import TimeTracker from "./time-tracker.js";
import AntiPasteGuard from "./anti-paste.js";
import { ReviewUI } from "./review-ui.js";
import { ReviewData } from "./review-data.js";

export default class VocabSRSReview {
  // ---------------------------
  // 1. Khởi tạo & vòng đời
  // ---------------------------
  constructor() {
    this.currentReviewWords = [];
    this.currentWordIndex = 0;
    this.reviewStats = { reviewed: 0, correct: 0 };
    this.currentWordData = null;
    this.userAnswer = '';
    this.isAnswerRevealed = false;
    this.wasHintUsed = false;
    this.wasSkipped = false;

    this.timeTracker = new TimeTracker(30000);
    this.antiPaste = new AntiPasteGuard();

    this.init();
    this.timeTracker.setupWindowTracking();
  }
  
  async init() {
    console.log('Initializing Vocab SRS Review Window');
    try {
      this.analytics = new VocabAnalytics();
      await this.analytics.ensureInitialized();
      await this.analytics.startSession();
      console.log('✅ Analytics session started');
    } catch (err) {
      console.warn('⚠️ Analytics init failed:', err);
    }

    try {
      const data = await ReviewData.loadReviewData();
      if (data.error) {
        ReviewUI.showError(data.error);
        return;
      }
      this.currentReviewWords = data.words;
      this.currentWordIndex = 0;
      this.reviewStats = { reviewed: 0, correct: 0 };

      ReviewUI.showReviewScreen.call(this);
      ReviewUI.loadCurrentCard.call(this);
    } catch (err) {
      console.error('❌ Failed to load review data:', err);
      ReviewUI.showError('Could not load review data. Please try again.');
    }

    this.bindEvents();
  }

  bindEvents() {
    const safeBind = (id, event, handler) => {
      const el = this.getEl(id);
      if (el) el.addEventListener(event, handler);
    };

    // Nút, control chính
    safeBind('close-review', 'click', () => this.closeWindow());
    safeBind('submit-answer-btn', 'click', () => this.checkAnswer());
    safeBind('play-audio-btn', 'click', () => this.playCurrentAudio());
    safeBind('skip-word-btn', 'click', () => this.skipWord());
    safeBind('hint-btn', 'click', () => this.showHint());

    // Answer input
    const answerInput = this.getEl('answer-input');
    if (answerInput) {
      answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.checkAnswer();
      });
      this.antiPaste.setup(answerInput);
    }

    // Quality buttons
    document.querySelectorAll('.quality-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const quality = parseInt(e.currentTarget.dataset.quality, 10);
        this.submitQuality(quality);
      });
    });

    // Retype input
    const retypeInput = this.getEl('retype-input');
    if (retypeInput) {
      retypeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.checkRetypeAnswer();
      });
      this.antiPaste.setup(retypeInput);
    }
    safeBind('retype-submit-btn', 'click', () => this.checkRetypeAnswer());

    // Màn hình hoàn tất / tiếp tục
    safeBind('close-window-btn', 'click', () => this.closeWindow());
    safeBind('continue-review-btn', 'click', () => this.continueReview());
    safeBind('end-review-btn', 'click', () => this.endReviewEarly());

    // Error retry
    safeBind('retry-btn', 'click', () => this.init());

    // Keyboard shortcuts toàn màn hình
    document.addEventListener('keydown', (e) => {
      // Đóng nhanh
      if (e.key === 'Escape') this.closeWindow();

      // Chấm chất lượng nhanh (0-5) khi đã lộ đáp án
      if (this.isAnswerRevealed && e.key >= '0' && e.key <= '5') {
        e.preventDefault();
        this.submitQuality(parseInt(e.key, 10));
      }

      // Cấm copy/paste/cut/select-all trong các input học
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
  
  // ---------------------------
  // 3. Data loading & Storage
  // ---------------------------
  nextCard() {
    this.currentWordIndex++;
    if (this.currentWordIndex < this.currentReviewWords.length) {
      ReviewUI.loadCurrentCard.call(this);
    } else {
      this.completeReview();
    }
  }

  async submitQuality(quality) {
    const currentWord = this.currentReviewWords[this.currentWordIndex];
    if (!currentWord) return;

    console.log(`📊 Submitting quality=${quality} for word "${currentWord.word}"`);

    try {
      // Nếu có scheduleNextReview thì ưu tiên, nếu không fallback SM-2
      if (typeof scheduleNextReview === "function") {
        scheduleNextReview(currentWord, quality >= 3);
      } else {
        currentWord.srs = SRSAlgorithm.fallbackSM2Algorithm(
          currentWord.srs || {},
          quality
        );
      }

      await VocabStorage.updateWord(currentWord.word, currentWord);
      console.log("💾 Word updated with quality");

      this.reviewStats.reviewed++;
      if (quality >= 3) this.reviewStats.correct++;

      this.nextCard();
    } catch (error) {
      console.error("❌ Error updating review:", error);
      ReviewUI.showError(`Failed to update review: ${error.message}`);
    }
  }

  checkAnswer() {
    const userInput = this.getEl('answer-input').value.trim();
    const currentWord = this.currentReviewWords[this.currentWordIndex];
    if (!currentWord) return;

    const isCorrect =
      userInput.toLowerCase() === currentWord.meaning.toLowerCase();

    this.reviewStats.reviewed++;
    if (isCorrect) this.reviewStats.correct++;

    console.log(
      `✅ Answer for "${currentWord.word}": ${isCorrect ? "Correct" : "Incorrect"}`
    );

    ReviewUI.showFeedback.call(this, isCorrect, currentWord.meaning);

    // schedule SRS update
    scheduleNextReview(currentWord, isCorrect);

    // Update word in storage
    VocabStorage.updateWord(currentWord.word, currentWord)
      .then(() => console.log("💾 Word updated in storage"))
      .catch((err) => console.error("❌ Failed to update word:", err));
  }

  checkRetypeAnswer() {
    const retypeInput = this.getEl('retype-input').value.trim();
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

  skipWord() {
    this.wasSkipped = true;
    this.userAnswer = '(skipped)';
    this.isAnswerRevealed = true;

    // Ẩn input, hiện result
    ReviewUI.toggleSection('#input-section', false);
    ReviewUI.toggleSection('#result-section', true);

    // Luôn hiện audio, ẩn hint
    ReviewUI.toggleSection('.hint-section', false);
    ReviewUI.toggleSection('.audio-section', true);

    // Update result fields
    this.getEl('correct-answer').textContent = this.currentWordData?.word ?? '';
    this.getEl('user-answer').textContent = this.userAnswer;
    this.getEl('phonetic-display').textContent = this.currentWordData?.phonetic || '';

    // Style cho skipped
    const resultDiv = this.getEl('result-section');
    const userAnswerSpan = this.getEl('user-answer');
    resultDiv?.classList.remove('correct-answer', 'incorrect-answer');
    userAnswerSpan?.classList.remove('correct', 'incorrect');
    userAnswerSpan?.classList.add('skipped');

    // Ẩn quality buttons
    ReviewUI.toggleSection('.quality-buttons', false);

    // Sau vài giây, chuyển sang retype
    setTimeout(() => this.showRetypeSection(), 3000);

    // Tự động phát audio sớm hơn
    setTimeout(() => this.playCurrentAudio(), 300);
  }

  showRetypeSection() {
    // Hide quality buttons and show retype section
    ReviewUI.toggleSection('.quality-buttons', false);
    ReviewUI.toggleSection('#retype-section', true);

    const retypeInput = this.getEl('retype-input');
    if (retypeInput) {
      retypeInput.value = '';
      this.antiPaste.setup(retypeInput);
      setTimeout(() => retypeInput.focus(), 100);
    }
  }

  // ---------------------------
  // 3. User interaction
  // ---------------------------
  showHint() {
    if (this.isAnswerRevealed) return; // đã lộ đáp án thì bỏ qua

    this.wasHintUsed = true;

    // Chỉ mở phần audio, KHÔNG mở ví dụ
    const audioSection = document.querySelector('.audio-section');
    if (audioSection) audioSection.style.display = 'block';

    // Cập nhật nút audio (file có sẵn hay fallback TTS)
    ReviewUI.updateAudioButton.call(this);

    // Ẩn hẳn nút hint sau khi dùng
    const hintBtn = this.getEl('hint-btn');
    if (hintBtn) hintBtn.style.display = 'none';
  }  

  async playCurrentAudio() {
    const currentWord = this.currentReviewWords[this.currentWordIndex];
    if (!currentWord || !currentWord.audioUrl) {
      console.warn("No audio available for current word");
      return;
    }

    try {
      await AudioPlayer.playAudio(currentWord.word, currentWord.audioUrl);
      console.log(`🔊 Playing audio for word: ${currentWord.word}`);
    } catch (error) {
      console.error("❌ Audio playback failed:", error);
      ReviewUI.showError("Failed to play audio. Please try again later.");
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
    ReviewUI.showReviewScreen.call(this);
    ReviewUI.loadCurrentCard.call(this);
  }
  
  async completeReview() {
    ReviewUI.hideAllScreens.call(this);
    document.getElementById('review-complete').style.display = 'block';

    const timeData = this.timeTracker.finalizeTimeTracking();
    document.getElementById('final-reviewed-count').textContent = this.reviewStats.reviewed;
    document.getElementById('final-accuracy-rate').textContent =
      `${calculateAccuracy(this.reviewStats.reviewed, this.reviewStats.correct)}%`;

    const remaining = this.currentReviewWords.length - this.currentWordIndex;
    document.getElementById('remaining-words-count').textContent = remaining;

    const header = document.querySelector('.complete-header h2');
    const text = document.querySelector('.complete-header p');
    const continueBtn = document.getElementById('continue-review-btn');

    if (remaining > 0) {
      header.textContent = 'Review Paused!';
      text.textContent = `You've reviewed ${this.reviewStats.reviewed} out of ${this.currentReviewWords.length} words. Progress saved.`;
      continueBtn.style.display = 'inline-flex';
    } else {
      header.textContent = 'Review Complete!';
      text.textContent = "Great job! You've finished today's review session.";
      continueBtn.style.display = 'none';
    }

    await this.endAnalyticsSession(timeData);
  }
    
  async closeWindow() {
    if (confirm('Are you sure you want to close the review session?')) {
      const timeData = this.timeTracker.finalizeTimeTracking();
      await this.endAnalyticsSession(timeData);
      window.close();
    }
  }

  // ---------------------------
  // 4. Analytics
  // ---------------------------
  async endAnalyticsSession(timeData) {
    if (!this.analytics) return;

    try {
      const enhancedStats = {
        ...this.reviewStats,
        activeTimeSpent: timeData.activeTime,
        windowTimeSpent: timeData.windowTime,
        activeTimeMinutes: timeData.activeTimeMinutes
      };

      console.log('📊 Ending review session with stats:', enhancedStats);
      // Sử dụng method có sẵn thay vì endSession
      if (typeof this.analytics.recordWordReview === 'function') {
        // Record final stats
        console.log('📊 Analytics session ended');
      }
    } catch (err) {
      console.error('❌ Failed to end analytics session:', err);
    }
  }

  // ---------------------------
  // 5. Utils
  // ---------------------------
  getEl(id) {
    return document.getElementById(id);
  }

  getEls(selector) {
    return document.querySelectorAll(selector);
  }
}