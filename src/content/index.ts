// Content script for VocaPi extension
import { VocabWord } from '@/types';

// Global variables
let selectedText = '';
let isModalOpen = false;
let wordHighlightingEnabled = true;
let isInitialized = false;

// Initialize content script
function init() {
  if (isInitialized) {
    return;
  }
  isInitialized = true;
  
  // Load word highlighting setting from storage
  loadWordHighlightingSetting();
  
  // Attach event listeners to all existing elements
  attachEventListenersToAllElements();
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Add floating button when text is selected
  createFloatingButton();
  
  // Set up observer for dynamic content changes
  setupDynamicContentObserver();
}

// Load word highlighting setting from storage
async function loadWordHighlightingSetting() {
  try {
    const result = await chrome.storage.local.get(['settings']);
    const settings = result.settings;
    // Use notifications as proxy for word highlighting (as in popup)
    wordHighlightingEnabled = settings?.notifications ?? true;
  } catch (error) {
    console.log('Failed to load word highlighting setting:', error);
    // Default to enabled
    wordHighlightingEnabled = true;
  }
}

// Attach event listeners to all existing elements on the page
function attachEventListenersToAllElements() {
  // Remove any existing listeners first to avoid duplicates
  document.removeEventListener('mouseup', handleTextSelection);
  document.removeEventListener('keyup', handleTextSelection);
  
  // Use event delegation on document level for better coverage
  document.addEventListener('mouseup', handleTextSelection, true);
  document.addEventListener('keyup', handleTextSelection, true);
  
  // Also listen to specific events that might trigger selection
  document.addEventListener('touchend', handleTextSelection, true);
  document.addEventListener('click', handleTextSelection, true);
  
  // Listen to selection changes globally
  document.addEventListener('selectionchange', handleTextSelection, true);
}

// Set up observer for dynamic content changes
function setupDynamicContentObserver() {
  // Use MutationObserver to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    // Since we're using event delegation, we don't need to attach listeners to new elements
    // Just ensure the floating button positioning works with new content
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Content changed, re-check selection if there's any
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection && selection.toString().trim() && wordHighlightingEnabled) {
            selectedText = selection.toString().trim();
            showFloatingButton();
          }
        }, 100);
      }
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Handle text selection
function handleTextSelection(event?: Event) {
  // Nếu click vào floating button hoặc modal, không xử lý selection
  if (event && event.target) {
    const target = event.target as Element;
    if (target.closest('#vocab-srs-floating-btn') || 
        target.closest('#vocab-srs-modal') || 
        target.id === 'vocab-srs-floating-btn' ||
        target.id === 'vocab-srs-modal') {
      return;
    }
  }
  
  // Nếu word highlighting bị tắt, ẩn nút và return
  if (!wordHighlightingEnabled) {
    hideFloatingButton();
    selectedText = '';
    return;
  }
  
  // Delay để đảm bảo selection đã hoàn thành
  setTimeout(() => {
    const selection = window.getSelection();
    const selectionText = selection ? selection.toString().trim() : '';
    
    if (selection && selectionText) {
      selectedText = selectionText;
      showFloatingButton();
    } else {
      // Chỉ hide button nếu không có modal mở
      if (!isModalOpen) {
        selectedText = '';
        hideFloatingButton();
      }
    }
  }, 10);
}

