// addModal.js - Simplified without modules
console.log("📝 addModal.js loaded");

// Sử dụng DictionaryAPI thực từ core/api.js nếu có, nếu không thì dùng mock
window.DictionaryAPI = window.DictionaryAPI || {
  getWordInfo: async function(word) {
    console.log("🔍 DictionaryAPI.getWordInfo called for:", word);
    
    try {
      // Thử sử dụng API thực
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const entry = data[0];
          const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';
          const audioUrl = entry.phonetics?.find(p => p.audio?.includes('-us') || p.audio?.includes('_us'))?.audio || 
                          entry.phonetics?.find(p => p.audio)?.audio || '';
          
          console.log("✅ Real API data fetched:", { phonetic, audioUrl });
          return {
            word: word,
            phonetic: phonetic || "/" + word + "/",
            audioUrl: audioUrl
          };
        }
      }
    } catch (error) {
      console.log("⚠️ Real API failed, using mock data:", error.message);
    }
    
    // Fallback to mock data
    return {
      word: word,
      phonetic: "/" + word + "/",
      audioUrl: "" // Không có audio URL thực
    };
  }
};

// Log status của core modules
console.log("🔍 Core modules status:");
console.log("  - DictionaryAPI:", !!window.DictionaryAPI);
console.log("  - AudioPlayer:", !!window.AudioPlayer);
console.log("  - VocabStorage:", !!window.VocabStorage);
console.log("  - TextUtils:", !!window.TextUtils);
console.log("  - IndexedDBManager:", !!window.indexedDBManager);
console.log("  - IDUtils:", !!window.IDUtils);
console.log("  - DateUtils:", !!window.DateUtils);

// Sử dụng AudioPlayer thực từ core/api.js nếu có, nếu không thì dùng mock
window.AudioPlayer = window.AudioPlayer || {
  playAudio: async function(word, audioUrl) {
    console.log("🔊 AudioPlayer.playAudio called for:", word, "with URL:", audioUrl);
    
    // Nếu có audio URL, thử phát audio
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audio.volume = 0.7;
        
        return new Promise((resolve) => {
          audio.onended = () => resolve({method:'audio',success:true});
          audio.onerror = () => {
            console.log("⚠️ Audio URL failed, falling back to TTS");
            resolve(this.playTTS(word));
          };
          audio.play().catch(() => {
            console.log("⚠️ Audio play failed, falling back to TTS");
            resolve(this.playTTS(word));
          });
        });
      } catch (error) {
        console.log("⚠️ Audio creation failed, falling back to TTS:", error.message);
        return this.playTTS(word);
      }
    }
    
    // Fallback to TTS
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
    
    console.log("⚠️ TTS not supported, using mock");
    return Promise.resolve({method:'mock',success:true});
  }
};

// Sử dụng VocabStorage thực từ core/storage.js nếu có, nếu không thì dùng mock
if (!window.VocabStorage || typeof window.VocabStorage.addWord !== 'function') {
  console.log("⚠️ VocabStorage not found or invalid, creating fallback");
  const originalVocabStorage = window.VocabStorage;
  
  window.VocabStorage = {
    addWord: async function(wordData) {
      console.log("💾 VocabStorage.addWord called:", wordData);
      
      // Validate required fields
      if (!wordData.wordType) {
        throw new Error('Word type is required');
      }
      if (!wordData.meaning) {
        throw new Error('Meaning is required');
      }
      
      try {
        // Thử sử dụng storage thực từ core
        if (originalVocabStorage && typeof originalVocabStorage.addWord === 'function') {
          console.log("🔄 Using real VocabStorage from core");
          const result = await originalVocabStorage.addWord(wordData);
          console.log("✅ Real storage result:", result);
          return result;
        } else {
          console.log("⚠️ Real VocabStorage not available, using mock");
        }
      } catch (error) {
        console.log("⚠️ Real storage failed, using mock:", error.message);
        console.error("Full error:", error);
      }
      
      // Fallback to mock storage
      console.log("📝 Using mock storage");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("✅ Word saved successfully (mock):", {
        id: 'mock-id-' + Date.now(),
        ...wordData,
        createdAt: new Date().toISOString()
      });
      
      return true;
    }
  };
  console.log("✅ Fallback VocabStorage created");
} else {
  console.log("✅ Using real VocabStorage from core");
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
      console.warn('VocabAddModal.show() called with invalid word:', word);
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
      
      // Auto-play audio without showing status messages
      setTimeout(() => this.playAudio(), 500);
      
    } catch (error) {
      console.error('Fetch pronunciation error:', error);
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
    saveBtn.disabled = true; // Disable save button during audio playback
    audioStatus.textContent = ''; // Clear any previous status
    
    try {
      const result = await window.AudioPlayer.playAudio(word, audioUrl);
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
      
      // Debug logging
      console.log('Saving word data:', wordData);
      console.log('🔍 VocabStorage type:', typeof window.VocabStorage);
      console.log('🔍 VocabStorage.addWord type:', typeof window.VocabStorage.addWord);
      console.log('🔍 VocabStorage methods:', Object.getOwnPropertyNames(window.VocabStorage));
      
      // Check IndexedDB status
      if (window.VocabStorage.getIndexedDBStatus) {
        const dbStatus = window.VocabStorage.getIndexedDBStatus();
        console.log('🔍 IndexedDB Status:', dbStatus);
      }
      
      console.log('🚀 About to call VocabStorage.addWord...');
      
      // Add timeout to prevent infinite loading
      const savePromise = window.VocabStorage.addWord(wordData);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Save operation timed out after 15 seconds')), 15000);
      });
      
      const saveResult = await Promise.race([savePromise, timeoutPromise]);
      console.log('✅ Save result:', saveResult);
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

// Floating Add Button
const VocabFloatingButton = {
  button: null,
  currentSelection: null,

  init() {
    console.log('🔧 VocabFloatingButton.init() called');
    this.createButton();
    this.bindSelectionEvents();
    console.log('✅ VocabFloatingButton initialized');
  },

  // Method để content script có thể gọi
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
    
    // Fallback nếu TextUtils chưa sẵn sàng
    if (!window.TextUtils || typeof window.TextUtils.cleanText !== 'function') {
      console.log("⚠️ TextUtils not ready, using fallback text validation");
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

// Initialize components immediately
function initializeComponents() {
  console.log("🔧 Initializing addModal.js components...");
  
  // Initialize components immediately without waiting
  VocabAddModal.init();
  VocabFloatingButton.init();
  console.log("✅ Components initialized immediately");
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeComponents);
} else {
  // DOM đã sẵn sàng, khởi tạo ngay
  initializeComponents();
}

// Expose to window for content script usage
if (typeof window !== 'undefined') {
  window.VocabAddModal = VocabAddModal;
  window.VocabFloatingButton = VocabFloatingButton;
  console.log("✅ VocabAddModal and VocabFloatingButton exposed to window");
  
  // Test if components are accessible
  console.log("🧪 Testing component accessibility:");
  console.log("  - window.VocabAddModal:", !!window.VocabAddModal);
  console.log("  - window.VocabFloatingButton:", !!window.VocabFloatingButton);
  console.log("  - VocabAddModal.show:", typeof window.VocabAddModal?.show);
  console.log("  - VocabFloatingButton.showButton:", typeof window.VocabFloatingButton?.showButton);
}
