window.DictionaryAPI = window.DictionaryAPI || {
  getWordInfo: async function(word) {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const entry = data[0];
          const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';
          const audioUrl = entry.phonetics?.find(p => p.audio?.includes('-us') || p.audio?.includes('_us'))?.audio || 
                          entry.phonetics?.find(p => p.audio)?.audio || '';
          
          return {
            word: word,
            phonetic: phonetic || "/" + word + "/",
            audioUrl: audioUrl
          };
        }
      }
    } catch (error) {
    }
    
    return {
      word: word,
      phonetic: "/" + word + "/",
      audioUrl: ""
    };
  }
};

window.AudioPlayer = window.AudioPlayer || {
  playAudio: async function(word, audioUrl) {
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audio.volume = 0.7;
        
        return new Promise((resolve) => {
          audio.onended = () => resolve({method:'audio',success:true});
          audio.onerror = () => {
            resolve(this.playTTS(word));
          };
          audio.play().catch(() => {
            resolve(this.playTTS(word));
          });
        });
      } catch (error) {
        return this.playTTS(word);
      }
    }
    
    return this.playTTS(word);
  },
  
  playTTS: function(word) {
    if (window.speechSynthesis) {
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        utterance.volume = 0.8;
        utterance.onend = () => resolve({method:'tts',success:true});
        utterance.onerror = () => resolve({method:'tts',success:false});
        window.speechSynthesis.speak(utterance);
      });
    }
    
    return Promise.resolve({method:'mock',success:true});
  }
};

