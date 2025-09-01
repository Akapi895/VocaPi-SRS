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

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  async init() {
    await this.loadStats();
    this.bindEvents();
  }

  async loadStats() {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        this.updateStatsDisplay([]);
        return;
      }
      
      let response = null;
      let lastError = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Service worker timeout (${attempt * 3}s)`)), attempt * 3000);
          });
          
          const messagePromise = chrome.runtime.sendMessage({ 
            action: 'getWords',
            attempt: attempt,
            timestamp: Date.now()
          });
          
          response = await Promise.race([messagePromise, timeoutPromise]);
          
          if (response && response.success) {
            break;
          } else {
            throw new Error(response?.error || 'Invalid response from service worker');
          }
          
        } catch (error) {
          lastError = error;
          
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (!response || !response.success) {
        throw lastError || new Error('All attempts failed');
      }
      
      const allWords = response.words || [];
      this.updateStatsDisplay(allWords);
      
    } catch (error) {
      try {
        if (typeof chrome.storage !== 'undefined' && chrome.storage.local) {
          const result = await chrome.storage.local.get(['vocabWords']);
          const allWords = result.vocabWords || [];
          this.updateStatsDisplay(allWords);
        } else {
          throw new Error('Chrome storage not available');
        }
      } catch (fallbackError) {
        this.updateStatsDisplay([]);
        
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          this.showError('Failed to load vocabulary stats. Please refresh the extension.');
        }
      }
    }
  }

  updateStatsDisplay(allWords) {
    try {
      if (!Array.isArray(allWords)) {
        allWords = [];
      }
      
      const dueWords = allWords.filter(word => {
        try {
          if (!word || !word.srs || !word.srs.nextReview) 
            return word.srs && word.srs.repetitions > 0 ? false : true;
          const nextReview = new Date(word.srs.nextReview);
          return nextReview <= new Date();
        } catch (dateError) {
          return true;
        }
      });

      const totalWordsEl = document.getElementById('total-words');
      const dueWordsEl = document.getElementById('due-words');
      
      if (totalWordsEl) {
        totalWordsEl.textContent = allWords.length;
      }
      if (dueWordsEl) {
        dueWordsEl.textContent = dueWords.length;
      }

      const reviewBtn = document.getElementById('start-review-btn');
      
      if (reviewBtn) {
        if (dueWords.length === 0) {
          reviewBtn.disabled = true;
          reviewBtn.innerHTML = '<span class="btn-icon">✓</span>No words due';
        } else {
          reviewBtn.disabled = false;
          reviewBtn.innerHTML = '<span class="btn-icon">🔄</span>Start Review';
        }
      }
      
    } catch (error) {
      console.error('Error updating stats display:', error);
    }
  }

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
    bindIf('back-from-list', 'click', () => this.showMainScreen());
    bindIf('retry-btn', 'click', () => this.loadStats());
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.handleSearch(e.target.value);
        }, 300);
      });
    }
  }

  async startReview() {
    try {
      this.showLoading();
      
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        this.showError('Extension environment not available');
        return;
      }
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Service worker timeout')), 5000);
      });
      
      const messagePromise = chrome.runtime.sendMessage({ action: 'getWords' });
      const response = await Promise.race([messagePromise, timeoutPromise]);
      
      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to get words');
      }
      
      const allWords = response.words || [];
      
      if (allWords.length === 0) {
        this.showError('No words in your dictionary yet');
        return;
      }

      const sortedWords = this.sortWordsByNextReview(allWords);

      try {
          const response = await chrome.runtime.sendMessage({ 
              action: 'openReviewWindow',
              sortedWords: sortedWords
          });
          if (response && response.success) {
              window.close();
          } else {
              throw new Error(response?.error || 'Failed to open review window');
          }
      } catch (error) {
          console.error('Error opening review window:', error);
          this.showError('Failed to open review window: ' + error.message);
      }
      
    } catch (error) {
      if (error.message.includes('timeout')) {
        this.showError('Service worker not responding. Please refresh the extension.');
      } else {
        this.showError('Failed to start review: ' + error.message);
      }
    }
  }

  async showWordList() {
    try {
      this.showLoading();
      
      let allWords = [];
      let source = 'unknown';
      
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        allWords = [];
        source = 'mock';
      } else {
        let response = null;
        let lastError = null;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error(`Service worker timeout (${attempt * 3}s)`)), attempt * 3000);
            });
            
            const messagePromise = chrome.runtime.sendMessage({ 
              action: 'getWords',
              attempt: attempt,
              timestamp: Date.now()
            });
            
            response = await Promise.race([messagePromise, timeoutPromise]);
            
            if (response && response.success) {
              allWords = response.words || [];
              source = response.source || 'service worker';
              break;
            } else {
              throw new Error(response?.error || 'Invalid response from service worker');
            }
            
          } catch (error) {
            lastError = error;
            
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (allWords.length === 0) {
          try {
            if (typeof chrome.storage !== 'undefined' && chrome.storage.local) {
              const result = await chrome.storage.local.get(['vocabWords']);
              allWords = result.vocabWords || [];
              source = 'Chrome Storage (Fallback)';
            } else {
              throw new Error('Chrome storage not available');
            }
          } catch (storageError) {
            allWords = [];
            source = 'empty';
          }
        }
      }
      
      this.allWords = allWords;
      
      this.hideAllScreens();
      this.getEl('word-list-screen').style.display = 'block';
      this.renderWordList(allWords);
      
    } catch (error) {
      console.error('Critical error showing word list:', error);
      this.showError('Failed to load word list: ' + error.message);
    }
  }

  handleSearch(searchTerm) {
    if (!this.allWords || this.allWords.length === 0) {
      return;
    }
    
    const filteredWords = this.allWords.filter(word => {
      const searchLower = searchTerm.toLowerCase().trim();
      if (!searchLower) return true;
      
      return (
        word.word.toLowerCase().includes(searchLower) ||
        word.meaning.toLowerCase().includes(searchLower) ||
        (word.example && word.example.toLowerCase().includes(searchLower)) ||
        (word.phonetic && word.phonetic.toLowerCase().includes(searchLower))
      );
    });
    
    this.renderWordList(filteredWords);
  }

  renderWordList(words) {
    const wordList = this.getEl('word-list');
    const searchStatus = document.getElementById('search-status');
    if (!wordList) return;
    
    if (searchStatus) {
      if (this.allWords && this.allWords.length > 0) {
        if (words.length === this.allWords.length) {
          searchStatus.textContent = `Showing all ${words.length} words`;
        } else {
          searchStatus.textContent = `Found ${words.length} of ${this.allWords.length} words`;
        }
      } else {
        searchStatus.textContent = '';
      }
    }
    
    if (words.length === 0) {
      wordList.innerHTML = '<div class="empty-state">No words found matching your search</div>';
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
          <button class="delete-word-btn" data-word-id="${word.id}" title="Delete word">🗑️</button>
        </div>
      </div>
    `).join('');

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
      const wordToDelete = this.allWords.find(word => word.id === wordId);
      if (!wordToDelete) {
        this.showError('Không tìm thấy từ cần xóa');
        return;
      }
  
      const canDelete = this.checkDeleteConditions(wordToDelete);
      if (!canDelete.allowed) {
        this.showDeleteRestriction(canDelete.reason);
        return;
      }
  
      const confirmed = await this.confirmDeleteWithInfo(wordToDelete);
      if (!confirmed) {
        return;
      }
  
      if (window.VocabStorage && window.VocabStorage.removeWord) {
        await window.VocabStorage.removeWord(wordId);
        
        this.allWords = this.allWords.filter(word => word.id !== wordId);
        
        await this.loadStats();
        if (this.getEl('word-list-screen')?.style.display === 'block') {
          await this.showWordList();
        }
        
        return;
      }
      
      const response = await chrome.runtime.sendMessage({ action: 'deleteWord', wordId });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete word');
      }
      
      await this.loadStats();
      if (this.getEl('word-list-screen')?.style.display === 'block') {
        await this.showWordList();
      }
    } catch (error) {
      console.error('Error deleting word:', error);
      this.showError('Failed to delete word');
    }
  }

  checkDeleteConditions(word) {
    const conditions = {
      allowed: false,
      reason: '',
      details: {}
    };
  
    const minRepetitions = 5;
    if (!word.srs || word.srs.repetitions < minRepetitions) {
      conditions.reason = `Cần ôn tập ít nhất ${minRepetitions} lần trước khi xóa`;
      conditions.details.repetitions = word.srs?.repetitions || 0;
      conditions.details.required = minRepetitions;
      return conditions;
    }
  
    const minQuality = 3;
    if (!word.srs || word.srs.lastQuality < minQuality) {
      conditions.reason = 'Cần đạt ít nhất mức "Correct" trước khi xóa';
      conditions.details.lastQuality = word.srs?.lastQuality || 0;
      conditions.details.required = minQuality;
      return conditions;
    }
  
    const minInterval = 7;
    if (!word.srs || word.srs.interval < minInterval) {
      conditions.reason = `Cần duy trì ít nhất ${minInterval} ngày trước khi xóa`;
      conditions.details.interval = word.srs?.interval || 0;
      conditions.details.required = minInterval;
      return conditions;
    }
  
    const minStreak = 3;
    if (!word.srs || word.srs.successStreak < minStreak) {
      conditions.reason = `Cần có ít nhất ${minStreak} lần ôn tập thành công liên tiếp`;
      conditions.details.successStreak = word.srs?.successStreak || 0;
      conditions.details.required = minStreak;
      return conditions;
    }
  
    conditions.allowed = true;
    conditions.reason = 'Có thể xóa từ này';
    return conditions;
  }
  
  showDeleteRestriction(reason) {
    const message = `Không thể xóa từ này:\n\n${reason}\n\nHãy tiếp tục ôn tập để đạt điều kiện xóa.`;
    alert(message);
  }
  
  async confirmDeleteWithInfo(word) {
    const message = `Bạn có chắc muốn xóa từ "${word.word}"?\n\n` +
      `• Đã ôn tập: ${word.srs?.repetitions || 0} lần\n` +
      `• Chất lượng cuối: ${this.getQualityText(word.srs?.lastQuality)}\n` +
      `• Khoảng thời gian: ${word.srs?.interval || 0} ngày\n` +
      `• Chuỗi thành công: ${word.srs?.successStreak || 0} lần\n\n` +
      `Từ này đã đạt điều kiện xóa. Việc xóa không thể hoàn tác!`;
    
    return confirm(message);
  }
  
  getQualityText(quality) {
    const qualityMap = {
      0: 'Blackout',
      1: 'Incorrect', 
      2: 'Hard',
      3: 'Correct',
      4: 'Easy',
      5: 'Perfect'
    };
    return qualityMap[quality] || 'Unknown';
  }

  openAnalytics() {
    chrome.runtime.sendMessage({ action: 'openAnalyticsWindow' });
  }

  openSettings() {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/html/options.html') });
  }

  async exportVocab() {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        this.showError('Extension environment not available');
        return;
      }
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Service worker timeout')), 5000);
      });
      
      const messagePromise = chrome.runtime.sendMessage({ action: 'getWords' });
      const response = await Promise.race([messagePromise, timeoutPromise]);
      
      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to get words');
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
      if (error.message.includes('timeout')) {
        this.showError('Service worker not responding. Please refresh the extension.');
      } else {
        this.showError('Failed to export vocabulary: ' + error.message);
      }
    }
  }

  importVocab() {
    document.getElementById('import-file').click();
  }

  async handleFileImport(event) {
    try {
      const file = event.target.files[0];
      if (!file) {
        return;
      }
      
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
            example: wordData.example || '',
            phonetic: wordData.phonetic || '',
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
          skippedCount++;
        }
      }

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

  sortWordsByNextReview(words) {
    return [...words].sort((a, b) => {
      const aTime = a.srs?.nextReview ? 
          (typeof a.srs.nextReview === "string" ? new Date(a.srs.nextReview).getTime() : a.srs.nextReview) : 0;
      const bTime = b.srs?.nextReview ? 
          (typeof b.srs.nextReview === "string" ? new Date(b.srs.nextReview).getTime() : b.srs.nextReview) : 0;
      
      if (aTime > 0 && bTime > 0) {
          return aTime - bTime;
      }
      
      if (aTime === 0 && bTime > 0) return -1;
      if (aTime > 0 && bTime === 0) return 1;
      
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bCreated - aCreated;
    });
  }
}
