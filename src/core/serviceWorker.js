// serviceWorker.js - Simplified without modules
console.log("🔧 Service Worker starting...");

// Mock logger for testing
const logger = {
  log: function(message) {
    console.log("📝 [ServiceWorker]", message);
  },
  error: function(message) {
    console.error("❌ [ServiceWorker]", message);
  }
};

// Setup context menu on install
chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.contextMenus.removeAll();
    chrome.contextMenus.create({
      id: "add-to-vocab",
      title: "Add '%s' to My Dictionary",
      contexts: ["selection"]
    });
    logger.log("Context menu created successfully");
  } catch (error) {
    logger.error("Error setting up context menus:", error);
  }
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "add-to-vocab" || !info.selectionText) return;

  const selectedText = info.selectionText.trim();
  if (!isValidTextSelection(selectedText)) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showSelectionError,
        args: [selectedText]
      });
    } catch (error) {
      logger.error("Error showing selection error:", error);
    }
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showAddWordModal,
      args: [selectedText]
    });
  } catch (error) {
    logger.error("Error showing add word modal:", error);
  }
});

// Validate text (words & phrases)
function isValidTextSelection(text) {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length > 200) return false;
  if (!/[a-zA-Z]/.test(trimmed)) return false;
  if (trimmed.split(/\s+/).length > 10) return false;
  return /^[a-zA-Z0-9\s'\-,.()!?]+$/.test(trimmed);
}

// Injected function: show error
function showSelectionError(selectedText) {
  try {
    const words = selectedText.trim().split(/\s+/);
    let errorMessage = "Please select valid text containing letters.";
    if (words.length > 10) errorMessage = "Please select a shorter text (max 10 words).";
    else if (selectedText.length > 200) errorMessage = "Please select shorter text (max 200 characters).";

    if (window.VocabSRS?.showError) {
      window.VocabSRS.showError(errorMessage);
    } else {
      alert(errorMessage);
    }
  } catch (e) {
    console.error("Selection error handler crashed:", e);
  }
}

// Injected function: show add word modal
function showAddWordModal(text) {
  try {
    if (window.VocabSRS?.showAddModal) {
      window.VocabSRS.showAddModal(text);
    }
  } catch (e) {
    console.error("Add modal handler crashed:", e);
  }
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  logger.log("Service worker received message:", request);

  switch (request.action) {
    case "ping":
      sendResponse({ status: "pong" });
      return true;

    case "saveWord":
      handleSaveWord(request.data, sendResponse);
      return true;

    case "getWords":
      handleGetWords(sendResponse);
      return true;

    case "deleteWord":
      handleDeleteWord(request.wordId, sendResponse);
      return true;

    case "saveAllWords":
      handleSaveAllWords(request.words, sendResponse);
      return true;

    case "openReviewWindow":
      openPopup("src/ui/html/review.html", 1000, 700, sendResponse);
      return true;

    case "openAnalyticsWindow":
      openPopup("src/ui/html/analytics.html", 1200, 800, sendResponse);
      return true;

    default:
      return false;
  }
});

