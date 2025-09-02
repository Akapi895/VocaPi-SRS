chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  
  switch (request.action) {
    case 'getWordsFromIndexedDB':

      
      // Check if VocabStorage is available
      if (!window.VocabStorage) {

        sendResponse({ success: false, error: 'VocabStorage not available' });
        return true;
      }
      
      // Get words from IndexedDB and send back
      window.VocabStorage.getAllWords().then(words => {

        sendResponse({ success: true, words: words });
      }).catch(error => {
        console.error("Content script: Error getting words:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
      
    case 'saveWordToIndexedDB':

      
      if (!window.VocabStorage) {
        sendResponse({ success: false, error: 'VocabStorage not available' });
        return true;
      }
      
      window.VocabStorage.addWord(request.word).then(word => {

        sendResponse({ success: true, word: word });
      }).catch(error => {
        console.error("Content script: Error saving word:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
      
    case 'deleteWordFromIndexedDB':

      
      if (!window.VocabStorage) {
        sendResponse({ success: false, error: 'VocabStorage not available' });
        return true;
      }
      
      window.VocabStorage.removeWord(request.wordId).then(result => {

        sendResponse({ success: true, result: result });
      }).catch(error => {
        console.error("Content script: Error deleting word:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
      
    case 'migrateWordsToIndexedDB':

      
      if (!window.VocabStorage) {
        sendResponse({ success: false, error: 'VocabStorage not available' });
        return true;
      }
      
      migrateWordsToIndexedDB(request.words).then(result => {

        sendResponse({ success: true, result: result });
      }).catch(error => {
        console.error("Content script: Error migrating words:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
      
    default:

      sendResponse({ success: false, error: 'Unknown action' });
      return false;
  }
});

// Global functions - sẽ được expose sau khi addModal.js load
let showVocabModalFunction = null;
let testModalFunction = null;

// Khởi tạo các component khi content script load
function initializeComponents() {
  try {

    
    // Sử dụng floating button từ addModal.js
    if (window.VocabFloatingButton && typeof window.VocabFloatingButton.init === 'function') {
      window.VocabFloatingButton.init();

    } else {
      console.warn("VocabFloatingButton not available, creating fallback");
      createVocabFloatingButton();
    }
    
    // Expose functions sau khi addModal.js đã load
    exposeGlobalFunctions();
    

    
  } catch (error) {
    console.error("Failed to initialize components:", error);
  }
}

// Wait for addModal.js to load before initializing
function waitForAddModalAndInit() {
  if (window.VocabAddModal && typeof window.VocabAddModal.show === 'function') {

    initializeComponents();
  } else {

    setTimeout(waitForAddModalAndInit, 100);
  }
}

// Start waiting for addModal.js
waitForAddModalAndInit();

// Migrate words from Chrome Storage to IndexedDB
async function migrateWordsToIndexedDB(words) {

  
  if (!window.VocabStorage) {
    throw new Error('VocabStorage not available');
  }
  
  let migratedCount = 0;
  let skippedCount = 0;
  const errors = [];
  
  for (const word of words) {
    try {
      // Check if word already exists in IndexedDB
      const existingWords = await window.VocabStorage.getAllWords();
      const wordExists = existingWords.some(w => w.word.toLowerCase().trim() === word.word.toLowerCase().trim());
      
      if (!wordExists) {
        await window.VocabStorage.addWord(word);
        migratedCount++;

      } else {
        skippedCount++;

      }
    } catch (error) {
      console.error(`Failed to migrate word ${word.word}:`, error);
      errors.push({ word: word.word, error: error.message });
    }
  }
  

  
  return {
    total: words.length,
    migrated: migratedCount,
    skipped: skippedCount,
    errors: errors
  };
}

// Expose functions globally
function exposeGlobalFunctions() {

  
  // Expose showVocabModal function
  showVocabModalFunction = function(word) {

    
    // Sử dụng modal từ addModal.js nếu có
    if (window.VocabAddModal && typeof window.VocabAddModal.show === 'function') {
      window.VocabAddModal.show(word);

    } else {
      console.error("VocabAddModal not available, falling back to basic alert");
      alert(`Please add "${word}" to your dictionary`);
    }
  };
  
  // Expose test function
  testModalFunction = function() {

    if (typeof showVocabModalFunction === 'function') {
      showVocabModalFunction('test-word');
    } else {
      console.error("showVocabModal function not available");
    }
  };
  
  // Assign to window
  window.showVocabModal = showVocabModalFunction;
  window.testModal = testModalFunction;
  

}

// Sử dụng modal từ addModal.js thay vì tạo modal riêng
function createVocabAddModal() {

  // Modal sẽ được tạo tự động khi addModal.js load
}

// Tạo VocabFloatingButton
function createVocabFloatingButton() {

  
  try {
    // Tạo floating button
    const button = document.createElement('button');
    button.className = 'vocab-floating-btn';
    button.textContent = '+ Add to Dictionary';
    button.style.cssText = `
      position: absolute;
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
      transition: all 0.2s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      opacity: 0;
      transform: scale(0.9);
      pointer-events: none;
    `;
    
    document.body.appendChild(button);
    
    // Bind events
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleAddWord();
    });
    
    // Bind selection events - sử dụng VocabFloatingButton từ addModal.js nếu có
    if (window.VocabFloatingButton && typeof window.VocabFloatingButton.bindSelectionEvents === 'function') {
      // VocabFloatingButton từ addModal.js sẽ tự bind events

    } else {
      // Fallback cho button cũ
      document.addEventListener('mouseup', () => {
        setTimeout(() => handleSelection(), 10);
      });
      
      document.addEventListener('keyup', () => {
        setTimeout(() => handleSelection(), 10);
      });
      
      document.addEventListener('click', (e) => {
        if (e.target !== button) {
          hideButton();
        }
      });
    }
    
    // Store reference
    window.vocabFloatingButton = button;
    

  } catch (error) {
    console.error("Error creating VocabFloatingButton:", error);
  }
}

// Handle text selection
function handleSelection() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (!selectedText) {
    hideButton();
    return;
  }
  
  // Clean text
  const cleanText = selectedText.replace(/\s+/g, ' ').trim();
  if (!cleanText || cleanText.length < 2) {
    hideButton();
    return;
  }
  
  // Check if text contains letters
  if (!/[a-zA-Z]/.test(cleanText)) {
    hideButton();
    return;
  }
  
  showButton(selection);
}

// Show floating button
function showButton(selection) {
  // Sử dụng VocabFloatingButton từ addModal.js nếu có
  if (window.VocabFloatingButton && typeof window.VocabFloatingButton.showButton === 'function') {
    window.VocabFloatingButton.showButton(selection);
    return;
  }
  
  // Fallback cho button cũ
  const button = window.vocabFloatingButton;
  if (!button) return;
  
  try {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    button.style.left = `${rect.left + window.scrollX}px`;
    button.style.top = `${rect.bottom + window.scrollY + 5}px`;
    button.style.opacity = '1';
    button.style.transform = 'scale(1)';
    button.style.pointerEvents = 'auto';
    
    // Store current selection
    button.dataset.selectedText = selection.toString().trim();
    
  } catch (error) {
    console.error("❌ Error showing button:", error);
  }
}

// Hide floating button
function hideButton() {
  // Sử dụng VocabFloatingButton từ addModal.js nếu có
  if (window.VocabFloatingButton && typeof window.VocabFloatingButton.hideButton === 'function') {
    window.VocabFloatingButton.hideButton();
    return;
  }
  
  // Fallback cho button cũ
  const button = window.vocabFloatingButton;
  if (!button) return;
  
  button.style.opacity = '0';
  button.style.transform = 'scale(0.9)';
  button.style.pointerEvents = 'none';
  delete button.dataset.selectedText;
}

// Handle add word action
function handleAddWord() {
  // Sử dụng VocabFloatingButton từ addModal.js nếu có
  if (window.VocabFloatingButton && typeof window.VocabFloatingButton.handleAddWord === 'function') {
    window.VocabFloatingButton.handleAddWord();
    return;
  }
  
  // Fallback cho button cũ
  const button = window.vocabFloatingButton;
  if (!button || !button.dataset.selectedText) return;
  
  const selectedText = button.dataset.selectedText;

  
  // Sử dụng modal từ addModal.js
  if (window.VocabAddModal && typeof window.VocabAddModal.show === 'function') {
    window.VocabAddModal.show(selectedText);

  } else {
    // Fallback nếu addModal.js chưa load
    console.error("VocabAddModal not available");
    alert(`Please add "${selectedText}" to your dictionary`);
  }
  
  // Clear selection
  window.getSelection().removeAllRanges();
  hideButton();
}

