// src/ui/js/popup.js - Simplified without modules
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
    this.gamificationUI = null;

    this.init();
  }

  // ---------------------------
  // Init & boot
  // ---------------------------
  async init() {
    console.log('🚀 Initializing Vocab SRS Popup');

    // Load stats and bind events
    await this.loadStats();
    this.bindEvents();
  }

  // ---------------------------
  // Stats loader
  // ---------------------------
  async loadStats() {
    try {
      // Get words from storage
      const result = await chrome.storage.sync.get(['vocabWords']);
      const allWords = result.vocabWords || [];
      
      // Calculate due words (simplified)
      const dueWords = allWords.filter(word => {
        if (!word.srs || !word.srs.nextReview) return true;
        const nextReview = new Date(word.srs.nextReview);
        return nextReview <= new Date();
      });

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

      console.log('✅ Stats loaded:', { total: allWords.length, due: dueWords.length });
    } catch (error) {
      console.error('Error loading stats:', error);
      this.showError('Failed to load vocabulary stats');
    }
  }

  // ---------------------------
  // Event bindings
  // ---------------------------
  bindEvents() {
    const bindIf = (id, ev, handler) => {
      const el = document.getElementById(id);
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
    if (debugBtn) {
      debugBtn.addEventListener('click', () => this.debugStorage());
    }
  }

  // Debug storage function
  async debugStorage() {
    try {
      console.log('🔍 Debugging storage...');
      
      // Get all storage data
      const result = await chrome.storage.sync.get(null);
      console.log('📦 All storage data:', result);
      
      // Check specific vocabWords
      const vocabResult = await chrome.storage.sync.get(['vocabWords']);
      console.log('📚 VocabWords data:', vocabResult);
      
      // Check storage usage
      const usage = await chrome.storage.sync.getBytesInUse();
      console.log('💾 Storage usage:', usage, 'bytes');
      
      // Show alert with info
      const vocabWords = vocabResult.vocabWords || [];
      alert(`Storage Debug Info:\n\n` +
            `Total storage keys: ${Object.keys(result).length}\n` +
            `VocabWords count: ${vocabWords.length}\n` +
            `Storage usage: ${usage} bytes\n\n` +
            `VocabWords: ${vocabWords.map(w => w.word).join(', ') || 'None'}`);
      
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
      const result = await chrome.storage.sync.get(['vocabWords']);
      const allWords = result.vocabWords || [];
      
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
      const result = await chrome.storage.sync.get(['vocabWords']);
      const allWords = result.vocabWords || [];
      
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
    if (!confirm('Are you sure you want to delete this word?')) return;
    
    try {
      const result = await chrome.storage.sync.get(['vocabWords']);
      const allWords = result.vocabWords || [];
      const updatedWords = allWords.filter(w => w.id !== wordId);
      
      await chrome.storage.sync.set({ vocabWords: updatedWords });
      
      // Refresh display
      this.renderWordList(updatedWords);
      this.loadStats();
      
      console.log('✅ Word deleted successfully');
    } catch (error) {
      console.error('Error deleting word:', error);
      this.showError('Failed to delete word');
    }
  }

  async openAnalytics() {
    try {
      chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/html/analytics.html') });
      window.close();
    } catch (error) {
      console.error('Error opening analytics:', error);
      this.showError('Failed to open analytics');
    }
  }

  async openSettings() {
    try {
      chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/html/options.html') });
      window.close();
    } catch (error) {
      console.error('Error opening settings:', error);
      this.showError('Failed to open settings');
    }
  }

  async exportVocab() {
    try {
      const result = await chrome.storage.sync.get(['vocabWords']);
      const allWords = result.vocabWords || [];
      
      const exportData = { 
        version: '1.0.0', 
        exportedAt: new Date().toISOString(), 
        words: allWords 
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vocab-srs-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
      console.log('✅ Vocabulary exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      this.showError('Failed to export vocabulary');
    }
  }

  importVocab() {
    this.getEl('import-file').click();
  }

  async handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      this.showLoading('Importing vocabulary...');
      const text = await file.text();
      const importData = JSON.parse(text);
      
      let wordsArray;
      if (importData.words && Array.isArray(importData.words)) {
        wordsArray = importData.words;
      } else if (Array.isArray(importData)) {
        wordsArray = importData;
      } else {
        throw new Error('Invalid file format');
      }

      if (wordsArray.length === 0) {
        throw new Error('No words found in the file');
      }

      // Get existing words
      const result = await chrome.storage.sync.get(['vocabWords']);
      const existingWords = result.vocabWords || [];
      const existingWordsSet = new Set(existingWords.map(w => w.word.toLowerCase()));

      let importedCount = 0;
      let skippedCount = 0;

      for (const wordData of wordsArray) {
        try {
          if (!wordData.word || typeof wordData.word !== 'string') {
            skippedCount++;
            continue;
          }

          if (existingWordsSet.has(wordData.word.toLowerCase())) {
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

      // Save all words
      await chrome.storage.sync.set({ vocabWords: existingWords });

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

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, creating VocabSRSPopup...');
  new VocabSRSPopup();
});
