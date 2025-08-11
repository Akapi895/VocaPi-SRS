// Vocab SRS Popup JavaScript
class VocabSRSPopup {
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
    console.log('Initializing Vocab SRS Popup');
    await this.loadStats();
    this.bindEvents();
  }
  
  async loadStats() {
    try {
      const allWords = await window.VocabUtils.VocabStorage.getAllWords();
      const dueWords = await window.VocabUtils.VocabStorage.getDueWords();
      
      document.getElementById('total-words').textContent = allWords.length;
      document.getElementById('due-words').textContent = dueWords.length;
      
      // Enable/disable review button
      const reviewBtn = document.getElementById('start-review-btn');
      if (dueWords.length === 0) {
        reviewBtn.disabled = true;
        reviewBtn.innerHTML = '<span class="btn-icon">✓</span>No words due';
      } else {
        reviewBtn.disabled = false;
        reviewBtn.innerHTML = '<span class="btn-icon">🔄</span>Start Review';
      }
      
    } catch (error) {
      console.error('Error loading stats:', error);
      this.showError('Failed to load vocabulary stats');
    }
  }
  
  bindEvents() {
    // Main screen buttons
    document.getElementById('start-review-btn').addEventListener('click', () => this.startReview());
    document.getElementById('view-all-words-btn').addEventListener('click', () => this.showWordList());
    document.getElementById('view-analytics-btn').addEventListener('click', () => this.openAnalytics());
    document.getElementById('export-btn').addEventListener('click', () => this.exportVocab());
    document.getElementById('import-btn').addEventListener('click', () => this.importVocab());
    document.getElementById('import-file').addEventListener('change', (e) => this.handleFileImport(e));
    
    // Review screen buttons
    document.getElementById('back-to-main').addEventListener('click', () => this.showMainScreen());
    document.getElementById('submit-answer-btn').addEventListener('click', () => this.checkAnswer());
    document.getElementById('play-audio-btn').addEventListener('click', () => this.playCurrentAudio());
    document.getElementById('skip-word-btn').addEventListener('click', () => this.skipWord());
    document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
    
    // Answer input
    document.getElementById('answer-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.checkAnswer();
      }
    });
    
    // Quality buttons (shown after answer check)
    document.querySelectorAll('.quality-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const quality = parseInt(e.currentTarget.dataset.quality);
        this.submitQuality(quality);
      });
    });
    
    // Retype functionality
    document.getElementById('retype-submit-btn').addEventListener('click', () => this.checkRetypeAnswer());
    document.getElementById('retype-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.checkRetypeAnswer();
      }
    });
    
    // Word list screen
    document.getElementById('back-from-list').addEventListener('click', () => this.showMainScreen());
    document.getElementById('search-input').addEventListener('input', (e) => this.filterWords(e.target.value));
    
    // Review complete
    document.getElementById('finish-review-btn').addEventListener('click', () => this.showMainScreen());
    
    // Error retry
    document.getElementById('retry-btn').addEventListener('click', () => this.loadStats());
    
    // Help button
    document.getElementById('help-btn').addEventListener('click', () => this.showKeyboardHelp());
  }
  
  async startReview() {
    try {
      this.showLoading();
      
      const dueWords = await window.VocabUtils.VocabStorage.getDueWords();
      
      if (dueWords.length === 0) {
        this.showError('No words are due for review');
        return;
      }
      
      // Send message to background script to open review window
      chrome.runtime.sendMessage({
        action: 'openReviewWindow'
      }, (response) => {
        if (response && response.success) {
          // Close the extension popup
          window.close();
        } else {
          this.showError('Failed to open review window');
        }
      });
      
    } catch (error) {
      console.error('Error starting review:', error);
      this.showError('Failed to start review');
    }
  }
  
  async openAnalytics() {
    try {
      // Send message to background script to open analytics window
      chrome.runtime.sendMessage({
        action: 'openAnalyticsWindow'
      }, (response) => {
        if (response && response.success) {
          // Close the extension popup
          window.close();
        } else {
          this.showError('Failed to open analytics window');
        }
      });
      
    } catch (error) {
      console.error('Error opening analytics:', error);
      this.showError('Failed to open analytics');
    }
  }
  
  showReviewScreen() {
    this.hideAllScreens();
    document.getElementById('review-screen').style.display = 'block';
    
    // Update progress
    document.getElementById('current-card').textContent = this.currentWordIndex + 1;
    document.getElementById('total-cards').textContent = this.currentReviewWords.length;
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
    
    // Clear and focus input
    const answerInput = document.getElementById('answer-input');
    answerInput.value = '';
    answerInput.focus();
    
    // Reset quality buttons visibility
    const qualityBtns = document.querySelectorAll('.quality-btn');
    qualityBtns.forEach(btn => {
      btn.style.display = 'inline-block';
    });
    
    // Update progress
    document.getElementById('current-card').textContent = this.currentWordIndex + 1;
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
        }, 2000);
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
      }, 2000); // 2 seconds to see the result
    }
    
    // Auto-play audio after showing answer (always play for all cases)
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
    }, 2000); // 2 seconds to see the result
    
    // Auto-play audio after showing answer for skipped words
    setTimeout(() => {
      this.playCurrentAudio();
    }, 300);
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
      
      // Consider correct if user got it right AND rated quality >= 3
      const wasCorrect = this.userAnswer.toLowerCase() === this.currentWordData.word.toLowerCase();
      if (wasCorrect && quality >= 3) {
        this.reviewStats.correct++;
      }
      
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
  
  completeReview() {
    this.hideAllScreens();
    document.getElementById('review-complete').style.display = 'block';
    
    // Show stats
    document.getElementById('reviewed-count').textContent = this.reviewStats.reviewed;
    
    const accuracy = this.reviewStats.reviewed > 0 
      ? Math.round((this.reviewStats.correct / this.reviewStats.reviewed) * 100)
      : 0;
    document.getElementById('accuracy-rate').textContent = `${accuracy}%`;
    
    // Refresh main screen stats
    setTimeout(() => this.loadStats(), 100);
  }
  
  async showWordList() {
    try {
      this.showLoading();
      
      const allWords = await window.VocabUtils.VocabStorage.getAllWords();
      
      this.hideAllScreens();
      document.getElementById('word-list-screen').style.display = 'block';
      
      this.renderWordList(allWords);
      
    } catch (error) {
      console.error('Error showing word list:', error);
      this.showError('Failed to load word list');
    }
  }
  
  renderWordList(words) {
    const wordList = document.getElementById('word-list');
    
    if (words.length === 0) {
      wordList.innerHTML = '<div class="empty-state">No words in your dictionary yet</div>';
      return;
    }
    
    // Sort words: due words first, then by creation date
    const sortedWords = words.sort((a, b) => {
      const aDue = window.VocabUtils.DateUtils.isPastDue(a.srs.nextReview);
      const bDue = window.VocabUtils.DateUtils.isPastDue(b.srs.nextReview);
      
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;
      
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    wordList.innerHTML = sortedWords.map(word => {
      const isDue = window.VocabUtils.DateUtils.isPastDue(word.srs.nextReview);
      const nextReview = window.VocabUtils.DateUtils.formatDate(word.srs.nextReview);
      
      return `
        <div class="word-item ${isDue ? 'word-due' : ''}">
          <div class="word-content">
            <div class="word-main-info">
              <span class="word-text">${word.word}</span>
              ${word.phonetic ? `<span class="word-phonetic">${word.phonetic}</span>` : ''}
            </div>
            <div class="word-meaning">${word.meaning}</div>
            ${word.example ? `<div class="word-example">${word.example}</div>` : ''}
          </div>
          <div class="word-meta">
            <span class="next-review ${isDue ? 'due-now' : ''}">
              ${isDue ? 'Due now' : `Next: ${nextReview}`}
            </span>
            <button class="delete-word-btn" data-word-id="${word.id}" title="Delete word">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
    
    // Bind delete buttons
    wordList.querySelectorAll('.delete-word-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.deleteWord(btn.dataset.wordId);
      });
    });
  }
  
  async deleteWord(wordId) {
    if (!confirm('Are you sure you want to delete this word?')) return;
    
    try {
      await window.VocabUtils.VocabStorage.removeWord(wordId);
      
      // Refresh word list
      const allWords = await window.VocabUtils.VocabStorage.getAllWords();
      this.renderWordList(allWords);
      
      // Refresh stats
      this.loadStats();
      
    } catch (error) {
      console.error('Error deleting word:', error);
      this.showError('Failed to delete word');
    }
  }
  
  filterWords(query) {
    const allItems = document.querySelectorAll('.word-item');
    const searchQuery = query.toLowerCase().trim();
    
    allItems.forEach(item => {
      const wordText = item.querySelector('.word-text').textContent.toLowerCase();
      const meaning = item.querySelector('.word-meaning').textContent.toLowerCase();
      const example = item.querySelector('.word-example');
      const exampleText = example ? example.textContent.toLowerCase() : '';
      
      const matches = wordText.includes(searchQuery) || 
                     meaning.includes(searchQuery) || 
                     exampleText.includes(searchQuery);
      
      item.style.display = matches ? 'flex' : 'none';
    });
  }
  
  async exportVocab() {
    try {
      const allWords = await window.VocabUtils.VocabStorage.getAllWords();
      
      const exportData = {
        version: '1.0.0',
        exportedAt: window.VocabUtils.DateUtils.now(),
        words: allWords
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vocab-srs-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export error:', error);
      this.showError('Failed to export vocabulary');
    }
  }
  
  importVocab() {
    document.getElementById('import-file').click();
  }
  
  async handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      this.showLoading('Importing vocabulary...');
      
      const text = await file.text();
      const importData = JSON.parse(text);
      
      console.log('Import data structure:', importData);
      console.log('Sample word data:', importData.words[0]);
      
      // Validate file format - support multiple formats
      let wordsArray;
      
      if (importData.words && Array.isArray(importData.words)) {
        // Standard format: { words: [...] }
        wordsArray = importData.words;
      } else if (Array.isArray(importData)) {
        // Direct array format: [...]
        wordsArray = importData;
      } else if (importData.vocabulary && Array.isArray(importData.vocabulary)) {
        // Alternative format: { vocabulary: [...] }
        wordsArray = importData.vocabulary;
      } else {
        throw new Error('Invalid file format: no words array found. Expected { words: [...] } or direct array');
      }
      
      if (wordsArray.length === 0) {
        throw new Error('No words found in the file');
      }
      
      console.log(`Found ${wordsArray.length} words to import`);
      
      let importedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      const existingWords = await window.VocabUtils.VocabStorage.getAllWords();
      const existingWordsSet = new Set(existingWords.map(w => w.word.toLowerCase()));
      
      console.log(`Processing ${wordsArray.length} words for import`);
      
      for (const [index, wordData] of wordsArray.entries()) {
        try {
          // Validate word structure
          if (!wordData.word || typeof wordData.word !== 'string') {
            console.warn(`Skipping invalid word at index ${index}:`, wordData);
            errorCount++;
            continue;
          }
          
          // Check for duplicates
          if (existingWordsSet.has(wordData.word.toLowerCase())) {
            console.log(`Skipping duplicate word: ${wordData.word}`);
            skippedCount++;
            continue;
          }
          
          // Create complete word object with proper structure
          const completeWord = {
            word: wordData.word.trim(),
            meaning: wordData.meaning || '',
            phonetic: wordData.phonetic || '',
            example: wordData.example || '',
            audioUrl: wordData.audioUrl || null,
            
            // SRS data - use existing or create new
            srs: wordData.srs && typeof wordData.srs === 'object' ? {
              interval: wordData.srs.interval || 1,
              repetitions: wordData.srs.repetitions || 0,
              easiness: wordData.srs.easiness || 2.5,
              nextReview: wordData.srs.nextReview || new Date().toISOString()
            } : {
              interval: 1,
              repetitions: 0,
              easiness: 2.5,
              nextReview: new Date().toISOString()
            },
            
            // Metadata
            createdAt: wordData.createdAt || new Date().toISOString(),
            lastModified: new Date().toISOString(),
            tags: wordData.tags || [],
            difficulty: wordData.difficulty || 'medium',
            source: wordData.source || 'imported'
          };
          
          console.log(`Importing word ${index + 1}/${wordsArray.length}:`, completeWord.word);
          
          // Add word to storage
          await window.VocabUtils.VocabStorage.addWord(completeWord);
          importedCount++;
          
          // Update progress every 10 words
          if (importedCount % 10 === 0) {
            this.showLoading(`Importing... ${importedCount}/${wordsArray.length} words processed`);
          }
          
        } catch (error) {
          console.error(`Failed to import word at index ${index}:`, wordData, error);
          errorCount++;
        }
      }
      
      this.hideLoading();
      
      // Show detailed import results
      const totalProcessed = importedCount + skippedCount + errorCount;
      const resultMessage = [
        'Import Results:',
        `✅ ${importedCount} words successfully imported`,
        `⏭️ ${skippedCount} words skipped (already exist)`,
        `❌ ${errorCount} words failed (invalid format)`,
        `📊 Total processed: ${totalProcessed}/${wordsArray.length}`
      ].join('\n');
      
      alert(resultMessage);
      
      // Refresh the interface
      await this.loadStats();
      if (document.getElementById('word-list-screen').style.display === 'block') {
        await this.showWordList();
      }
      
      console.log('Import completed successfully');
      
    } catch (error) {
      this.hideLoading();
      console.error('Import error:', error);
      
      let errorMessage = 'Failed to import vocabulary file';
      if (error.message.includes('JSON')) {
        errorMessage = 'Invalid JSON file format';
      } else if (error.message.includes('words')) {
        errorMessage = error.message;
      }
      
      this.showError(errorMessage);
    } finally {
      // Reset file input
      event.target.value = '';
    }
  }
  
  showKeyboardHelp() {
    // Use static method to avoid creating multiple instances
    if (window.VocabKeyboardHandler) {
      window.VocabKeyboardHandler.showHelp();
    }
  }
  
  showMainScreen() {
    this.hideAllScreens();
    document.getElementById('main-screen').style.display = 'block';
    this.loadStats(); // Refresh stats
  }
  
  showLoading(message = 'Loading...') {
    this.hideAllScreens();
    document.getElementById('loading-state').style.display = 'block';
    
    // Update loading message if element exists
    const loadingMessage = document.querySelector('#loading-state p');
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
  }
  
  hideLoading() {
    document.getElementById('loading-state').style.display = 'none';
  }
  
  showError(message) {
    this.hideAllScreens();
    document.getElementById('error-state').style.display = 'block';
    document.getElementById('error-message').textContent = message;
  }
  
  hideAllScreens() {
    const screens = [
      'main-screen',
      'review-screen', 
      'word-list-screen',
      'review-complete',
      'loading-state',
      'error-state'
    ];
    
    screens.forEach(screenId => {
      document.getElementById(screenId).style.display = 'none';
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new VocabSRSPopup();
});
