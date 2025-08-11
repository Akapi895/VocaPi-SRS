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
    const closeBtn = this.modal.querySelector('.vocab-modal-close');
    const cancelBtn = this.modal.querySelector('#vocab-cancel');
    
    closeBtn.addEventListener('click', () => this.hide());
    cancelBtn.addEventListener('click', () => this.hide());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide();
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.hide();
      }
    });
    
    const fetchBtn = this.modal.querySelector('#vocab-fetch-pronunciation');
    fetchBtn.addEventListener('click', () => this.fetchPronunciation());

    const playBtn = this.modal.querySelector('#vocab-play-audio');
    playBtn.addEventListener('click', () => this.playAudio());
    
    const saveBtn = this.modal.querySelector('#vocab-save-word');
    saveBtn.addEventListener('click', () => this.saveWord());
    
    const meaningInput = this.modal.querySelector('#vocab-meaning');
    meaningInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.saveWord();
      }
    });
  },

  show(word) {
    if (!word || typeof word !== 'string') {
      console.warn('VocabAddModal.show() called with invalid word:', word);
      return;
    }
    
    this.currentWord = word;
    
    this.modal.querySelector('#vocab-word').value = word;
    this.modal.querySelector('#vocab-meaning').value = '';
    this.modal.querySelector('#vocab-example').value = '';
    this.modal.querySelector('#vocab-phonetic').value = '';
    this.modal.querySelector('#vocab-api-status').textContent = '';
    this.modal.querySelector('#vocab-audio-group').style.display = 'none';
    
    this.overlay.classList.add('show');
    setTimeout(() => {
      this.modal.querySelector('#vocab-meaning').focus();
    }, 150);
  },

  hide() {
    this.overlay.classList.remove('show');
    this.currentWord = '';
    if (window.VocabAPI?.AudioPlayer?.stop) {
      window.VocabAPI.AudioPlayer.stop();
    }
  },

  isVisible() {
    return this.overlay && this.overlay.classList.contains('show');
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
    
    fetchBtn.classList.add('loading');
    fetchBtn.disabled = true;
    statusDiv.textContent = 'Fetching pronunciation...';
    statusDiv.className = 'vocab-status-message vocab-status-loading';
    
    try {
      const wordData = await window.VocabAPI.DictionaryAPI.fetchWordData(this.currentWord);
      
      if (wordData.phonetic) {
        phoneticInput.value = wordData.phonetic;
      } else {
        phoneticInput.value = '';
        phoneticInput.placeholder = 'No phonetic found - you can enter manually';
        phoneticInput.readOnly = false;
      }
      
      audioGroup.style.display = 'block';
      audioGroup.dataset.audioUrl = wordData.audioUrl || '';
      
      const playBtn = this.modal.querySelector('#vocab-play-audio');
      if (wordData.audioUrl) {
        playBtn.innerHTML = '🔊 Play Audio';
        this.showStatus('Pronunciation fetched successfully!', 'success');
      } else {
        playBtn.innerHTML = '🗣️ Play (TTS)';
        this.showStatus('Pronunciation fetched successfully!', 'success');
      }
      
      // Auto-play audio without showing status messages
      setTimeout(() => this.playAudio(), 500);
      
    } catch (error) {
      console.error('Fetch pronunciation error:', error);
      phoneticInput.value = '';
      phoneticInput.placeholder = 'Enter phonetic manually (API failed)';
      phoneticInput.readOnly = false;
      
      audioGroup.style.display = 'block';
      audioGroup.dataset.audioUrl = '';
      const playBtn = this.modal.querySelector('#vocab-play-audio');
      playBtn.innerHTML = '🗣️ Play (TTS)';
      
      this.showStatus(`Failed to fetch pronunciation: ${error.message}`, 'error');
    } finally {
      fetchBtn.classList.remove('loading');
      fetchBtn.disabled = false;
    }
  },

  async playAudio() {
    const audioGroup = this.modal.querySelector('#vocab-audio-group');
    const playBtn = this.modal.querySelector('#vocab-play-audio');
    const audioStatus = this.modal.querySelector('#vocab-audio-status');
    const saveBtn = this.modal.querySelector('#vocab-save-word');
    
    const audioUrl = audioGroup.dataset.audioUrl;
    const word = this.currentWord;
    
    if (!audioUrl && !word) {
      return;
    }
    
    playBtn.classList.add('loading');
    playBtn.disabled = true;
    saveBtn.disabled = true; // Disable save button during audio playback
    audioStatus.textContent = ''; // Clear any previous status
    
    try {
      const result = await window.VocabAPI.AudioPlayer.playAudio(word, audioUrl);
      // Don't show any success messages
    } catch (error) {
      console.error('Audio play error:', error);
      // Don't show error messages in UI
    } finally {
      playBtn.classList.remove('loading');
      playBtn.disabled = false;
      saveBtn.disabled = false; // Re-enable save button after audio playback
    }
  },

  async saveWord() {
    const meaningInput = this.modal.querySelector('#vocab-meaning');
    const exampleInput = this.modal.querySelector('#vocab-example');
    const phoneticInput = this.modal.querySelector('#vocab-phonetic');
    const audioGroup = this.modal.querySelector('#vocab-audio-group');
    const saveBtn = this.modal.querySelector('#vocab-save-word');
    const playBtn = this.modal.querySelector('#vocab-play-audio');
    
    // Check if audio is currently playing
    if (playBtn.disabled || playBtn.classList.contains('loading')) {
      return; // Don't save if audio is playing
    }
    
    const meaning = meaningInput.value.trim();
    
    if (!meaning) {
      this.showStatus('Please enter a meaning in Vietnamese', 'error');
      meaningInput.focus();
      return;
    }
    
    saveBtn.classList.add('loading');
    saveBtn.disabled = true;
    
    try {
      const wordData = {
        word: this.currentWord,
        meaning: meaning,
        example: exampleInput.value.trim(),
        phonetic: phoneticInput.value.trim(),
        audioUrl: audioGroup.dataset.audioUrl || ''
      };
      
      // Debug logging
      console.log('Saving word data:', wordData);
      
      await window.VocabUtils.VocabStorage.addWord(wordData);
      this.showStatus('Word saved successfully!', 'success');
      
      // Store currentWord before hiding modal (since hide() clears it)
      const savedWord = this.currentWord;
      console.log('Saved word for toast:', savedWord);
      
      setTimeout(() => {
        this.hide();
        this.showToast(`New word "${savedWord}" added to your dictionary!`);
      }, 800);
      
    } catch (error) {
      console.error('Save word error:', error);
      this.showStatus(`Failed to save word: ${error.message}`, 'error');
    } finally {
      saveBtn.classList.remove('loading');
      saveBtn.disabled = false;
    }
  },

  showStatus(message, type = 'info') {
    const statusDiv = this.modal.querySelector('#vocab-api-status');
    statusDiv.textContent = message;
    statusDiv.className = `vocab-status-message vocab-status-${type}`;
    
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'vocab-status-message';
      }, 3000);
    }
  },

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'vocab-toast vocab-toast-success';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('vocab-toast-show'), 100);
    setTimeout(() => {
      toast.classList.remove('vocab-toast-show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }
};

// Floating Add Button
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
    this.button.textContent = '+ Add to Dictionary';
    document.body.appendChild(this.button);

    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleAddWord();
    });
  },

  bindSelectionEvents() {
    document.addEventListener('mouseup', () => {
      setTimeout(() => this.handleSelection(), 10);
    });
    
    document.addEventListener('keyup', () => {
      setTimeout(() => this.handleSelection(), 10);
    });
    
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
    this.button.style.left = `${rect.left + window.scrollX}px`;
    this.button.style.top = `${rect.bottom + window.scrollY + 5}px`;
    this.button.classList.add('show');
  },

  hideButton() {
    this.button.classList.remove('show');
    this.currentSelection = null;
  },

  handleAddWord() {
    if (this.currentSelection) {
      VocabAddModal.show(this.currentSelection);
      this.hideButton();
      window.getSelection().removeAllRanges();
    }
  }
};

// Initialize
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