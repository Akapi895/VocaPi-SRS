// Options page JavaScript for Vocab SRS Extension
class VocabSRSOptions {
  constructor() {
    this.settings = {
      autoPlayAudio: false,
      showContextMenu: true,
      showFloatingButton: true,
      storageType: 'sync'
    };
    
    this.init();
  }
  
  async init() {
    console.log('Initializing Vocab SRS Options');
    await this.loadSettings();
    await this.loadStats();
    this.bindEvents();
  }
  
  async loadSettings() {
    try {
      const stored = await window.VocabUtils.StorageManager.get('vocabSRSSettings');
      if (stored) {
        this.settings = { ...this.settings, ...stored };
      }
      
      // Apply settings to UI
      document.getElementById('auto-play-audio').checked = this.settings.autoPlayAudio;
      document.getElementById('show-context-menu').checked = this.settings.showContextMenu;
      document.getElementById('show-floating-button').checked = this.settings.showFloatingButton;
      
      const storageRadios = document.querySelectorAll('input[name="storage-type"]');
      storageRadios.forEach(radio => {
        radio.checked = radio.value === this.settings.storageType;
      });
      
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  async saveSettings() {
    try {
      await window.VocabUtils.StorageManager.set('vocabSRSSettings', this.settings);
      this.showToast('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showToast('Failed to save settings', 'error');
    }
  }
  
  async loadStats() {
    try {
      const allWords = await window.VocabUtils.VocabStorage.getAllWords();
      const dueWords = await window.VocabUtils.VocabStorage.getDueWords();
      
      document.getElementById('total-words').textContent = allWords.length;
      document.getElementById('due-words').textContent = dueWords.length;
      
      // Calculate storage usage (approximate)
      const dataStr = JSON.stringify(allWords);
      const sizeKB = Math.round(new Blob([dataStr]).size / 1024);
      document.getElementById('storage-used').textContent = `${sizeKB} KB`;
      
    } catch (error) {
      console.error('Error loading stats:', error);
      this.showToast('Failed to load statistics', 'error');
    }
  }
  
  bindEvents() {
    // Settings change handlers
    document.getElementById('auto-play-audio').addEventListener('change', (e) => {
      this.settings.autoPlayAudio = e.target.checked;
      this.saveSettings();
    });
    
    document.getElementById('show-context-menu').addEventListener('change', (e) => {
      this.settings.showContextMenu = e.target.checked;
      this.saveSettings();
    });
    
    document.getElementById('show-floating-button').addEventListener('change', (e) => {
      this.settings.showFloatingButton = e.target.checked;
      this.saveSettings();
    });
    
    // Storage type radio buttons
    document.querySelectorAll('input[name="storage-type"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.settings.storageType = e.target.value;
          this.saveSettings();
        }
      });
    });
    
