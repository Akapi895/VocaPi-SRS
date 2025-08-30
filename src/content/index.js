// Content script entry point - không sử dụng import statements
console.log("🚀 Content script starting...");
console.log("🔍 Content script location:", window.location.href);
console.log("🔍 Content script timestamp:", new Date().toISOString());

// Global variables để lưu trữ elements
let vocabModalOverlay = null;
let vocabWordInput = null;
let vocabMeaningInput = null;
let vocabExampleInput = null;

// Global functions - sẽ được expose sau khi elements được tạo
let showVocabModalFunction = null;
let testModalFunction = null;

// Khởi tạo các component khi content script load
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
  
  // Double check
  setTimeout(() => {
    console.log("🔍 Double check global functions:", {
      showVocabModal: typeof window.showVocabModal,
      testModal: typeof window.testModal,
      showVocabModalFunction: typeof showVocabModalFunction,
      testModalFunction: typeof testModalFunction
    });
    
    // Triple check - test function call
    if (typeof window.showVocabModal === 'function') {
      console.log("✅ showVocabModal is working, testing...");
      try {
        window.showVocabModal('test-word');
        console.log("✅ showVocabModal test successful");
      } catch (error) {
        console.error("❌ showVocabModal test failed:", error);
      }
    } else {
      console.error("❌ showVocabModal still not working");
    }
  }, 1000);
}

// Tạo VocabAddModal
function createVocabAddModal() {
  console.log("🔧 Creating VocabAddModal...");
  
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
      // Save word to Chrome storage
      await saveWordToStorage(word, meaning, example);
      console.log('💾 Word saved successfully:', { word, meaning, example });
      alert(`Word "${word}" saved successfully!`);
      hideModal();
    } catch (error) {
      console.error('❌ Failed to save word:', error);
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
}

// Save word to Chrome storage
async function saveWordToStorage(word, meaning, example) {
  try {
    // Get existing words
    const result = await chrome.storage.sync.get(['vocabWords']);
    const existingWords = result.vocabWords || [];
    
    // Check if word already exists
    const wordExists = existingWords.some(w => w.word.toLowerCase() === word.toLowerCase());
    if (wordExists) {
      throw new Error('Word already exists in dictionary');
    }
    
    // Create new word object
    const newWord = {
      id: Date.now().toString(),
      word: word.trim(),
      meaning: meaning.trim(),
      example: example.trim(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      srs: {
        interval: 1,
        repetitions: 0,
        easiness: 2.5,
        nextReview: new Date().toISOString()
      }
    };
    
    // Add to existing words
    existingWords.push(newWord);
    
    // Save back to storage
    await chrome.storage.sync.set({ vocabWords: existingWords });
    
    console.log('💾 Word saved to storage:', newWord);
    return newWord;
  } catch (error) {
    console.error('❌ Storage error:', error);
    throw error;
  }
}

// Tạo VocabFloatingButton
function createVocabFloatingButton() {
  console.log("🔧 Creating VocabFloatingButton...");
  
  // Tạo button
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
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  document.body.appendChild(button);
  
  // Bind selection events
  document.addEventListener('mouseup', () => {
    setTimeout(handleSelection, 10);
  });
  
  document.addEventListener('keyup', () => {
    setTimeout(handleSelection, 10);
  });
  
  document.addEventListener('click', (e) => {
    if (e.target !== button) {
      hideButton();
    }
  });
  
  function handleSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (!selectedText || selectedText.length < 2 || selectedText.length > 200) {
      hideButton();
      return;
    }
    
    // Check if text contains letters
    if (!/[a-zA-Z]/.test(selectedText)) {
      hideButton();
      return;
    }
    
    showButton(selection);
  }
  
  function showButton(selection) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    button.style.left = `${rect.left + window.scrollX}px`;
    button.style.top = `${rect.bottom + window.scrollY + 5}px`;
    button.style.display = 'block';
    
    // Store current selection
    button.dataset.selectedText = selection.toString().trim();
  }
  
  function hideButton() {
    button.style.display = 'none';
    delete button.dataset.selectedText;
  }
  
  // Bind click event
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const selectedText = button.dataset.selectedText;
    if (selectedText && window.showVocabModal) {
      window.showVocabModal(selectedText);
      hideButton();
      window.getSelection().removeAllRanges();
    }
  });
  
  console.log("✅ VocabFloatingButton created successfully");
}
