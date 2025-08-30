// Content script entry point - simplified version for testing
console.log("🚀 Content script starting...");
console.log("🔍 Content script location:", window.location.href);
console.log("🔍 Content script timestamp:", new Date().toISOString());

// Global variables để lưu trữ elements
let vocabModalOverlay = null;
let vocabWordInput = null;
let vocabMeaningInput = null;
let vocabExampleInput = null;
let floatingButton = null;

// Global functions - sẽ được expose sau khi elements được tạo
let showVocabModalFunction = null;
let testModalFunction = null;

// Khởi tạo các component khi content script load
function initializeComponents() {
  try {
    console.log("🔧 Initializing VocabAddModal...");
    
    // Tạo modal và button trực tiếp
    createVocabAddModal();
    createVocabFloatingButton();
    
    // Expose functions sau khi elements được tạo
    exposeGlobalFunctions();
    
    console.log("✅ Content script components initialization completed");
    
  } catch (error) {
    console.error("❌ Failed to initialize components:", error);
  }
}

// Start initialization immediately
initializeComponents();

// Expose functions globally
function exposeGlobalFunctions() {
  console.log("🔧 Exposing global functions...");
  
  // Expose showVocabModal function
  showVocabModalFunction = function(word) {
    console.log("🎯 showVocabModal called with word:", word);
    if (vocabWordInput && vocabModalOverlay) {
      vocabWordInput.value = word;
      vocabModalOverlay.style.display = 'flex';
      if (vocabMeaningInput) vocabMeaningInput.focus();
      console.log("✅ Modal shown successfully");
    } else {
      console.error("❌ Modal elements not found");
    }
  };
  
  // Expose test function
  testModalFunction = function() {
    console.log("🧪 testModal called");
    if (typeof showVocabModalFunction === 'function') {
      showVocabModalFunction('test-word');
    } else {
      console.error("❌ showVocabModal function not available");
    }
  };
  
  // Assign to window
  window.showVocabModal = showVocabModalFunction;
  window.testModal = testModalFunction;
  
  console.log("✅ Global functions exposed:", {
    showVocabModal: typeof window.showVocabModal,
    testModal: typeof window.testModal
  });
  
}