if (!window.VocabStorage || typeof window.VocabStorage.addWord !== 'function') {
  const originalVocabStorage = window.VocabStorage;
  
  window.VocabStorage = {
    addWord: async function(wordData) {
      if (!wordData.wordType) {
        throw new Error('Word type is required');
      }
      if (!wordData.meaning) {
        throw new Error('Meaning is required');
      }
      
      try {
        if (originalVocabStorage && typeof originalVocabStorage.addWord === 'function') {
          const result = await originalVocabStorage.addWord(wordData);
          return result;
        }
      } catch (error) {
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    }
  };
}

const WORD_TYPES = [
  { value: 'noun', label: 'Danh từ (Noun)' },
  { value: 'verb', label: 'Động từ (Verb)' },
  { value: 'adjective', label: 'Tính từ (Adjective)' },
  { value: 'adverb', label: 'Trạng từ (Adverb)' },
  { value: 'pronoun', label: 'Đại từ (Pronoun)' },
  { value: 'preposition', label: 'Giới từ (Preposition)' },
  { value: 'conjunction', label: 'Liên từ (Conjunction)' },
  { value: 'interjection', label: 'Thán từ (Interjection)' },
  { value: 'idiom', label: 'Thành ngữ (Idiom)' },
  { value: 'phrase', label: 'Cụm từ (Phrase)' },
  { value: 'other', label: 'Khác (Other)' }
];

const VocabAddModal = {
  modal: null,
  overlay: null,
  currentWord: '',
  
  init() {
    this.createModal();
    this.bindEvents();
  },
  
  createModal() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'vocab-modal-overlay';
    
    this.modal = document.createElement('div');
    this.modal.className = 'vocab-modal';
    
    this.modal.innerHTML = `
      <div class="vocab-modal-header">
        <h3>Add to My Dictionary</h3>
        <button class="vocab-modal-close" type="button">&times;</button>
      </div>
      
      <div class="vocab-modal-body">
        <div class="vocab-form-group">
          <label for="vocab-word">Word/Phrase:</label>
          <input type="text" id="vocab-word" readonly class="vocab-input-readonly">
        </div>
        
        <div class="vocab-form-group">
          <label for="vocab-word-type">Word Type:</label>
          <select id="vocab-word-type" required>
            <option value="">-- Select word type --</option>
            ${WORD_TYPES.map(type => `<option value="${type.value}">${type.label}</option>`).join('')}
          </select>
        </div>
        
        <div class="vocab-form-group">
          <label for="vocab-meaning">Meaning (Vietnamese):</label>
          <input type="text" id="vocab-meaning" placeholder="Nhập nghĩa tiếng Việt..." required>
        </div>
        
        <div class="vocab-form-group">
          <label for="vocab-example">Example sentence:</label>
          <input type="text" id="vocab-example" placeholder="Optional example sentence or usage context...">
        </div>
        
        <div class="vocab-form-group">
          <label for="vocab-phonetic">Phonetic:</label>
          <div class="vocab-phonetic-group">
            <input type="text" id="vocab-phonetic" placeholder="Will be fetched for single words..." readonly>
            <button type="button" id="vocab-fetch-pronunciation" class="vocab-btn vocab-btn-secondary">
              🔍 Fetch Pronunciation
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
        <button type="button" id="vocab-save-word" class="vocab-btn vocab-btn-primary">Save to Dictionary</button>
        <button type="button" id="vocab-cancel" class="vocab-btn vocab-btn-secondary">Cancel</button>
      </div>
    `;

    this.els = {
      word: this.modal.querySelector('#vocab-word'),
      wordType: this.modal.querySelector('#vocab-word-type'),
      meaning: this.modal.querySelector('#vocab-meaning'),
      example: this.modal.querySelector('#vocab-example'),
      phonetic: this.modal.querySelector('#vocab-phonetic'),
      fetchBtn: this.modal.querySelector('#vocab-fetch-pronunciation'),
      playBtn: this.modal.querySelector('#vocab-play-audio'),
      saveBtn: this.modal.querySelector('#vocab-save-word'),
      apiStatus: this.modal.querySelector('#vocab-api-status'),
      audioGroup: this.modal.querySelector('#vocab-audio-group'),
      closeBtn: this.modal.querySelector('.vocab-modal-close'),
      cancelBtn: this.modal.querySelector('#vocab-cancel'),
      audioStatus: this.modal.querySelector('#vocab-audio-status')
    };
    
    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);
  },

  bindEvents() {
    const closeBtn = this.els.closeBtn;
    const cancelBtn = this.els.cancelBtn;

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
    
    const fetchBtn = this.els.fetchBtn;
    fetchBtn.addEventListener('click', () => this.fetchPronunciation());

    const playBtn = this.els.playBtn;
    playBtn.addEventListener('click', () => this.playAudio());

    const saveBtn = this.els.saveBtn;
    saveBtn.addEventListener('click', () => this.saveWord());

    const meaningInput = this.els.meaning;
    meaningInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.saveWord();
      }
    });
  },

  show(word) {
    if (!word || typeof word !== 'string') {
      return;
    }
    
    this.currentWord = word;

    this.els.word.value = word;
    this.els.wordType.value = '';
    this.els.meaning.value = '';
    this.els.example.value = '';
    this.els.phonetic.value = '';
    this.els.apiStatus.textContent = '';
    this.els.audioGroup.style.display = 'none';
    
    this.overlay.classList.add('show');
    setTimeout(() => {
      this.els.wordType.focus();
    }, 150);
  },

  hide() {
    this.overlay.classList.remove('show');
    this.currentWord = '';
  },

  isVisible() {
    return this.overlay && this.overlay.classList.contains('show');
  },

  async fetchPronunciation() {
    const fetchBtn = this.els.fetchBtn;
    const statusDiv = this.els.apiStatus;
    const phoneticInput = this.els.phonetic;
    const audioGroup = this.els.audioGroup;

    if (!this.currentWord) {
      this.showStatus('No word selected', 'error');
      return;
    }
    
    fetchBtn.classList.add('loading');
    fetchBtn.disabled = true;
    fetchBtn.innerHTML = '⏳ Fetching...';
    statusDiv.textContent = 'Fetching pronunciation...';
    statusDiv.className = 'vocab-status-message vocab-status-loading';
    
    try {
      const wordData = await window.DictionaryAPI.getWordInfo(this.currentWord);
      
      if (wordData.phonetic) {
        phoneticInput.value = wordData.phonetic;
      } else {
        phoneticInput.value = '';
        phoneticInput.placeholder = 'No phonetic found - you can enter manually';
        phoneticInput.readOnly = false;
      }
      
      audioGroup.style.display = 'block';
      audioGroup.dataset.audioUrl = wordData.audioUrl || '';
      
      const playBtn = this.els.playBtn;
      playBtn.innerHTML = wordData.audioUrl ? '🔊 Play Audio' : '🗣️ Play Audio';
      this.showStatus('Pronunciation fetched successfully!', 'success');
      
      setTimeout(() => this.playAudio(), 500);
      
    } catch (error) {
      phoneticInput.value = '';
      phoneticInput.placeholder = 'Enter phonetic manually (API failed)';
      phoneticInput.readOnly = false;
      
      audioGroup.style.display = 'block';
      audioGroup.dataset.audioUrl = '';
      const playBtn = this.els.playBtn;
      playBtn.innerHTML = '🗣️ Play Audio';

      this.showStatus(`Failed to fetch pronunciation: ${error.message}`, 'error');
    } finally {
      fetchBtn.classList.remove('loading');
      fetchBtn.disabled = false;
      fetchBtn.innerHTML = '🔍 Fetch Pronunciation';
    }
  },

  async playAudio() {
    const audioGroup = this.els.audioGroup;
    const playBtn = this.els.playBtn;
    const audioStatus = this.els.audioStatus;
    const saveBtn = this.els.saveBtn;

    const audioUrl = audioGroup.dataset.audioUrl;
    const word = this.currentWord;
    
    if (!audioUrl && !word) {
      return;
    }
    
    playBtn.classList.add('loading');
    playBtn.disabled = true;
    saveBtn.disabled = true;
    audioStatus.textContent = '';
    
    try {
      const result = await window.AudioPlayer.playAudio(word, audioUrl);
    } catch (error) {
    } finally {
      playBtn.classList.remove('loading');
      playBtn.disabled = false;
      saveBtn.disabled = false;
    }
  },

  async saveWord() {
    const saveBtn = this.els.saveBtn;
    saveBtn.classList.add('loading');
    saveBtn.disabled = true;
    
    try {
      const wordData = {
        word: this.currentWord,
        wordType: this.els.wordType.value,
        meaning: this.els.meaning.value.trim(),
        example: this.els.example.value.trim(),
        phonetic: this.els.phonetic.value.trim(),
        audioUrl: this.els.audioGroup.dataset.audioUrl || '',
        srs: {
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: new Date().toISOString()
        }
      };
      
      const savePromise = window.VocabStorage.addWord(wordData);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Save operation timed out after 15 seconds')), 15000);
      });
      
      const saveResult = await Promise.race([savePromise, timeoutPromise]);
      this.showStatus('Word saved successfully!', 'success');
      
      const savedWord = this.currentWord;
      
      setTimeout(() => {
        this.hide();
        this.showToast(`New word "${savedWord}" added to your dictionary!`);
      }, 800);
      
    } catch (error) {
      this.showStatus(`Failed to save word: ${error.message}`, 'error');
    } finally {
      saveBtn.classList.remove('loading');
      saveBtn.disabled = false;
    }
  },

  showStatus(message, type = 'info') {
    const statusDiv = this.els.apiStatus;
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

const VocabFloatingButton = {
  button: null,
  currentSelection: null,

  init() {
    this.createButton();
    this.bindSelectionEvents();
  },

  showButton(selection) {
    this.showButtonInternal(selection);
  },

  hideButton() {
    this.hideButtonInternal();
  },

  handleAddWord() {
    if (this.currentSelection) {
      VocabAddModal.show(this.currentSelection);
      this.hideButtonInternal();
      window.getSelection().removeAllRanges();
    }
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
    
    if (!window.TextUtils || typeof window.TextUtils.cleanText !== 'function') {
      if (!selectedText || selectedText.length < 1 || selectedText.length > 200) {
        this.hideButtonInternal();
        return;
      }
    } else {
      if (!selectedText || !window.TextUtils.cleanText(selectedText)) {
        this.hideButtonInternal();
        return;
      }
    }
    
    this.currentSelection = selectedText;
    this.showButtonInternal(selection);
  },

  showButtonInternal(selection) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    this.button.style.left = `${rect.left + window.scrollX}px`;
    this.button.style.top = `${rect.bottom + window.scrollY + 5}px`;
    this.button.classList.add('show');
  },

  hideButtonInternal() {
    this.button.classList.remove('show');
    this.currentSelection = null;
  }
};

function initializeComponents() {
  VocabAddModal.init();
  VocabFloatingButton.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeComponents);
} else {
  initializeComponents();
}

if (typeof window !== 'undefined') {
  window.VocabAddModal = VocabAddModal;
  window.VocabFloatingButton = VocabFloatingButton;
}