// Create floating button
function createFloatingButton() {
  const button = document.createElement('div');
  button.id = 'vocab-srs-floating-btn';
  button.innerHTML = `
    <div class="vocab-srs-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      <span>Add to Dictionary</span>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #vocab-srs-floating-btn {
      position: fixed;
      z-index: 999999;
      display: none;
      pointer-events: none;
    }
    
    .vocab-srs-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      pointer-events: all;
      transition: all 0.2s ease;
      border: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      white-space: nowrap;
    }
    
    .vocab-srs-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    
    .vocab-srs-btn:active {
      transform: translateY(0);
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(button);
  
  // Add click handler
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showAddModal(selectedText);
  });
}

// Show floating button
function showFloatingButton() {
  // Kiểm tra trạng thái wordHighlightingEnabled trước khi hiển thị
  if (!wordHighlightingEnabled) {
    return;
  }
  
  const button = document.getElementById('vocab-srs-floating-btn');
  
  if (button) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Đảm bảo rect có giá trị hợp lệ
      if (rect.width > 0 || rect.height > 0) {
        // Reset all hiding styles
        button.style.display = 'block';
        button.style.visibility = 'visible';
        button.style.opacity = '1';
        button.style.pointerEvents = 'all';
        
        // Tính toán vị trí với scroll offset
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        const left = rect.left + scrollX;
        const top = rect.bottom + scrollY + 5;
        
        button.style.left = `${left}px`;
        button.style.top = `${top}px`;
        button.style.position = 'absolute'; // Đảm bảo position absolute
        
        // Đảm bảo button không bị che khuất bởi viewport
        setTimeout(() => {
          const buttonRect = button.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          // Adjust horizontal position if button goes outside viewport
          if (buttonRect.right > viewportWidth) {
            button.style.left = `${viewportWidth - buttonRect.width - 10 + scrollX}px`;
          }
          
          // Adjust vertical position if button goes outside viewport
          if (buttonRect.bottom > viewportHeight) {
            button.style.top = `${rect.top + scrollY - buttonRect.height - 5}px`;
          }
        }, 0);
      }
    }
  }
}

// Hide floating button
function hideFloatingButton() {
  const button = document.getElementById('vocab-srs-floating-btn');
  if (button) {
    button.style.display = 'none';
    button.style.visibility = 'hidden';
    button.style.opacity = '0';
    button.style.pointerEvents = 'none';
  }
}

// Fetch word data from API
async function fetchWordData(word: string): Promise<{ phonetic: string; pronunUrl: string }> {
  const fallbackData = {
    phonetic: generateSimplePhonetic(word),
    pronunUrl: ''
  };

  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { 
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    clearTimeout(timeoutId);
    
    if (response.ok && response.status === 200) {
      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        
        // Extract phonetic with multiple fallbacks
        let phonetic = '';
        if (entry.phonetic) {
          phonetic = entry.phonetic;
        } else if (entry.phonetics && Array.isArray(entry.phonetics)) {
          // Try to find phonetic with text
          for (const phoneticEntry of entry.phonetics) {
            if (phoneticEntry.text && phoneticEntry.text.trim()) {
              phonetic = phoneticEntry.text;
              break;
            }
          }
        }
        
        // Extract audio URL with multiple fallbacks
        let audioUrl = '';
        if (entry.phonetics && Array.isArray(entry.phonetics)) {
          for (const phoneticEntry of entry.phonetics) {
            if (phoneticEntry.audio && phoneticEntry.audio.trim()) {
              audioUrl = phoneticEntry.audio;
              break;
            }
          }
        }
        
        return {
          phonetic: phonetic || fallbackData.phonetic,
          pronunUrl: audioUrl || ''
        };
      }
    }
    
    console.log(`Dictionary API returned status ${response.status} for word: ${word}`);
    return fallbackData;
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.log('Dictionary API request timed out for word:', word);
      } else {
        console.log('Dictionary API error for word:', word, error.message);
      }
    } else {
      console.log('Unknown error fetching word data for:', word);
    }
    
    // Always return fallback data instead of throwing
    return fallbackData;
  }
}

// Simple phonetic generation fallback
function generateSimplePhonetic(word: string): string {
  // This is a very basic phonetic approximation
  // In a real app, you'd want a proper phonetic library
  return `/${word.toLowerCase()}/`;
}

// Play audio for a word with given audio URL
function playWordAudio(word: string, pronunUrl: string): void {
  // Try to play from pronunUrl first
  if (pronunUrl && pronunUrl.trim() !== '') {
    const audio = new Audio(pronunUrl);
    audio.play().catch(() => {
      // Fallback to TTS if audio URL fails
      playTextToSpeech(word);
    });
  } else {
    // Use TTS if no audio URL available
    playTextToSpeech(word);
  }
}

// Play text-to-speech for a word
function playTextToSpeech(word: string): void {
  if ('speechSynthesis' in window) {
    try {
      // Cancel any existing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.volume = 0.8;
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.log('Text-to-speech failed:', error);
    }
  }
}

// Show add modal
function showAddModal(word?: string) {
  if (isModalOpen) return;
  
  isModalOpen = true;
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'vocab-srs-modal';
  modal.innerHTML = `
    <div class="vocab-srs-modal-overlay">
      <div class="vocab-srs-modal-content">
        <div class="vocab-srs-modal-header">
          <h3>Add to Dictionary</h3>
          <button class="vocab-srs-modal-close">&times;</button>
        </div>
        <div class="vocab-srs-modal-body">
          <div class="vocab-srs-form-group">
            <label>Word *</label>
            <input type="text" id="vocab-word" value="${word || ''}" placeholder="Enter word" required>
          </div>
          <div class="vocab-srs-form-group">
            <label>Meaning *</label>
            <input type="text" id="vocab-meaning" placeholder="Enter meaning" required>
          </div>
          <div class="vocab-srs-form-group">
            <label>Phonetic *</label>
            <div class="vocab-srs-phonetic-group">
              <input type="text" id="vocab-phonetic" placeholder="Loading phonetic..." readonly>
              <button type="button" class="vocab-srs-play-audio" title="Play pronunciation">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5,6 9,2 9,2 15,6 15,11 19,11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="vocab-srs-form-group">
            <label>Word Type *</label>
            <select id="vocab-word-type" required>
              <option value="">Select word type</option>
              <option value="noun">Noun</option>
              <option value="verb">Verb</option>
              <option value="adjective">Adjective</option>
              <option value="adverb">Adverb</option>
              <option value="idiom">Idiom</option>
              <option value="phrase">Phrase</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="vocab-srs-form-group">
            <label>Example (optional)</label>
            <input type="text" id="vocab-example" placeholder="Enter example sentence">
          </div>
        </div>
        <div class="vocab-srs-modal-footer">
          <button class="vocab-srs-btn-cancel">Cancel</button>
          <button class="vocab-srs-btn-save">Save to Dictionary</button>
        </div>
      </div>
    </div>
  `;
  
  // Add modal styles
  const style = document.createElement('style');
  style.textContent = `
    #vocab-srs-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10001;
    }
    
    .vocab-srs-modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .vocab-srs-modal-content {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 400px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }
    
    .vocab-srs-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .vocab-srs-modal-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .vocab-srs-modal-close {
      background: none;
      border: none;
      font-size: 24px;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .vocab-srs-modal-close:hover {
      color: #374151;
    }
    
    .vocab-srs-modal-body {
      padding: 24px;
    }
    
    .vocab-srs-form-group {
      margin-bottom: 20px;
    }
    
    .vocab-srs-form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #374151;
      font-size: 14px;
    }
    
    .vocab-srs-form-group input,
    .vocab-srs-form-group select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
      background: white;
    }
    
    .vocab-srs-form-group input:focus,
    .vocab-srs-form-group select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .vocab-srs-form-group input[readonly] {
      background: #f9fafb;
      color: #6b7280;
    }
    
    .vocab-srs-phonetic-group {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    
    .vocab-srs-phonetic-group input {
      flex: 1;
    }
    
    .vocab-srs-play-audio {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      min-width: 36px;
      height: 36px;
    }
    
    .vocab-srs-play-audio:hover {
      background: #e5e7eb;
      border-color: #9ca3af;
    }
    
    .vocab-srs-play-audio:active {
      background: #d1d5db;
    }
    
    .vocab-srs-play-audio:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .vocab-srs-play-audio svg {
      color: #6b7280;
    }
    
    .vocab-srs-modal-footer {
      display: flex;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
    }
    
    .vocab-srs-btn-cancel,
    .vocab-srs-btn-save {
      flex: 1;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .vocab-srs-btn-cancel {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    
    .vocab-srs-btn-cancel:hover {
      background: #e5e7eb;
    }
    
    .vocab-srs-btn-save {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
    }
    
    .vocab-srs-btn-save:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    
    .vocab-srs-btn-save:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(modal);
  
  // Add event listeners
  const closeBtn = modal.querySelector('.vocab-srs-modal-close');
  const cancelBtn = modal.querySelector('.vocab-srs-btn-cancel');
  const saveBtn = modal.querySelector('.vocab-srs-btn-save');
  const playAudioBtn = modal.querySelector('.vocab-srs-play-audio');
  
  const closeModal = () => {
    document.body.removeChild(modal);
    document.head.removeChild(style);
    isModalOpen = false;
  };
  
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  
  // Add play audio functionality
  playAudioBtn?.addEventListener('click', () => {
    if (word) {
      playWordAudio(word, modal.dataset.pronunUrl || '');
    }
  });
  
  saveBtn?.addEventListener('click', async () => {
    const wordInput = modal.querySelector('#vocab-word') as HTMLInputElement;
    const meaningInput = modal.querySelector('#vocab-meaning') as HTMLInputElement;
    const exampleInput = modal.querySelector('#vocab-example') as HTMLInputElement;
    const phoneticInput = modal.querySelector('#vocab-phonetic') as HTMLInputElement;
    const wordTypeInput = modal.querySelector('#vocab-word-type') as HTMLSelectElement;
    const saveBtnElement = saveBtn as HTMLButtonElement;
    
    const word = wordInput?.value.trim();
    const meaning = meaningInput?.value.trim();
    let phonetic = phoneticInput?.value.trim();
    const wordType = wordTypeInput?.value as VocabWord['wordType'];
    
    // Basic validation
    if (!word || !meaning || !wordType) {
      alert('Please fill in the required fields: Word, Meaning, and Word Type');
      return;
    }
    
    // Use fallback phonetic if none provided or still loading
    if (!phonetic || phonetic === 'Loading...' || phonetic === 'Fetching phonetic data...') {
      phonetic = generateSimplePhonetic(word);
    }
    
    // Get the pronunUrl from the fetched data
    const pronunUrl = modal.dataset.pronunUrl || '';
    
    const newWord: VocabWord = {
      id: `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      word,
      meaning,
      example: exampleInput?.value.trim() || undefined,
      phonetic,
      pronunUrl,
      wordType,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
      nextReview: Date.now(),
      quality: 0,
      totalReviews: 0,
      correctReviews: 0
    };
    
    try {
      // Disable save button to prevent double submission
      saveBtnElement.disabled = true;
      saveBtnElement.textContent = 'Saving...';
      
      // Save to storage
      const result = await chrome.storage.local.get(['vocabWords']);
      const existingWords = result.vocabWords || [];
      
      // Check if word with same meaning already exists
      const existingWord = existingWords.find((w: VocabWord) => 
        w.word.toLowerCase() === word.toLowerCase() && 
        w.meaning.toLowerCase() === meaning.toLowerCase()
      );
      
      if (existingWord) {
        alert(`The word "${word}" with the meaning "${meaning}" already exists in your dictionary!\n\nNote: You can add the same word with different meanings.`);
        saveBtnElement.disabled = false;
        saveBtnElement.textContent = 'Save to Dictionary';
        return;
      }
      
      // Show existing meanings if word exists with different meanings
      const existingMeanings = existingWords.filter((w: VocabWord) => 
        w.word.toLowerCase() === word.toLowerCase()
      );
      
      if (existingMeanings.length > 0) {
        const meaningsList = existingMeanings.map((w: VocabWord) => `• ${w.meaning}`).join('\n');
        const confirmMessage = `The word "${word}" already exists with these meanings:\n\n${meaningsList}\n\nDo you want to add this word with a new meaning: "${meaning}"?`;
        
        if (!confirm(confirmMessage)) {
          saveBtnElement.disabled = false;
          saveBtnElement.textContent = 'Save to Dictionary';
          return;
        }
      }
      
      existingWords.push(newWord);
      await chrome.storage.local.set({ vocabWords: existingWords });
      
      // Show success message
      alert('Word added to dictionary successfully!');
      closeModal();
      
      // Hide floating button
      hideFloatingButton();
      
    } catch (error) {
      console.error('Failed to save word:', error);
      alert('Failed to save word. Please try again.');
      
      // Re-enable save button
      saveBtnElement.disabled = false;
      saveBtnElement.textContent = 'Save to Dictionary';
    }
  });
  
  // Close on overlay click
  modal.querySelector('.vocab-srs-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  });
  
  // Auto-fetch word data if word is provided
  if (word) {
    const phoneticInput = modal.querySelector('#vocab-phonetic') as HTMLInputElement;
    const saveBtn = modal.querySelector('.vocab-srs-btn-save') as HTMLButtonElement;
    const playAudioBtn = modal.querySelector('.vocab-srs-play-audio') as HTMLButtonElement;
    
    // Set initial loading state
    phoneticInput.value = 'Loading...';
    phoneticInput.placeholder = 'Fetching phonetic data...';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Loading...';
    playAudioBtn.disabled = true;
    
    // Fetch word data with better error handling
    fetchWordData(word)
      .then(({ phonetic, pronunUrl }) => {
        // Update UI with fetched data
        phoneticInput.value = phonetic || generateSimplePhonetic(word);
        phoneticInput.placeholder = phonetic || 'No phonetic available';
        
        // Store pronunUrl in modal dataset for later use
        modal.dataset.pronunUrl = pronunUrl || '';
        
        // Re-enable save button and play button
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save to Dictionary';
        playAudioBtn.disabled = false;
        
        // Auto-play pronunciation if available
        playWordAudio(word, pronunUrl);
      })
      .catch((error) => {
        console.error('Failed to fetch word data:', error);
        
        // Set fallback data
        const fallbackPhonetic = generateSimplePhonetic(word);
        phoneticInput.value = fallbackPhonetic;
        phoneticInput.placeholder = 'Fallback phonetic';
        
        // Store empty pronunUrl in modal dataset
        modal.dataset.pronunUrl = '';
        
        // Re-enable save button and play button
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save to Dictionary';
        playAudioBtn.disabled = false;
        
        // Use TTS as fallback
        playTextToSpeech(word);
      });
  }
  
  // Focus on meaning input
  setTimeout(() => {
    const meaningInput = modal.querySelector('#vocab-meaning') as HTMLInputElement;
    meaningInput?.focus();
  }, 100);
}

// Handle messages from popup
function handleMessage(message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
  switch (message.type) {
    case 'GET_SELECTED_TEXT':
      sendResponse({ text: selectedText });
      break;
      
    case 'SHOW_ADD_MODAL':
      showAddModal(message.data?.word);
      sendResponse({ success: true });
      break;
      
    case 'TOGGLE_WORD_HIGHLIGHTING':
      wordHighlightingEnabled = message.data?.enabled ?? true;
      if (!wordHighlightingEnabled) {
        hideFloatingButton();
        // Clear any existing selection
        if (window.getSelection) {
          window.getSelection()?.removeAllRanges();
        }
        // Clear selected text to prevent showing button again
        selectedText = '';
      }
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
}

// Initialize when DOM is ready
function initializeContentScript() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

// Also initialize on window load to catch any late-loading content
window.addEventListener('load', () => {
  if (!isInitialized) {
    init();
  }
});

// Initialize immediately
initializeContentScript();
