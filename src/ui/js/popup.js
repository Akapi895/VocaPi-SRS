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
    this.fastGamificationWidget = null;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  async init() {
    await this.loadStats();
    await this.initGamificationWidget();
    this.bindEvents();
  }

  async initGamificationWidget() {
    try {
      // Wait for gamification scripts to load
      if (window.FastGamificationWidget) {
        this.fastGamificationWidget = new window.FastGamificationWidget();
        const container = document.getElementById('gamification-widget');
        if (container) {
          this.fastGamificationWidget.render(container);

        }
      } else {
        console.warn('FastGamificationWidget not available, using fallback');
        this.updateGamificationFallback();
      }
    } catch (error) {
      console.error('Failed to initialize gamification widget:', error);
      this.updateGamificationFallback();
    }
  }

  async updateGamificationFallback() {
    try {
      // Fallback: Load gamification data manually
      if (window.VocabGamification) {
        const gamification = new window.VocabGamification();
        await gamification.initializeGamification();
        
        const [playerStats, challenge] = await Promise.all([
          gamification.getPlayerStats(),
          gamification.getCurrentChallenge()
        ]);

        let analyticsData = null;
        try {
          if (window.VocabAnalytics) {
            const analytics = new window.VocabAnalytics();
            await analytics.ensureInitialized();
            analyticsData = await analytics.getAnalyticsData();
          }
        } catch (analyticsError) {
          console.warn('Could not load analytics data in popup fallback:', analyticsError);
        }

        const mergedStats = {
          ...playerStats,
          overallAccuracy: analyticsData?.overallAccuracy || 0,
          currentStreak: analyticsData?.currentStreak || 0
        };

        this.updateGamificationDisplay(mergedStats, challenge);
      }
    } catch (error) {
      console.error('Failed to load gamification fallback data:', error);
    }
  }

  updateGamificationDisplay(playerStats, challenge) {
    const levelEl = document.querySelector('.gamification-level');
    const xpEl = document.querySelector('.gamification-xp');
    const streakEl = document.querySelector('.study-streak');
    const accuracyEl = document.querySelector('.accuracy-rate');



    if (levelEl && playerStats) {
      levelEl.textContent = playerStats.level || 1;
    }

    if (xpEl && playerStats) {
      xpEl.textContent = playerStats.currentXP || 0;
    }

    if (streakEl && playerStats) {
      streakEl.textContent = `${playerStats.currentStreak || 0} days`;
    }

    if (accuracyEl && playerStats) {
      const accuracyValue = Math.round(playerStats.overallAccuracy || 0);
      accuracyEl.textContent = `${accuracyValue}%`;

    }
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
      const analyticsBtn = document.getElementById('view-analytics-btn');
      
      if (reviewBtn) {
        if (dueWords.length === 0) {
          reviewBtn.disabled = true;
          reviewBtn.innerHTML = '<span class="btn-icon">✓</span>No words due';
        } else {
          reviewBtn.disabled = false;
          reviewBtn.innerHTML = '<span class="btn-icon">🔄</span>Start Review';
        }
      }
      
      if (analyticsBtn) {
        if (allWords.length === 0) {
          analyticsBtn.disabled = true;
          analyticsBtn.innerHTML = '<span class="btn-icon">📊</span>No data yet';
          analyticsBtn.title = 'Add some words to view analytics';
        } else {
          analyticsBtn.disabled = false;
          analyticsBtn.innerHTML = '<span class="btn-icon">📊</span>Analytics';
          analyticsBtn.title = 'View learning analytics';
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
    
    window.addEventListener('vocabAnalyticsUpdated', () => {
      this.refreshGamificationData();
    });

    window.addEventListener('wordReviewed', () => {
      this.refreshGamificationData();
    });
    
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

  async refreshGamificationData() {
    try {
      if (this.fastGamificationWidget) {
        // Refresh the widget if available
        const container = document.getElementById('gamification-widget');
        if (container) {
          this.fastGamificationWidget.clearCache();
          this.fastGamificationWidget.loadActualData(container);
        }
      } else {
        // Fallback: Update manually
        await this.updateGamificationFallback();
      }
    } catch (error) {
      console.error('Failed to refresh gamification data:', error);
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

    wordList.innerHTML = words.map(word => {
      const isDue = this.isWordDue(word);
      const dueClass = isDue ? 'word-item-due' : '';
      const dueTitle = isDue ? 'This word is due for review - complete your review to see details' : '';
      
      return `
        <div class="word-item ${dueClass}" title="${dueTitle}">
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
          ${isDue ? '<span class="due-indicator" title="Due for review">⏰</span>' : ''}
        </div>
      `;
    }).join('');

    wordList.querySelectorAll('.delete-word-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.deleteWord(btn.dataset.wordId);
      });
    });
  }

  isWordDue(word) {
    try {
      if (!word || !word.srs || !word.srs.nextReview) {
        return word.srs && word.srs.repetitions > 0 ? false : true;
      }
      
      const nextReview = new Date(word.srs.nextReview);
      const now = new Date();
      return nextReview <= now;
    } catch (dateError) {
      return true;
    }
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
    const message = `Không thể xóa từ này: ${reason}. Hãy tiếp tục ôn tập để đạt điều kiện xóa.`;
    this.showMessage(message, 'warning');
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
    // Check if there are any words before opening analytics
    const totalWordsEl = document.getElementById('total-words');
    const totalWords = totalWordsEl ? parseInt(totalWordsEl.textContent) || 0 : 0;
    
    if (totalWords === 0) {
      this.showMessage('Add some words first to view analytics!', 'warning');
      return;
    }
    
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
      
      this.showLoading('Exporting all data...');
      
      // ✅ SỬA: Export tất cả dữ liệu quan trọng
      const exportData = {
        exportInfo: {
          version: '2.0',
          exportDate: new Date().toISOString(),
          description: 'Complete Vocab SRS data export including words, analytics, and gamification'
        },
        words: [],
        analytics: null,
        gamification: null
      };
      
      // 1. Export words data
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Service worker timeout')), 5000);
        });
        
        const messagePromise = chrome.runtime.sendMessage({ action: 'getWords' });
        const response = await Promise.race([messagePromise, timeoutPromise]);
        
        if (response && response.success) {
          exportData.words = response.words || [];
        }
      } catch (error) {
        console.warn('Failed to export words:', error);
        exportData.words = [];
      }
      
      // 2. Export analytics data
      try {
        if (window.VocabAnalytics) {
          const analytics = new window.VocabAnalytics();
          await analytics.ensureInitialized();
          exportData.analytics = await analytics.getAnalyticsData();

        }
      } catch (error) {
        console.warn('Failed to export analytics:', error);
        exportData.analytics = null;
      }
      
      // 3. Export gamification data
      try {
        if (window.VocabGamification) {
          const gamification = new window.VocabGamification();
          await gamification.initializeGamification();
          exportData.gamification = {
            playerStats: await gamification.getPlayerStats(),
            achievements: await gamification.getAllAchievements(),
            dailyChallenge: await gamification.getCurrentChallenge()
          };

        }
      } catch (error) {
        console.warn('Failed to export gamification:', error);
        exportData.gamification = null;
      }
      
      // 4. Export Chrome Storage data (fallback)
      try {
        if (typeof chrome.storage !== 'undefined' && chrome.storage.local) {
          const storageData = await chrome.storage.local.get(null);
          exportData.storage = storageData;

        }
      } catch (error) {
        console.warn('Failed to export storage:', error);
        exportData.storage = null;
      }
      
      this.hideLoading();
      
      if (exportData.words.length === 0 && !exportData.analytics && !exportData.gamification) {
        this.showMessage('No data to export', 'warning');
        return;
      }
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `vocab-complete-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      // ✅ SỬA: Show success message với push notification
      const exportedItems = [];
      if (exportData.words.length > 0) exportedItems.push(`${exportData.words.length} words`);
      if (exportData.analytics) exportedItems.push('analytics data');
      if (exportData.gamification) exportedItems.push('gamification data');
      if (exportData.storage) exportedItems.push('storage data');
      
      this.showMessage('✅ Export successful!');
      
    
      this.showMainScreen();
      
    } catch (error) {
      this.hideLoading();
      if (error.message.includes('timeout')) {
        this.showError('Service worker not responding. Please refresh the extension.');
      } else {
        this.showError('Failed to export data: ' + error.message);
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
      const importData = JSON.parse(text);
      
      this.showLoading('Importing data...');
      
      let importedWords = 0;
      let importedAnalytics = false;
      let importedGamification = false;
      let importedStorage = false;
      let skippedWords = 0;
      
      // ✅ SỬA: Kiểm tra format file mới (v2.0) hoặc cũ (array of words)
      if (importData.exportInfo && importData.exportInfo.version === '2.0') {
        // New format with complete data
        console.log('📥 Importing complete data format v2.0');
        
        // 1. Import words
        if (importData.words && Array.isArray(importData.words)) {
          const existingWords = [];
          
          for (const wordData of importData.words) {
            try {
              if (!wordData.word || !wordData.meaning) {
                skippedWords++;
                continue;
              }
              
              // Preserve original data if available, otherwise create new
              const completeWord = {
                id: wordData.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9)),
                word: wordData.word.trim(),
                meaning: wordData.meaning || '',
                example: wordData.example || '',
                phonetic: wordData.phonetic || '',
                audioUrl: wordData.audioUrl || '',
                createdAt: wordData.createdAt || new Date().toISOString(),
                lastModified: new Date().toISOString(),
                srs: wordData.srs || {
                  interval: 1,
                  repetitions: 0,
                  easiness: 2.5,
                  nextReview: new Date().toISOString()
                }
              };

              existingWords.push(completeWord);
              importedWords++;
            } catch (err) {
              skippedWords++;
            }
          }

          if (existingWords.length > 0) {
            const saveResponse = await chrome.runtime.sendMessage({ 
              action: 'saveAllWords', 
              words: existingWords 
            });
            
            if (!saveResponse.success) {
              throw new Error(saveResponse.error || 'Failed to save imported words');
            }
            
            // Update analytics data to reflect new words
            if (window.VocabAnalytics) {
              try {
                const analytics = new window.VocabAnalytics();
                await analytics.ensureInitialized();
                const currentData = await analytics.getAnalyticsData();
                
                // Add new words to analytics
                const updatedData = { ...currentData };
                existingWords.forEach(word => {
                  if (!updatedData.wordsLearned[word.id]) {
                    updatedData.wordsLearned[word.id] = {
                      firstReviewed: word.createdAt || new Date().toISOString(),
                      reviewCount: word.srs?.repetitions || 0,
                      correctCount: word.srs?.repetitions || 0,
                      totalTimeSpent: 0,
                      averageQuality: word.srs?.easeFactor ? Math.min(5, Math.max(1, word.srs.easeFactor)) : 3,
                      lastReviewed: word.lastModified || word.createdAt || new Date().toISOString()
                    };
                  }
                });
                
                // Update total words count
                updatedData.totalWords = Object.keys(updatedData.wordsLearned).length;
                
                // Save updated analytics
                if (window.AnalyticsStorage) {
                  await window.AnalyticsStorage.saveData(updatedData);
                }
              } catch (error) {
                console.warn('Failed to update analytics with new words:', error);
              }
            }
          }
        }
        
        // 2. Import analytics data
        if (importData.analytics) {
          try {
            if (window.VocabAnalytics) {
              const analytics = new window.VocabAnalytics();
              await analytics.ensureInitialized();
              
              // Get current analytics data
              const currentData = await analytics.getAnalyticsData();
              
              // Merge analytics data properly
              const mergedData = {
                ...currentData,
                // Merge wordsLearned (combine both datasets)
                wordsLearned: {
                  ...(currentData.wordsLearned || {}),
                  ...(importData.analytics.wordsLearned || {})
                },
                // Merge dailyStats (combine both datasets)
                dailyStats: {
                  ...(currentData.dailyStats || {}),
                  ...(importData.analytics.dailyStats || {})
                },
                // Merge reviewSessions (combine arrays)
                reviewSessions: [
                  ...(currentData.reviewSessions || []),
                  ...(importData.analytics.reviewSessions || [])
                ],
                // Update totalWords count
                totalWords: (currentData.totalWords || 0) + (importData.analytics.totalWords || 0),
                // Keep the higher values for streaks and best stats
                currentStreak: Math.max(currentData.currentStreak || 0, importData.analytics.currentStreak || 0),
                bestStreak: Math.max(currentData.bestStreak || 0, importData.analytics.bestStreak || 0),
                // Keep the most recent dates
                lastReviewDate: importData.analytics.lastReviewDate || currentData.lastReviewDate,
                lastImportDate: new Date().toISOString()
              };
              
              // Save merged data
              if (window.AnalyticsStorage) {
                await window.AnalyticsStorage.saveData(mergedData);
                importedAnalytics = true;
              }
            }
          } catch (error) {
            console.warn('Failed to import analytics:', error);
          }
        }
        
        // 3. Import gamification data
        if (importData.gamification) {
          try {
            if (window.VocabGamification) {
              const gamification = new window.VocabGamification();
              await gamification.initializeGamification();
              
              // Import player stats and achievements
              if (importData.gamification.playerStats) {
                // Merge player stats
                const currentStats = await gamification.getPlayerStats();
                const mergedStats = {
                  ...currentStats,
                  ...importData.gamification.playerStats,
                  lastImportDate: new Date().toISOString()
                };
                
                // Save to storage
                if (window.GamificationStorage) {
                  await window.GamificationStorage.saveData(mergedStats);
                  importedGamification = true;

                }
              }
            }
          } catch (error) {
            console.warn('Failed to import gamification:', error);
          }
        }
        
        // 4. Import storage data (fallback)
        if (importData.storage) {
          try {
            if (typeof chrome.storage !== 'undefined' && chrome.storage.local) {
              // Merge with existing storage
              const currentStorage = await chrome.storage.local.get(null);
              const mergedStorage = {
                ...currentStorage,
                ...importData.storage,
                lastImportDate: new Date().toISOString()
              };
              
              await chrome.storage.local.set(mergedStorage);
              importedStorage = true;

            }
          } catch (error) {
            console.warn('Failed to import storage:', error);
          }
        }
        
      } else if (Array.isArray(importData)) {
        // Legacy format - array of words only
        console.log('📥 Importing legacy format (words only)');
        
        const existingWords = [];
        
        for (const wordData of importData) {
          try {
            if (!wordData.word || !wordData.meaning) {
              skippedWords++;
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
            importedWords++;
          } catch (err) {
            skippedWords++;
          }
        }

        if (existingWords.length > 0) {
          const saveResponse = await chrome.runtime.sendMessage({ 
            action: 'saveAllWords', 
            words: existingWords 
          });
          
          if (!saveResponse.success) {
            throw new Error(saveResponse.error || 'Failed to save imported words');
          }
          
          // Update analytics data to reflect new words
          if (window.VocabAnalytics) {
            try {
              const analytics = new window.VocabAnalytics();
              await analytics.ensureInitialized();
              const currentData = await analytics.getAnalyticsData();
              
              // Add new words to analytics
              const updatedData = { ...currentData };
              existingWords.forEach(word => {
                if (!updatedData.wordsLearned[word.id]) {
                  updatedData.wordsLearned[word.id] = {
                    firstReviewed: word.createdAt || new Date().toISOString(),
                    reviewCount: word.srs?.repetitions || 0,
                    correctCount: word.srs?.repetitions || 0,
                    totalTimeSpent: 0,
                    averageQuality: word.srs?.easeFactor ? Math.min(5, Math.max(1, word.srs.easeFactor)) : 3,
                    lastReviewed: word.lastModified || word.createdAt || new Date().toISOString()
                  };
                }
              });
              
              // Update total words count
              updatedData.totalWords = Object.keys(updatedData.wordsLearned).length;
              
              // Save updated analytics
              if (window.AnalyticsStorage) {
                await window.AnalyticsStorage.saveData(updatedData);
              }
            } catch (error) {
              console.warn('Failed to update analytics with new words:', error);
            }
          }
        }
      } else {
        throw new Error('Invalid file format: expected complete data export or array of words');
      }

      this.hideLoading();
      
      // Show import results
      const importResults = [];
      if (importedWords > 0) importResults.push(`✅ ${importedWords} words imported`);
      if (skippedWords > 0) importResults.push(`⏭️ ${skippedWords} words skipped`);
      if (importedAnalytics) importResults.push('✅ Analytics data imported');
      if (importedGamification) importResults.push('✅ Gamification data imported');
      if (importedStorage) importResults.push('✅ Storage data imported');
      

      if (importResults.length === 0) {
        this.showMessage('No data was imported. Please check the file format.', 'warning');
      } else {
        this.showMessage('✅ Import successful!');
      }


      this.showMainScreen();
      await this.loadStats();
      
      // Trigger analytics refresh event
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('analyticsUpdated'));
      }
    } catch (err) {
      this.hideLoading();
      console.error('Import error:', err);
      this.showError('Failed to import data: ' + err.message);
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
    // ✅ SỬA: Load stats async để không block UI
    this.loadStats().catch(error => {
      console.warn('Failed to load stats in showMainScreen:', error);
    });
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

  showMessage(message, type = 'info') {
    let toastContainer = document.getElementById('popup-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'popup-toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      `;
      document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = 'popup-toast';
    toast.setAttribute('data-type', type);
    

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      export: '📤',
      import: '📥',
      info: 'ℹ️'
    };
    

    toast.innerHTML = `
      <div class="popup-toast-content">
        <div class="popup-toast-icon">${icons[type] || icons.info}</div>
        <div class="popup-toast-message">${message}</div>
        <button class="popup-toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    

    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      background: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      max-width: 350px;
      transform: translateX(400px);
      opacity: 0;
      transition: all 0.3s ease-out;
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    

    const borderColors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      export: '#6366f1',
      import: '#22c55e',
      info: '#3b82f6'
    };
    
    toast.style.borderLeft = `4px solid ${borderColors[type] || borderColors.info}`;
    

    toastContainer.appendChild(toast);
    

    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    }, 100);
    

    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.style.transform = 'translateX(400px)';
        toast.style.opacity = '0';
        setTimeout(() => {
          if (toast && toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }, 4000);
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
