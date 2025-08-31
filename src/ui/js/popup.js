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

    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  // ---------------------------
  // Init & boot
  // ---------------------------
  async init() {
    // Load stats and bind events
    await this.loadStats();
    this.bindEvents();
  }

  // ---------------------------
  // Stats loader
  // ---------------------------
  async loadStats() {
    try {
      // Check if we're in a real extension environment
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        this.updateStatsDisplay([]);
        return;
      }
      
      // Try multiple times with increasing timeout
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
          
          // Race between message and timeout
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
      console.error('❌ Error loading stats from service worker:', error);
      
      // Fallback: try to read directly from Chrome Storage
      try {
        if (typeof chrome.storage !== 'undefined' && chrome.storage.local) {
          const result = await chrome.storage.local.get(['vocabWords']);
          const allWords = result.vocabWords || [];
          this.updateStatsDisplay(allWords);
        } else {
          throw new Error('Chrome storage not available');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        
        // Final fallback: show empty state
        this.updateStatsDisplay([]);
        
        // Only show error if we're not in a mock environment
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          this.showError('Failed to load vocabulary stats. Please refresh the extension.');
        }
      }
    }
  }

  updateStatsDisplay(allWords) {
    try {
      // Ensure allWords is an array
      if (!Array.isArray(allWords)) {
        allWords = [];
      }
      
      // Calculate due words (simplified)
      const dueWords = allWords.filter(word => {
        try {
          if (!word || !word.srs || !word.srs.nextReview) return true;
          const nextReview = new Date(word.srs.nextReview);
          return nextReview <= new Date();
        } catch (dateError) {
          return true; // Treat as due if date parsing fails
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

      // Enable/disable review button
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
      console.error('❌ Error updating stats display:', error);
      // Don't show error to user, just log it
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
    bindIf('back-from-list', 'click', () => this.showMainScreen());
    bindIf('retry-btn', 'click', () => this.loadStats());
    

    
    // Add search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      // Add debounced search to avoid too many searches while typing
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.handleSearch(e.target.value);
        }, 300); // Wait 300ms after user stops typing
      });
    }
  }



  // ---------------------------
  // Actions
  // ---------------------------
  async startReview() {
    try {
      this.showLoading();
      
      // Check if we're in a real extension environment
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        this.showError('Extension environment not available');
        return;
      }
      
      // Try to get words with timeout
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

      // Open review window
      try {
        const response = await chrome.runtime.sendMessage({ action: 'openReviewWindow' });
        if (response && response.success) {
          console.log('✅ Review window opened successfully');
          // Close popup after opening review window
          window.close();
        } else {
          throw new Error(response?.error || 'Failed to open review window');
        }
      } catch (error) {
        console.error('❌ Error opening review window:', error);
        this.showError('Failed to open review window: ' + error.message);
      }
      
    } catch (error) {
      console.error('❌ Error starting review:', error);
      
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
      
      // Check if we're in a real extension environment
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        allWords = [];
        source = 'mock';
      } else {
        // Try service worker with retry logic
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
        
        // Fallback to Chrome Storage if service worker failed
        if (allWords.length === 0) {
          try {
            if (typeof chrome.storage !== 'undefined' && chrome.storage.local) {
              const result = await chrome.storage.local.get(['vocabWords']);
              allWords = result.vocabWords || [];
              source = 'Chrome Storage';
            } else {
              throw new Error('Chrome storage not available');
            }
          } catch (storageError) {
            allWords = [];
            source = 'empty';
          }
        }
      }
      
      // Store all words for search functionality
      this.allWords = allWords;
      
      this.hideAllScreens();
      this.getEl('word-list-screen').style.display = 'block';
      this.renderWordList(allWords);
      
    } catch (error) {
      console.error('❌ Critical error showing word list:', error);
      this.showError('Failed to load word list: ' + error.message);
    }
  }

  // Handle search functionality
  handleSearch(searchTerm) {
    if (!this.allWords || this.allWords.length === 0) {
      return;
    }
    
    const filteredWords = this.allWords.filter(word => {
      const searchLower = searchTerm.toLowerCase().trim();
      if (!searchLower) return true; // Show all words if search is empty
      
      // Search in word, meaning, example, and phonetic
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
    
    // Update search status
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
      // Tìm từ cần xóa trong danh sách
      const wordToDelete = this.allWords.find(word => word.id === wordId);
      if (!wordToDelete) {
        this.showError('Không tìm thấy từ cần xóa');
        return;
      }
  
      // Kiểm tra điều kiện xóa
      const canDelete = this.checkDeleteConditions(wordToDelete);
      if (!canDelete.allowed) {
        this.showDeleteRestriction(canDelete.reason);
        return;
      }
  
      // Xác nhận xóa với thông tin về từ
      const confirmed = await this.confirmDeleteWithInfo(wordToDelete);
      if (!confirmed) return;
  
      // Tiến hành xóa
      if (window.VocabStorage && window.VocabStorage.removeWord) {
        await window.VocabStorage.removeWord(wordId);
        
        // Remove from local array
        this.allWords = this.allWords.filter(word => word.id !== wordId);
        
        // Refresh the word list and stats
        await this.loadStats();
        if (this.getEl('word-list-screen')?.style.display === 'block') {
          await this.showWordList();
        }
        
        return;
      }
      
      // Fallback: try service worker
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
      console.error('❌ Error deleting word:', error);
      this.showError('Failed to delete word');
    }
  }

  // Kiểm tra điều kiện xóa từ
  checkDeleteConditions(word) {
    const conditions = {
      allowed: false,
      reason: '',
      details: {}
    };
  
    // Điều kiện 1: Phải có đủ số lần ôn tập
    const minRepetitions = 5; // Cần ít nhất 5 lần ôn tập
    if (!word.srs || word.srs.repetitions < minRepetitions) {
      conditions.reason = `Cần ôn tập ít nhất ${minRepetitions} lần trước khi xóa`;
      conditions.details.repetitions = word.srs?.repetitions || 0;
      conditions.details.required = minRepetitions;
      return conditions;
    }
  
    // Điều kiện 2: Phải đạt độ khó nhất định (Easy trở lên)
    const minQuality = 3; // Quality 3 = Correct, 4 = Easy, 5 = Perfect
    if (!word.srs || word.srs.lastQuality < minQuality) {
      conditions.reason = 'Cần đạt ít nhất mức "Correct" trước khi xóa';
      conditions.details.lastQuality = word.srs?.lastQuality || 0;
      conditions.details.required = minQuality;
      return conditions;
    }
  
    // Điều kiện 3: Phải vượt qua khoảng thời gian tối thiểu
    const minInterval = 7; // Ít nhất 7 ngày
    if (!word.srs || word.srs.interval < minInterval) {
      conditions.reason = `Cần duy trì ít nhất ${minInterval} ngày trước khi xóa`;
      conditions.details.interval = word.srs?.interval || 0;
      conditions.details.required = minInterval;
      return conditions;
    }
  
    // Điều kiện 4: Phải có ít nhất 3 lần ôn tập liên tiếp thành công
    const minStreak = 3;
    if (!word.srs || word.srs.successStreak < minStreak) {
      conditions.reason = `Cần có ít nhất ${minStreak} lần ôn tập thành công liên tiếp`;
      conditions.details.successStreak = word.srs?.successStreak || 0;
      conditions.details.required = minStreak;
      return conditions;
    }
  
    // Tất cả điều kiện đều thỏa mãn
    conditions.allowed = true;
    conditions.reason = 'Có thể xóa từ này';
    return conditions;
  }
  
  // Hiển thị thông báo hạn chế xóa
  showDeleteRestriction(reason) {
    const message = `Không thể xóa từ này:\n\n${reason}\n\nHãy tiếp tục ôn tập để đạt điều kiện xóa.`;
    alert(message);
  }
  
  // Xác nhận xóa với thông tin chi tiết
  async confirmDeleteWithInfo(word) {
    const message = `Bạn có chắc muốn xóa từ "${word.word}"?\n\n` +
      `• Đã ôn tập: ${word.srs?.repetitions || 0} lần\n` +
      `• Chất lượng cuối: ${this.getQualityText(word.srs?.lastQuality)}\n` +
      `• Khoảng thời gian: ${word.srs?.interval || 0} ngày\n` +
      `• Chuỗi thành công: ${word.srs?.successStreak || 0} lần\n\n` +
      `Từ này đã đạt điều kiện xóa. Việc xóa không thể hoàn tác!`;
    
    return confirm(message);
  }
  
  // Chuyển đổi số quality thành text
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

  // Placeholder functions for other actions
  openAnalytics() {
    chrome.runtime.sendMessage({ action: 'openAnalyticsWindow' });
  }

  openSettings() {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/html/options.html') });
  }

  async exportVocab() {
    try {
      // Check if we're in a real extension environment
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        this.showError('Extension environment not available');
        return;
      }
      
      // Try to get words with timeout
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
      console.error('❌ Export error:', error);
      
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
