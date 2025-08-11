// Add Word Modal UI Component
const VocabAddModal = {
  modal: null,
  overlay: null,
  currentWord: '',
  
  init() {
    this.createModal();
    this.bindEvents();
  },
  
  createModal() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'vocab-modal-overlay';
    this.overlay.style.display = 'none';
    
    // Create modal container
    this.modal = document.createElement('div');
    this.modal.className = 'vocab-modal';
    
    this.modal.innerHTML = `
      <div class="vocab-modal-header">
        <h3>Add to My Dictionary</h3>
        <button class="vocab-modal-close" type="button">&times;</button>
      </div>
      
      <div class="vocab-modal-body">
        <div class="vocab-form-group">
          <label for="vocab-word">Word:</label>
          <input type="text" id="vocab-word" readonly class="vocab-input-readonly">
        </div>
        
        <div class="vocab-form-group">
          <label for="vocab-meaning">Meaning (Vietnamese): *</label>
          <input type="text" id="vocab-meaning" placeholder="Nhập nghĩa tiếng Việt..." required>
        </div>
        
        <div class="vocab-form-group">
          <label for="vocab-example">Example sentence:</label>
          <input type="text" id="vocab-example" placeholder="Optional example sentence...">
        </div>
        
        <div class="vocab-form-group">
          <label for="vocab-phonetic">Phonetic:</label>
          <div class="vocab-phonetic-group">
            <input type="text" id="vocab-phonetic" placeholder="Will be fetched automatically..." readonly>
            <button type="button" id="vocab-fetch-pronunciation" class="vocab-btn vocab-btn-secondary">
              Fetch Pronunciation
            </button>
          </div>
        </div>
        
        <div class="vocab-form-group" id="vocab-audio-group" style="display: none;">
          <label>Audio Preview:</label>
          <div class="vocab-audio-controls">
            <button type="button" id="vocab-play-audio" class="vocab-btn vocab-btn-audio">
              ▶ Play Audio
            </button>
            <span id="vocab-audio-status"></span>
          </div>
        </div>
        
        <div id="vocab-api-status" class="vocab-status-message"></div>
      </div>
      
      <div class="vocab-modal-footer">
        <button type="button" id="vocab-save-word" class="vocab-btn vocab-btn-primary">Save Word</button>
        <button type="button" id="vocab-cancel" class="vocab-btn vocab-btn-secondary">Cancel</button>
      </div>
    `;
    
    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);
  },
  
  bindEvents() {
    // Close modal events
    const closeBtn = this.modal.querySelector('.vocab-modal-close');
    const cancelBtn = this.modal.querySelector('#vocab-cancel');
    
    closeBtn.addEventListener('click', () => this.hide());
    cancelBtn.addEventListener('click', () => this.hide());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide();
    });
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.hide();
      }
    });
    
    // Fetch pronunciation button
    const fetchBtn = this.modal.querySelector('#vocab-fetch-pronunciation');
    fetchBtn.addEventListener('click', () => this.fetchPronunciation());
    
    // Play audio button
    const playBtn = this.modal.querySelector('#vocab-play-audio');
    playBtn.addEventListener('click', () => this.playAudio());
    
    // Save word button
    const saveBtn = this.modal.querySelector('#vocab-save-word');
    saveBtn.addEventListener('click', () => this.saveWord());
    
    // Enter key to save (when meaning field is focused)
    const meaningInput = this.modal.querySelector('#vocab-meaning');
    meaningInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.saveWord();
      }
    });
  },
  
  show(word) {
    this.currentWord = word;
    
    // Reset form
    this.modal.querySelector('#vocab-word').value = word;
    this.modal.querySelector('#vocab-meaning').value = '';
    this.modal.querySelector('#vocab-example').value = '';
    this.modal.querySelector('#vocab-phonetic').value = '';
    this.modal.querySelector('#vocab-api-status').textContent = '';
    this.modal.querySelector('#vocab-audio-group').style.display = 'none';
    
    // Show modal
    this.overlay.style.display = 'flex';
    
    // Focus meaning input
    setTimeout(() => {
      this.modal.querySelector('#vocab-meaning').focus();
    }, 100);
  },
  
  hide() {
    this.overlay.style.display = 'none';
    this.currentWord = '';
    window.VocabAPI.AudioPlayer.stop();
  },
  
  isVisible() {
    return this.overlay && this.overlay.style.display === 'flex';
  },
  
  async fetchPronunciation() {
    const fetchBtn = this.modal.querySelector('#vocab-fetch-pronunciation');
    const statusDiv = this.modal.querySelector('#vocab-api-status');
    const phoneticInput = this.modal.querySelector('#vocab-phonetic');
    const audioGroup = this.modal.querySelector('#vocab-audio-group');
    
    if (!this.currentWord) {
      this.showStatus('No word selected', 'error');
      return;
    }
    
    // Update UI for loading state
    fetchBtn.textContent = 'Fetching...';
    fetchBtn.disabled = true;
    statusDiv.textContent = 'Fetching pronunciation...';
    statusDiv.className = 'vocab-status-message vocab-status-loading';
    
    try {
      const wordData = await window.VocabAPI.DictionaryAPI.fetchWordData(this.currentWord);
      
      // Update phonetic field
      if (wordData.phonetic) {
        phoneticInput.value = wordData.phonetic;
      } else {
        phoneticInput.value = '';
        phoneticInput.placeholder = 'No phonetic found - you can enter manually';
        phoneticInput.readOnly = false;
      }
      
      // Always show audio controls (we have TTS fallback)
      audioGroup.style.display = 'block';
      audioGroup.dataset.audioUrl = wordData.audioUrl || '';
      
      // Update button text based on audio availability
      const playBtn = this.modal.querySelector('#vocab-play-audio');
      if (wordData.audioUrl) {
        playBtn.innerHTML = '<span class="btn-icon">🔊</span> Play Audio';
        this.showStatus('Pronunciation fetched successfully!', 'success');
      } else {
        playBtn.innerHTML = '<span class="btn-icon">🗣️</span> Play (TTS)';
        this.showStatus('Pronunciation fetched (will use text-to-speech)', 'warning');
      }
      
      // Auto-play audio after successful fetch
      setTimeout(() => {
        this.playAudio();
      }, 500); // Small delay to let UI update
      
    } catch (error) {
      console.error('Fetch pronunciation error:', error);
      phoneticInput.value = '';
      phoneticInput.placeholder = 'Enter phonetic manually (API failed)';
      phoneticInput.readOnly = false;
      
      // Still show audio controls for TTS fallback
      audioGroup.style.display = 'block';
      audioGroup.dataset.audioUrl = '';
      const playBtn = this.modal.querySelector('#vocab-play-audio');
      playBtn.innerHTML = '<span class="btn-icon">🗣️</span> Play (TTS)';
      
      this.showStatus(`Failed to fetch pronunciation: ${error.message}`, 'error');
    } finally {
      fetchBtn.textContent = 'Fetch Pronunciation';
      fetchBtn.disabled = false;
    }
  },
  
  async playAudio() {
    const audioGroup = this.modal.querySelector('#vocab-audio-group');
    const playBtn = this.modal.querySelector('#vocab-play-audio');
    const audioStatus = this.modal.querySelector('#vocab-audio-status');
    
    const audioUrl = audioGroup.dataset.audioUrl;
    const word = this.currentWord;
    
    if (!audioUrl && !word) {
      audioStatus.textContent = 'No audio or word available';
      return;
    }
    
    playBtn.textContent = '⏸ Playing...';
    playBtn.disabled = true;
    audioStatus.textContent = audioUrl ? 'Playing audio...' : 'Playing with text-to-speech...';
    
    try {
      const result = await window.VocabAPI.AudioPlayer.playAudio(word, audioUrl);
      
      // Show appropriate success message
      if (result.method === 'audio') {
        audioStatus.textContent = 'Audio played successfully';
      } else if (result.method === 'tts') {
        audioStatus.textContent = 'Played with text-to-speech';
      }
      
    } catch (error) {
      console.error('Audio play error:', error);
      audioStatus.textContent = 'Audio playback failed';
    } finally {
      playBtn.textContent = '▶ Play Audio';
      playBtn.disabled = false;
    }
  },
  
  async saveWord() {
    const meaningInput = this.modal.querySelector('#vocab-meaning');
    const exampleInput = this.modal.querySelector('#vocab-example');
    const phoneticInput = this.modal.querySelector('#vocab-phonetic');
    const audioGroup = this.modal.querySelector('#vocab-audio-group');
    const saveBtn = this.modal.querySelector('#vocab-save-word');
    
    const meaning = meaningInput.value.trim();
    
    // Validation
    if (!meaning) {
      this.showStatus('Please enter a meaning in Vietnamese', 'error');
      meaningInput.focus();
      return;
    }
    
    // Update save button state
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    try {
      const wordData = {
        word: this.currentWord,
        meaning: meaning,
        example: exampleInput.value.trim(),
        phonetic: phoneticInput.value.trim(),
        audioUrl: audioGroup.dataset.audioUrl || ''
      };
      
      await window.VocabUtils.VocabStorage.addWord(wordData);
      
      this.showStatus('Word saved successfully!', 'success');
      
      // Close modal after short delay
      setTimeout(() => {
        this.hide();
        this.showToast(`New word added to your dictionary!`);
      }, 1000);
      
    } catch (error) {
      console.error('Save word error:', error);
      this.showStatus(`Failed to save word: ${error.message}`, 'error');
    } finally {
      saveBtn.textContent = 'Save Word';
      saveBtn.disabled = false;
    }
  },
  
  showStatus(message, type = 'info') {
    const statusDiv = this.modal.querySelector('#vocab-api-status');
    statusDiv.textContent = message;
    statusDiv.className = `vocab-status-message vocab-status-${type}`;
    
    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'vocab-status-message';
      }, 3000);
    }
  },
  
  showToast(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'vocab-toast vocab-toast-success';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('vocab-toast-show'), 100);
    
    // Hide and remove toast
    setTimeout(() => {
      toast.classList.remove('vocab-toast-show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }
};

// Floating Add Button for text selection
const VocabFloatingButton = {
  button: null,
  currentSelection: null,
  
  init() {
    this.createButton();
    this.bindSelectionEvents();
  },
  
  createButton() {
    this.button = document.createElement('button');
    this.button.className = 'vocab-floating-btn';
    this.button.innerHTML = '+ Add to Dictionary';
    this.button.style.display = 'none';
    
    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleAddWord();
    });
    
    document.body.appendChild(this.button);
  },
  
  bindSelectionEvents() {
    document.addEventListener('mouseup', () => {
      setTimeout(() => this.handleSelection(), 10);
    });
    
    document.addEventListener('keyup', () => {
      setTimeout(() => this.handleSelection(), 10);
    });
    
    // Hide button when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (e.target !== this.button) {
        this.hideButton();
      }
    });
  },
  
  handleSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (!selectedText || !window.VocabUtils.TextUtils.isValidSingleWord(selectedText)) {
      this.hideButton();
      return;
    }
    
    this.currentSelection = selectedText;
    this.showButton(selection);
  },
  
  showButton(selection) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Position button near the selection
    this.button.style.left = `${rect.left + window.scrollX}px`;
    this.button.style.top = `${rect.bottom + window.scrollY + 5}px`;
    this.button.style.display = 'block';
  },
  
  hideButton() {
    this.button.style.display = 'none';
    this.currentSelection = null;
  },
  
  handleAddWord() {
    if (this.currentSelection) {
      VocabAddModal.show(this.currentSelection);
      this.hideButton();
      
      // Clear selection
      window.getSelection().removeAllRanges();
    }
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    VocabAddModal.init();
    VocabFloatingButton.init();
  });
} else {
  VocabAddModal.init();
  VocabFloatingButton.init();
}

// Export for global access
if (typeof window !== 'undefined') {
  window.VocabSRS = {
    showAddModal: (word) => VocabAddModal.show(word),
    hideAddModal: () => VocabAddModal.hide(),
    showError: (message) => {
      // Create simple error toast
      const toast = document.createElement('div');
      toast.className = 'vocab-toast vocab-toast-error';
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(() => toast.classList.add('vocab-toast-show'), 100);
      setTimeout(() => {
        toast.classList.remove('vocab-toast-show');
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
    }
  };
}
