export const ReviewUI = {
    // ---------------------------
    // Hiển thị & cập nhật màn hình chính
    // ---------------------------
    showReviewScreen() {
        this.hideAllScreens();

        const main = document.querySelector('.review-main');
        if (main) main.style.display = 'flex';

        this.updateProgressUI();
        this.updateSessionStats();
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

        this.toggleSection('#input-section', true);
        this.toggleSection('#result-section', false);
        this.toggleSection('#retype-section', false);

        this.updateProgressUI();

        const answerInput = this.getEl('answer-input');
        if (answerInput) {
            answerInput.value = '';
            // ⚠️ Ở đây gọi lại antiPaste.setup() từ ngoài
            setTimeout(() => answerInput.focus(), 100);
        }

        this.getEls('.quality-btn').forEach(btn => {
            btn.style.display = 'inline-block';
            btn.classList.remove('suggested');
        });

        this.updateAudioButton();
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
        this.getEl('reviewed-count').textContent = this.reviewStats.reviewed;

        const accuracy = this.reviewStats.reviewed > 0
            ? Math.round((this.reviewStats.correct / this.reviewStats.reviewed) * 100)
            : 0;
        this.getEl('accuracy-display').textContent = `${accuracy}%`;

        if (typeof this.updateActiveTimeDisplay === 'function') {
            this.updateActiveTimeDisplay();
        }
    },

    updateAudioButton() {
        const audioBtn = this.getEl('play-audio-btn');
        if (!audioBtn) return;
        audioBtn.innerHTML = this.currentWordData?.audioUrl
            ? '<span class="btn-icon">🔊</span> Pronunciation'
            : '<span class="btn-icon">🗣️</span> Pronunciation';
    },

    // ---------------------------
    // Feedback & Quality
    // ---------------------------
    showFeedback(isCorrect, correctAnswer) {
        this.isAnswerRevealed = true;

        this.toggleSection('#input-section', false);
        this.toggleSection('#result-section', true);

        this.getEl('correct-answer').textContent = correctAnswer || '';
        this.getEl('user-answer').textContent = this.userAnswer || '';

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
    },

    resetQualityButtons() {
        this.getEls('.quality-btn').forEach(btn => btn.classList.remove('suggested'));
    },

    highlightQualityButtons(qualities = []) {
        qualities.forEach(q => {
            const btn = document.querySelector(`[data-quality="${q}"]`);
            if (btn) btn.classList.add('suggested');
        });
    },

    suggestQuality(isCorrect) {
        this.resetQualityButtons();

        if (this.wasSkipped) {
            this.highlightQualityButtons([0]);
        } else if (!isCorrect) {
            this.highlightQualityButtons([1]);
        } else if (this.wasHintUsed) {
            this.highlightQualityButtons([2]);
        } else {
            this.highlightQualityButtons([3, 4, 5]);
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
    }
};