// src/ui/js/popup.js - Simplified without modules
class VocabSRSPopup {
  constructor() {
    console.log('🏗️ VocabSRSPopup constructor called');
    console.log('🏗️ DOM ready state:', document.readyState);
    console.log('🏗️ Document body:', !!document.body);
    
    this.currentReviewWords = [];
    this.currentWordIndex = 0;
    this.reviewStats = { reviewed: 0, correct: 0 };
    this.currentWordData = null;
    this.userAnswer = '';
    this.isAnswerRevealed = false;
    this.wasHintUsed = false;
    this.wasSkipped = false;
    this.gamificationUI = null;

    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      console.log('🏗️ DOM still loading, waiting...');
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      console.log('🏗️ DOM ready, initializing immediately');
      this.init();
    }
  }

  // ---------------------------
  // Init & boot
  // ---------------------------
  async init() {
    console.log('🚀 Initializing Vocab SRS Popup');

    // Load stats and bind events
    await this.loadStats();
    this.bindEvents();
    console.log('✅ Vocab SRS Popup initialization complete');
  }

  // ---------------------------
  // Stats loader
  // ---------------------------
  async loadStats() {
    try {
      console.log('🔍 Attempting to load stats from service worker...');
      console.log('🔍 Chrome object available:', typeof chrome !== 'undefined');
      console.log('🔍 Chrome runtime available:', typeof chrome !== 'undefined' && chrome.runtime);
      console.log('🔍 Chrome runtime.sendMessage available:', typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage);
      
      // Check if we're in a real extension environment
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        console.log('📡 Sending message to service worker...');
        // Get words from IndexedDB via background script
        const response = await chrome.runtime.sendMessage({ action: 'getWords' });
        
        console.log('📡 Service worker response:', response);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to get words');
        }
        
        const allWords = response.words || [];
        console.log('📚 Words received from service worker:', allWords);
        
        this.updateStatsDisplay(allWords);
        console.log('✅ Stats loaded from service worker:', { total: allWords.length });
      } else {
        throw new Error('Service worker not available');
      }
    } catch (error) {
      console.error('❌ Error loading stats from service worker:', error);
      console.log('🔄 Falling back to direct Chrome Storage access...');
      
      // Fallback: try to read directly from Chrome Storage
      try {
        const result = await chrome.storage.local.get(['vocabWords']);
        const allWords = result.vocabWords || [];
        console.log('📚 Words read directly from Chrome Storage:', allWords);
        
        this.updateStatsDisplay(allWords);
        console.log('✅ Stats loaded from fallback:', { total: allWords.length });
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        this.showError('Failed to load vocabulary stats');
      }
    }
  }

  updateStatsDisplay(allWords) {
    console.log('🔧 updateStatsDisplay called with:', allWords);
    console.log('🔧 allWords length:', allWords.length);
    
    // Calculate due words (simplified)
    const dueWords = allWords.filter(word => {
      if (!word.srs || !word.srs.nextReview) return true;
      const nextReview = new Date(word.srs.nextReview);
      return nextReview <= new Date();
    });
    
    console.log('🔧 dueWords calculated:', dueWords.length);

    const totalWordsEl = document.getElementById('total-words');
    const dueWordsEl = document.getElementById('due-words');
    
    console.log('🔧 totalWordsEl found:', !!totalWordsEl);
    console.log('🔧 dueWordsEl found:', !!dueWordsEl);
    
    if (totalWordsEl) {
      totalWordsEl.textContent = allWords.length;
      console.log('🔧 Updated total-words to:', allWords.length);
    }
    if (dueWordsEl) {
      dueWordsEl.textContent = dueWords.length;
      console.log('🔧 Updated due-words to:', dueWords.length);
    }

    // Enable/disable review button
    const reviewBtn = document.getElementById('start-review-btn');
    console.log('🔧 reviewBtn found:', !!reviewBtn);
    
    if (reviewBtn) {
      if (dueWords.length === 0) {
        reviewBtn.disabled = true;
        reviewBtn.innerHTML = '<span class="btn-icon">✓</span>No words due';
        console.log('🔧 Review button disabled');
      } else {
        reviewBtn.disabled = false;
        reviewBtn.innerHTML = '<span class="btn-icon">🔄</span>Start Review';
        console.log('🔧 Review button enabled');
      }
    }
  }

  // ---------------------------
  // Event bindings
  // ---------------------------
  bindEvents() {
    console.log('🔧 bindEvents called');
    
    const bindIf = (id, ev, handler) => {
      const el = document.getElementById(id);
      console.log(`🔧 Binding ${ev} event for ${id}:`, !!el);
      if (el) el.addEventListener(ev, handler);
    };

    bindIf('start-review-btn', 'click', () => this.startReview());
    bindIf('view-all-words-btn', 'click', () => this.showWordList());
    bindIf('view-analytics-btn', 'click', () => this.openAnalytics());
    bindIf('settings-btn', 'click', () => this.openSettings());
    bindIf('export-btn', 'click', () => this.exportVocab());
    bindIf('import-btn', 'click', () => this.importVocab());
    bindIf('import-file', 'change', (e) => this.handleFileImport(e));
    bindIf('back-to-main', 'click', () => this.showMainScreen());
    bindIf('retry-btn', 'click', () => this.loadStats());
    
    // Add debug button if it exists
    const debugBtn = document.getElementById('debug-storage');
    console.log('🔧 debug-storage button found:', !!debugBtn);
    if (debugBtn) {
      debugBtn.addEventListener('click', () => this.debugStorage());
      console.log('🔧 Debug button event bound');
    }
    
    console.log('🔧 All events bound');
  }

  // Debug storage function
  async debugStorage() {
    try {
      console.log('🔍 Debugging storage...');
      
      // Try service worker first
      try {
        const response = await chrome.runtime.sendMessage({ action: 'getWords' });
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to get words');
        }
        
        const allWords = response.words || [];
        
        // Show alert with info
        alert(`Storage Debug Info:\n\n` +
              `VocabWords count: ${allWords.length}\n\n` +
              `VocabWords: ${allWords.map(w => w.word).join(', ') || 'None'}`);
        
      } catch (serviceWorkerError) {
        console.log('🔄 Service worker failed, trying direct Chrome Storage...');
        
        // Fallback to direct Chrome Storage
        const result = await chrome.storage.local.get(['vocabWords']);
        const allWords = result.vocabWords || [];
        
        alert(`Storage Debug Info (Direct Access):\n\n` +
              `VocabWords count: ${allWords.length}\n\n` +
              `VocabWords: ${allWords.map(w => w.word).join(', ') || 'None'}`);
      }
      
    } catch (error) {
      console.error('❌ Debug storage error:', error);
      alert('Debug error: ' + error.message);
    }
  }

  // ---------------------------
  // Actions
  // ---------------------------
  async startReview() {
    try {
      this.showLoading();
      const response = await chrome.runtime.sendMessage({ action: 'getWords' });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get words');
      }
      
      const allWords = response.words || [];
      
      if (allWords.length === 0) {
        this.showError('No words in your dictionary yet');
        return;
      }

      // For now, just show a simple message
      this.showError('Review system will be implemented next');
    } catch (error) {
      console.error('Error starting review:', error);
      this.showError('Failed to start review');
    }
  }

  async showWordList() {
    try {
      this.showLoading();
      
      let allWords = [];
      
      // Try service worker first
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        const response = await chrome.runtime.sendMessage({ action: 'getWords' });
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to get words');
        }
        
        allWords = response.words || [];
      } else {
        // Fallback to direct storage
        const result = await chrome.storage.local.get(['vocabWords']);
        allWords = result.vocabWords || [];
      }
      
      this.hideAllScreens();
      this.getEl('word-list-screen').style.display = 'block';
      this.renderWordList(allWords);
    } catch (error) {
      console.error('Error showing word list:', error);
      this.showError('Failed to load word list');
    }
  }

  renderWordList(words) {
    const wordList = this.getEl('word-list');
    if (!wordList) return;
    
    if (words.length === 0) {
      wordList.innerHTML = '<div class="empty-state">No words in your dictionary yet</div>';
      return;
    }

    wordList.innerHTML = words.map(word => `
      <div class="word-item">
        <div class="word-content">
          <div class="word-main-info">
            <span class="word-text">${word.word}</span>
            ${word.phonetic ? `<span class="word-phonetic">${word.phonetic}</span>` : ''}
          </div>
          <div class="word-meaning">${word.meaning}</div>
          ${word.example ? `<div class="word-example">${word.example}</div>` : ''}
        </div>
        <div class="word-meta">
          <span class="next-review">Added: ${new Date(word.createdAt).toLocaleDateString()}</span>
          <button class="delete-word-btn" data-word-id="${word.id}" title="Delete word">🗑️</button>
        </div>
      </div>
    `).join('');

    // Bind delete events
    wordList.querySelectorAll('.delete-word-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.deleteWord(btn.dataset.wordId);
      });
    });
  }

  async deleteWord(wordId) {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'deleteWord', wordId });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete word');
      }
      
      // Refresh the word list and stats
      await this.loadStats();
      if (this.getEl('word-list-screen')?.style.display === 'block') {
        await this.showWordList();
      }
    } catch (error) {
      console.error('Error deleting word:', error);
      this.showError('Failed to delete word');
    }
  }

  // Placeholder functions for other actions
  openAnalytics() {
    chrome.runtime.sendMessage({ action: 'openAnalyticsWindow' });
  }

  openSettings() {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/html/options.html') });
  }

  async exportVocab() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getWords' });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get words');
      }
      
      const allWords = response.words || [];
      
      if (allWords.length === 0) {
        alert('No words to export');
        return;
      }
      
      const dataStr = JSON.stringify(allWords, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `vocab-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
    } catch (error) {
      console.error('Export error:', error);
      this.showError('Failed to export vocabulary');
    }
  }

  importVocab() {
    document.getElementById('import-file').click();
  }

  async handleFileImport(event) {
    try {
      const file = event.target.files[0];
      if (!file) return;
      
      const text = await file.text();
      const wordsArray = JSON.parse(text);
      
      if (!Array.isArray(wordsArray)) {
        throw new Error('Invalid file format: expected array of words');
      }
      
      this.showLoading('Importing words...');
      
      let importedCount = 0;
      let skippedCount = 0;
      const existingWords = [];
      
      for (const wordData of wordsArray) {
        try {
          if (!wordData.word || !wordData.meaning) {
            skippedCount++;
            continue;
          }
          
          const completeWord = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            word: wordData.word.trim(),
            meaning: wordData.meaning || '',
            phonetic: wordData.phonetic || '',
            example: wordData.example || '',
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            srs: {
              interval: 1,
              repetitions: 0,
              easiness: 2.5,
              nextReview: new Date().toISOString()
            }
          };

          existingWords.push(completeWord);
          importedCount++;
        } catch (err) {
          console.error('Failed to import word:', wordData, err);
          skippedCount++;
        }
      }

      // Save all words via background script
      const saveResponse = await chrome.runtime.sendMessage({ 
        action: 'saveAllWords', 
        words: existingWords 
      });
      
      if (!saveResponse.success) {
        throw new Error(saveResponse.error || 'Failed to save imported words');
      }

      this.hideLoading();
      alert([
        'Import Results:',
        `✅ ${importedCount} words successfully imported`,
        `⏭️ ${skippedCount} words skipped (already exist or invalid)`,
        `📊 Total processed: ${importedCount + skippedCount}/${wordsArray.length}`
      ].join('\n'));

      await this.loadStats();
      if (this.getEl('word-list-screen')?.style.display === 'block') {
        await this.showWordList();
      }
    } catch (err) {
      this.hideLoading();
      console.error('Import error:', err);
      this.showError('Failed to import vocabulary file: ' + err.message);
    } finally {
      event.target.value = '';
    }
  }

  // ---------------------------
  // UI helpers
  // ---------------------------
  getEl(id) {
    return document.getElementById(id);
  }

  showMainScreen() {
    this.hideAllScreens();
    this.getEl('main-screen').style.display = 'block';
    this.loadStats();
  }

  showLoading(message = 'Loading...') {
    this.hideAllScreens();
    this.getEl('loading-state').style.display = 'block';
    const loadingMessage = document.querySelector('#loading-state p');
    if (loadingMessage) loadingMessage.textContent = message;
  }

  hideLoading() {
    this.getEl('loading-state').style.display = 'none';
  }

  showError(message) {
    this.hideAllScreens();
    this.getEl('error-state').style.display = 'block';
    this.getEl('error-message').textContent = message;
  }

  hideAllScreens() {
    ['main-screen', 'word-list-screen', 'loading-state', 'error-state'].forEach(id => {
      const el = this.getEl(id);
      if (el) el.style.display = 'none';
    });
  }
}

// VocabSRSPopup class is now initialized by popup.entry.js after all scripts are loaded