    // Data management buttons
    document.getElementById('export-data-btn').addEventListener('click', () => this.exportData());
    document.getElementById('import-data-btn').addEventListener('click', () => this.importData());
    document.getElementById('import-file').addEventListener('change', (e) => this.handleFileImport(e));
    document.getElementById('clear-data-btn').addEventListener('click', () => this.clearAllData());
  }
  
  async exportData() {
    try {
      const allWords = await window.VocabUtils.VocabStorage.getAllWords();
      const settings = await window.VocabUtils.StorageManager.get('vocabSRSSettings');
      
      const exportData = {
        version: '1.0.0',
        exportedAt: window.VocabUtils.DateUtils.now(),
        extensionName: 'Vocab SRS',
        words: allWords,
        settings: settings || {},
        stats: {
          totalWords: allWords.length,
          exportSize: JSON.stringify(allWords).length
        }
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vocab-srs-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      this.showToast('Data exported successfully', 'success');
      
    } catch (error) {
      console.error('Export error:', error);
      this.showToast('Failed to export data', 'error');
    }
  }
  
  importData() {
    document.getElementById('import-file').click();
  }
  
  async handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const statusDiv = document.getElementById('import-status');
    statusDiv.textContent = 'Processing file...';
    statusDiv.className = 'status-message status-loading';
    
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // Validate import data structure
      if (!importData.words || !Array.isArray(importData.words)) {
        throw new Error('Invalid file format: missing or invalid words array');
      }
      
      // Confirm import with user
      const wordCount = importData.words.length;
      const confirmMsg = `This will import ${wordCount} words. Existing words with the same spelling will be skipped. Continue?`;
      
      if (!confirm(confirmMsg)) {
        statusDiv.textContent = 'Import cancelled';
        statusDiv.className = 'status-message';
        return;
      }
      
      let importedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      const existingWords = await window.VocabUtils.VocabStorage.getAllWords();
      const existingWordsSet = new Set(existingWords.map(w => w.word.toLowerCase()));
      
      // Import words one by one
      for (const word of importData.words) {
        try {
          if (!word.word || !word.meaning) {
            errorCount++;
            continue;
          }
          
          if (existingWordsSet.has(word.word.toLowerCase())) {
            skippedCount++;
            continue;
          }
          
          // Ensure proper data structure
          const wordData = {
            word: word.word,
            meaning: word.meaning,
            example: word.example || '',
            phonetic: word.phonetic || '',
            audioUrl: word.audioUrl || ''
          };
          
          await window.VocabUtils.VocabStorage.addWord(wordData);
          importedCount++;
          
        } catch (error) {
          console.warn('Failed to import word:', word.word, error);
          errorCount++;
        }
      }
      
      // Import settings if available
      if (importData.settings) {
        try {
          this.settings = { ...this.settings, ...importData.settings };
          await this.saveSettings();
          await this.loadSettings(); // Refresh UI
        } catch (error) {
          console.warn('Failed to import settings:', error);
        }
      }
      
      // Show results
      const resultMsg = `Import complete!\n• ${importedCount} words imported\n• ${skippedCount} words skipped (duplicates)\n• ${errorCount} words failed (errors)`;
      
      statusDiv.innerHTML = resultMsg.replace(/\n/g, '<br>');
      statusDiv.className = 'status-message status-success';
      
      this.showToast('Import completed successfully', 'success');
      
      // Refresh stats
      await this.loadStats();
      
    } catch (error) {
      console.error('Import error:', error);
      statusDiv.textContent = `Import failed: ${error.message}`;
      statusDiv.className = 'status-message status-error';
      this.showToast('Import failed', 'error');
    } finally {
      // Reset file input
      event.target.value = '';
    }
  }
  
  async clearAllData() {
    const confirmMsg = 'This will permanently delete ALL your vocabulary data and settings. This action cannot be undone!\n\nType "DELETE" to confirm:';
    const userInput = prompt(confirmMsg);
    
    if (userInput !== 'DELETE') {
      this.showToast('Data clearing cancelled', 'info');
      return;
    }
    
    try {
      await window.VocabUtils.StorageManager.clear();
      
      // Reset settings to defaults
      this.settings = {
        autoPlayAudio: false,
        showContextMenu: true,
        showFloatingButton: true,
        storageType: 'sync'
      };
      
      await this.loadSettings();
      await this.loadStats();
      
      this.showToast('All data cleared successfully', 'success');
      
    } catch (error) {
      console.error('Clear data error:', error);
      this.showToast('Failed to clear data', 'error');
    }
  }
  
  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }[type] || 'ℹ️';
    
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    `;
    
    // Add close functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toast.classList.remove('toast-show');
      setTimeout(() => toastContainer.removeChild(toast), 300);
    });
    
    toastContainer.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => toast.classList.add('toast-show'), 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove('toast-show');
        setTimeout(() => {
          if (toast.parentNode) {
            toastContainer.removeChild(toast);
          }
        }, 300);
      }
    }, 3000);
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new VocabSRSOptions();
});
