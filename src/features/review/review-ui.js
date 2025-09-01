const ReviewUI = {
    // ---------------------------
    // Hiển thị & cập nhật màn hình chính
    // ---------------------------
    showReviewScreen() {
        window.ReviewUI.hideAllScreens();

        const main = document.querySelector('.review-main');
        if (main) main.style.display = 'flex';
    },

    loadCurrentCard() {
        if (this.currentWordIndex >= this.currentReviewWords.length) {
            this.completeReview();
            return;
        }

        this.currentWordData = this.currentReviewWords[this.currentWordIndex] || null;
        this.userAnswer = '';
        this.isAnswerRevealed = false;
        this.wasHintUsed = false;
        this.wasSkipped = false;
        this.currentWordStartTime = Date.now();

        const meaning = this.getEl('meaning-display');
        if (meaning) meaning.textContent = this.currentWordData?.meaning ?? '';

        const example = this.getEl('example-display');
        if (example) {
            example.textContent = this.currentWordData?.example || '';
            example.style.display = 'none';
        }

        const hintBtn = this.getEl('hint-btn');
        if (hintBtn) {
            hintBtn.style.display = 'inline-flex';
            hintBtn.disabled = false;
        }
        const audioSection = document.querySelector('.audio-section');
        if (audioSection) audioSection.style.display = 'none';
        const hintSection = document.querySelector('.hint-section');
        if (hintSection) hintSection.style.display = 'block';

        window.ReviewUI.toggleSection('#input-section', true);
        window.ReviewUI.toggleSection('#result-section', false);
        window.ReviewUI.toggleSection('#retype-section', false);

        window.ReviewUI.updateProgressUI.call(this);

        const answerInput = this.getEl('answer-input');
        if (answerInput) {
            answerInput.value = '';
            setTimeout(() => answerInput.focus(), 100);
        }

        this.getEls('.quality-btn').forEach(btn => {
            btn.style.display = 'inline-block';
            btn.classList.remove('suggested');
        });

        window.ReviewUI.updateAudioButton.call(this);
    },

    // ---------------------------
    // Stats / Progress
    // ---------------------------
    updateProgressUI() {
        const total = this.currentReviewWords?.length || 0;
        const index1 = (this.currentWordIndex || 0) + 1;

        const curCard = this.getEl('current-card');
        if (curCard) curCard.textContent = index1;

        const totalCards = this.getEl('total-cards');
        if (totalCards) totalCards.textContent = total;

        const curProg = this.getEl('current-progress');
        if (curProg) curProg.textContent = index1;

        const totalProg = this.getEl('total-progress');
        if (totalProg) totalProg.textContent = total;
    },

    updateSessionStats() {
        const reviewed = this.reviewStats?.reviewed || 0;
        const correct = this.reviewStats?.correct || 0;
        
        this.getEl('reviewed-count').textContent = reviewed;

        const accuracy = reviewed > 0
            ? Math.round((correct / reviewed) * 100)
            : 0;
        this.getEl('accuracy-display').textContent = `${accuracy}%`;

        if (typeof this.updateActiveTimeDisplay === 'function') {
            this.updateActiveTimeDisplay();
        }
    },

    updateAudioButton() {
        const audioBtn = this.getEl('play-audio-btn');
        if (!audioBtn) return;
        
        // Fix: Use audioBtn instead of this.audioBtn
        audioBtn.innerHTML = this.currentWordData?.audioUrl
            ? '<span class="btn-icon">🔊</span> Pronunciation'
            : '<span class="btn-icon">🗣️</span> Pronunciation';
    },

    // ---------------------------
    // Feedback & Quality
    // ---------------------------
    showFeedback(isCorrect, correctAnswer, context) {
        this.isAnswerRevealed = true;

        // Use context parameter instead of this
        const ctx = context || this;

        // Fix: Use window.ReviewUI.toggleSection instead of this.toggleSection
        window.ReviewUI.toggleSection('#input-section', false);
        window.ReviewUI.toggleSection('#result-section', true);

        // Use context.getEl() instead of this.getEl()
        ctx.getEl('correct-answer').textContent = correctAnswer || '';
        ctx.getEl('user-answer').textContent = ctx.userAnswer || '';

        const resultDiv = ctx.getEl('result-section');
        const userAnswerSpan = ctx.getEl('user-answer');
        resultDiv?.classList.remove('correct-answer', 'incorrect-answer');
        userAnswerSpan?.classList.remove('correct', 'incorrect');

        if (isCorrect) {
            resultDiv?.classList.add('correct-answer');
            userAnswerSpan?.classList.add('correct');
        } else {
            resultDiv?.classList.add('incorrect-answer');
            userAnswerSpan?.classList.add('incorrect');
        }

        window.ReviewUI.suggestQuality.call(ctx, isCorrect);
    },

    resetQualityButtons() {
        // Fix: Use window.ReviewUI.getEls instead of this.getEls
        window.ReviewUI.getEls.call(this, '.quality-btn').forEach(btn => btn.classList.remove('suggested'));
    },

    highlightQualityButtons(qualities = []) {
        qualities.forEach(q => {
            const btn = document.querySelector(`[data-quality="${q}"]`);
            if (btn) btn.classList.add('suggested');
        });
    },

    suggestQuality(isCorrect) {
        // Fix: Use window.ReviewUI.resetQualityButtons instead of this.resetQualityButtons
        window.ReviewUI.resetQualityButtons.call(this);

        if (this.wasSkipped) {
            // Fix: Use window.ReviewUI.highlightQualityButtons instead of this.highlightQualityButtons
            window.ReviewUI.highlightQualityButtons.call(this, [0]);
        } else if (!isCorrect) {
            window.ReviewUI.highlightQualityButtons.call(this, [1]);
        } else if (this.wasHintUsed) {
            window.ReviewUI.highlightQualityButtons.call(this, [2]);
        } else {
            window.ReviewUI.highlightQualityButtons.call(this, [3, 4, 5]);
        }
    },

    // ---------------------------
    // Loading / Error
    // ---------------------------
    hideAllScreens() {
        ['.review-main', '#review-complete', '#loading-state', '#error-state'].forEach(sel => {
            const el = document.querySelector(sel);
            if (el) el.style.display = 'none';
        });
    },

    showLoading() {
        this.hideAllScreens();
        this.getEl('loading-state').style.display = 'block';
    },

    showError(message) {
        this.hideAllScreens();
        this.getEl('error-state').style.display = 'block';
        this.getEl('error-message').textContent = message;
    },

    // ---------------------------
    // Helper DOM
    // ---------------------------
    getEl(id) {
        return document.getElementById(id);
    },

    getEls(selector) {
        return document.querySelectorAll(selector);
    },

    // Fix: Add missing toggleSection method
    toggleSection(selector, show) {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = show ? 'block' : 'none';
        }
    }
};

if (typeof window !== 'undefined') {
  window.ReviewUI = ReviewUI;
}