// Handle saving word to storage
async function handleSaveWord(wordData, sendResponse) {
  try {
    logger.log("Saving word:", wordData);
    console.log("🔧 Service Worker: handleSaveWord called with:", wordData);
    
    // Create new word object
    const newWord = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      word: wordData.word.trim(),
      meaning: wordData.meaning.trim(),
      example: wordData.example.trim(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      srs: {
        interval: 1,
        repetitions: 0,
        easiness: 2.5,
        nextReview: new Date().toISOString()
      }
    };

    console.log("🔧 Service Worker: Created new word object:", newWord);

    // Save to storage
    const result = await chrome.storage.local.get(['vocabWords']);
    const existingWords = result.vocabWords || [];
    
    console.log("🔧 Service Worker: Existing words from storage:", existingWords);
    
    // Check if word already exists (case-insensitive and trim whitespace)
    const normalizedNewWord = newWord.word.toLowerCase().trim();
    const wordExists = existingWords.some(w => w.word.toLowerCase().trim() === normalizedNewWord);
    
    console.log("🔧 Service Worker: Checking for duplicates:", {
      newWord: normalizedNewWord,
      existingWords: existingWords.map(w => w.word.toLowerCase().trim()),
      exists: wordExists
    });
    
    if (wordExists) {
      console.log("🔧 Service Worker: Word already exists, checking if meaning is different...");
      
      // Find existing word
      const existingWordIndex = existingWords.findIndex(w => w.word.toLowerCase().trim() === normalizedNewWord);
      const existingWord = existingWords[existingWordIndex];
      
      console.log("🔧 Service Worker: Found existing word:", existingWord);
      
      // Check if the meaning is different
      const isMeaningDifferent = existingWord.meaning.toLowerCase().trim() !== newWord.meaning.toLowerCase().trim();
      
      if (isMeaningDifferent) {
        console.log("🔧 Service Worker: Meaning is different, creating new entry...");
        
        // Create new word entry with different meaning
        const newWordEntry = {
          ...newWord,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString()
        };
        
        existingWords.push(newWordEntry);
        
        // Save updated words
        await chrome.storage.local.set({ vocabWords: existingWords });
        
        console.log("🔧 Service Worker: New meaning added successfully");
        const response = { 
          success: true, 
          word: newWordEntry,
          message: 'New meaning added successfully'
        };
        console.log("🔧 Service Worker: Sending response:", response);
        sendResponse(response);
        return;
      } else {
        console.log("🔧 Service Worker: Same meaning, updating example if different...");
        
        // Check if example is different
        const isExampleDifferent = existingWord.example.toLowerCase().trim() !== newWord.example.toLowerCase().trim();
        
        if (isExampleDifferent) {
          // Update existing word with new example
          const updatedWord = {
            ...existingWord,
            example: newWord.example,
            lastModified: new Date().toISOString()
          };
          
          existingWords[existingWordIndex] = updatedWord;
          
          // Save updated words
          await chrome.storage.local.set({ vocabWords: existingWords });
          
          console.log("🔧 Service Worker: Example updated successfully");
          const response = { 
            success: true, 
            word: updatedWord,
            message: 'Example updated successfully'
          };
          console.log("🔧 Service Worker: Sending response:", response);
          sendResponse(response);
          return;
        } else {
          console.log("🔧 Service Worker: Word with same meaning and example already exists");
          sendResponse({ 
            success: false, 
            error: 'Word with this meaning and example already exists'
          });
          return;
        }
      }
    }
    
    // Add to existing words
    existingWords.push(newWord);
    
    // Save back to storage
    await chrome.storage.local.set({ vocabWords: existingWords });
    
    console.log("🔧 Service Worker: Word saved successfully to storage");
    logger.log('Word saved successfully:', newWord);
    const response = { success: true, word: newWord };
    console.log("🔧 Service Worker: Sending response:", response);
    sendResponse(response);
    
  } catch (error) {
    console.error("❌ Service Worker: Error saving word:", error);
    logger.error('Error saving word:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle getting all words
async function handleGetWords(sendResponse) {
  try {
    console.log("🔧 Service Worker: handleGetWords called");
    const result = await chrome.storage.local.get(['vocabWords']);
    console.log("🔧 Service Worker: Chrome storage result:", result);
    const words = result.vocabWords || [];
    console.log("🔧 Service Worker: Words found:", words);
    sendResponse({ success: true, words: words });
    console.log("🔧 Service Worker: Response sent successfully");
  } catch (error) {
    console.error("❌ Service Worker: Error getting words:", error);
    logger.error('Error getting words:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle deleting a word
async function handleDeleteWord(wordId, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['vocabWords']);
    const existingWords = result.vocabWords || [];
    const updatedWords = existingWords.filter(w => w.id !== wordId);
    
    await chrome.storage.local.set({ vocabWords: updatedWords });
    
    logger.log('Word deleted successfully:', wordId);
    sendResponse({ success: true });
  } catch (error) {
    logger.error('Error deleting word:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle saving all words (for import)
async function handleSaveAllWords(words, sendResponse) {
  try {
    await chrome.storage.local.set({ vocabWords: words });
    logger.log('All words saved successfully, count:', words.length);
    sendResponse({ success: true });
  } catch (error) {
    logger.error('Error saving all words:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Open popup utility
function openPopup(path, width, height, sendResponse) {
  chrome.windows.create({
    url: chrome.runtime.getURL(path),
    type: "popup",
    width,
    height,
    focused: true
  }).then((window) => {
    sendResponse({ success: true, windowId: window.id });
  }).catch((error) => {
    logger.error("Error opening window:", error);
    sendResponse({ success: false, error: error.message });
  });
}