// Tạo VocabAddModal
function createVocabAddModal() {
  console.log("🔧 Creating VocabAddModal...");
  
  try {
    // Tạo overlay
    vocabModalOverlay = document.createElement('div');
    vocabModalOverlay.className = 'vocab-modal-overlay';
    vocabModalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Tạo modal
    const modal = document.createElement('div');
    modal.className = 'vocab-modal';
    modal.style.cssText = `
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
      width: 90%;
      max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 24px;
    `;
    
    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #064e3b;">Add to My Dictionary</h3>
        <button class="vocab-modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 500;">Word/Phrase:</label>
        <input type="text" id="vocab-word" readonly style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 500;">Meaning (Vietnamese): *</label>
        <input type="text" id="vocab-meaning" placeholder="Nhập nghĩa tiếng Việt..." required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 500;">Example sentence:</label>
        <input type="text" id="vocab-example" placeholder="Optional example sentence..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="vocab-cancel" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
        <button id="vocab-save-word" style="padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer;">Save to Dictionary</button>
      </div>
    `;
    
    vocabModalOverlay.appendChild(modal);
    document.body.appendChild(vocabModalOverlay);
    
    // Get references to input elements
    vocabWordInput = modal.querySelector('#vocab-word');
    vocabMeaningInput = modal.querySelector('#vocab-meaning');
    vocabExampleInput = modal.querySelector('#vocab-example');
    
    // Bind events
    const closeBtn = modal.querySelector('.vocab-modal-close');
    const cancelBtn = modal.querySelector('#vocab-cancel');
    const saveBtn = modal.querySelector('#vocab-save-word');
    
    closeBtn.addEventListener('click', () => hideModal());
    cancelBtn.addEventListener('click', () => hideModal());
    vocabModalOverlay.addEventListener('click', (e) => {
      if (e.target === vocabModalOverlay) hideModal();
    });
    
    saveBtn.addEventListener('click', async () => {
      const word = vocabWordInput.value;
      const meaning = vocabMeaningInput.value;
      const example = vocabExampleInput.value;
      
      if (!meaning.trim()) {
        alert('Please enter a meaning');
        return;
      }
      
      try {
        // Save word to Chrome Storage
        const result = await saveWordToStorage(word, meaning, example);
        console.log('💾 Word saved successfully:', { word, meaning, example, result });
        
        if (result && result.message) {
          if (result.message.includes('New meaning')) {
            alert(`✅ ${result.message}: "${word}" với nghĩa "${meaning}"`);
          } else if (result.message.includes('Example updated')) {
            alert(`✅ ${result.message}: "${word}"`);
          } else {
            alert(`✅ ${result.message}: "${word}"`);
          }
        } else {
          alert(`✅ Word "${word}" saved successfully!`);
        }
        
        hideModal();
      } catch (error) {
        console.error('❌ Failed to save word:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        alert('Failed to save word. Please try again.');
      }
    });
    
    function hideModal() {
      vocabModalOverlay.style.display = 'none';
      vocabWordInput.value = '';
      vocabMeaningInput.value = '';
      vocabExampleInput.value = '';
    }
    
    console.log("✅ VocabAddModal created successfully");
  } catch (error) {
    console.error("❌ Error creating VocabAddModal:", error);
  }
}

// Save word to Chrome Storage via service worker
async function saveWordToStorage(word, meaning, example) {
  try {
    console.log('💾 Saving word to storage:', { word, meaning, example });
    
    // Send message to service worker to save word
    console.log('📡 Sending message to service worker...');
    const response = await chrome.runtime.sendMessage({
      action: 'saveWord',
      data: { word, meaning, example }
    });
    
    console.log('📡 Service worker response received:', response);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to save word');
    }
    
    console.log('✅ Word saved successfully:', response.word);
    return response.word;
    
  } catch (error) {
    console.error('❌ Storage error:', error);
    throw error;
  }
}

// Tạo VocabFloatingButton
function createVocabFloatingButton() {
  console.log("🔧 Creating VocabFloatingButton...");
  
  try {
    // Tạo button
    floatingButton = document.createElement('button');
    floatingButton.className = 'vocab-floating-btn';
    floatingButton.textContent = '+ Add to Dictionary';
    floatingButton.style.cssText = `
      position: fixed;
      background: #059669;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    document.body.appendChild(floatingButton);
    
    // Bind selection events
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);
    document.addEventListener('click', (e) => {
      if (e.target !== floatingButton) {
        hideButton();
      }
    });
    
    function handleSelection() {
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        console.log("🔍 Selection detected:", selectedText);
        
        if (!selectedText || selectedText.length < 2 || selectedText.length > 200) {
          hideButton();
          return;
        }
        
        // Check if text contains letters
        if (!/[a-zA-Z]/.test(selectedText)) {
          hideButton();
          return;
        }
        
        showButton(selection, selectedText);
      }, 10);
    }
    
    function showButton(selection, selectedText) {
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Calculate position
        const left = rect.left + window.scrollX;
        const top = rect.bottom + window.scrollY + 5;
        
        floatingButton.style.left = `${left}px`;
        floatingButton.style.top = `${top}px`;
        floatingButton.style.display = 'block';
        
        // Store current selection
        floatingButton.dataset.selectedText = selectedText;
        
        console.log("✅ Button shown at:", { left, top, text: selectedText });
      } catch (error) {
        console.error("❌ Error showing button:", error);
      }
    }
    
    function hideButton() {
      floatingButton.style.display = 'none';
      delete floatingButton.dataset.selectedText;
    }
    
    // Bind click event
    floatingButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const selectedText = floatingButton.dataset.selectedText;
      console.log("🔘 Button clicked with text:", selectedText);
      
      if (selectedText && window.showVocabModal) {
        window.showVocabModal(selectedText);
        hideButton();
        window.getSelection().removeAllRanges();
      } else {
        console.error("❌ Cannot show modal:", { selectedText, showVocabModal: typeof window.showVocabModal });
      }
    });
    
    console.log("✅ VocabFloatingButton created successfully");
  } catch (error) {
    console.error("❌ Error creating VocabFloatingButton:", error);
  }
}

// Add a test button to the page for debugging
setTimeout(() => {
  try {
    const testBtn = document.createElement('button');
    testBtn.textContent = '🧪 Test VocabSRS';
    testBtn.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 10001;
      padding: 8px 16px;
      background: #ff6b6b;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: Arial, sans-serif;
    `;
    
    testBtn.addEventListener('click', () => {
      console.log("🧪 Test button clicked");
      if (window.showVocabModal) {
        window.showVocabModal('test-word');
      } else {
        alert('showVocabModal not available');
      }
    });
    
    document.body.appendChild(testBtn);
    console.log("✅ Test button added");
  } catch (error) {
    console.error("❌ Error adding test button:", error);
  }
}, 3000);

// Add a view words button to see saved vocabulary
setTimeout(() => {
  try {
    const viewWordsBtn = document.createElement('button');
    viewWordsBtn.textContent = '📚 View Words';
    viewWordsBtn.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      z-index: 10001;
      padding: 8px 16px;
      background: #4ecdc4;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: Arial, sans-serif;
    `;
    
    viewWordsBtn.addEventListener('click', async () => {
      console.log("📚 View words button clicked");
      try {
        const response = await chrome.runtime.sendMessage({ action: 'getWords' });
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to get words');
        }
        
        const words = response.words || [];
        
        if (words.length === 0) {
          alert('No words saved yet. Try adding some words first!');
        } else {
          // Group words by word text to show multiple meanings
          const wordGroups = {};
          words.forEach(w => {
            const wordKey = w.word.toLowerCase().trim();
            if (!wordGroups[wordKey]) {
              wordGroups[wordKey] = [];
            }
            wordGroups[wordKey].push(w);
          });
          
          let wordList = '';
          Object.entries(wordGroups).forEach(([wordKey, wordEntries]) => {
            if (wordEntries.length === 1) {
              const w = wordEntries[0];
              wordList += `• ${w.word}: ${w.meaning}\n`;
            } else {
              wordList += `• ${wordEntries[0].word}:\n`;
              wordEntries.forEach((w, index) => {
                wordList += `  ${index + 1}. ${w.meaning}\n`;
              });
            }
          });
          
          alert(`Saved Words (${words.length} total, ${Object.keys(wordGroups).length} unique words):\n\n${wordList}`);
        }
      } catch (error) {
        console.error('❌ Error viewing words:', error);
        alert('Error loading words: ' + error.message);
      }
    });
    
    document.body.appendChild(viewWordsBtn);
    console.log("✅ View words button added");
  } catch (error) {
    console.error("❌ Error adding view words button:", error);
  }
}, 4000);

// Add a clear storage button for testing
setTimeout(() => {
  try {
    const clearStorageBtn = document.createElement('button');
    clearStorageBtn.textContent = '🗑️ Clear Storage';
    clearStorageBtn.style.cssText = `
      position: fixed;
      top: 90px;
      right: 10px;
      z-index: 10001;
      padding: 8px 16px;
      background: #ff6b6b;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: Arial, sans-serif;
    `;
    
    clearStorageBtn.addEventListener('click', async () => {
      console.log("🗑️ Clear storage button clicked");
      if (confirm('Are you sure you want to clear all saved words? This cannot be undone.')) {
        try {
          await chrome.storage.local.set({ vocabWords: [] });
          alert('Storage cleared successfully!');
        } catch (error) {
          console.error('❌ Error clearing storage:', error);
          alert('Error clearing storage: ' + error.message);
        }
      }
    });
    
    document.body.appendChild(clearStorageBtn);
    console.log("✅ Clear storage button added");
  } catch (error) {
    console.error('❌ Error adding clear storage button:', error);
  }
}, 5000);
