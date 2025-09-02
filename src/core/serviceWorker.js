// serviceWorker.js - Simplified without modules

// Mock logger for testing
const logger = {
  log: function(message) {
    console.log("[ServiceWorker]", message);
  },
  error: function(message) {
    console.error("[ServiceWorker]", message);
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

// Setup context menu on startup
chrome.runtime.onStartup.addListener(async () => {
  try {
    logger.log("Extension started");
    
  } catch (error) {
    logger.error("Error during startup:", error);
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

    case "updateWord":
      handleUpdateWord(request.id, request.updates, sendResponse);
      return true;

    case "deleteWord":
      handleDeleteWord(request.wordId, sendResponse);
      return true;

    case "saveAllWords":
      handleSaveAllWords(request.words, sendResponse);
      return true;

    case "openReviewWindow":
      handleOpenReviewWindow(sendResponse);
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
    logger.log('handleSaveWord called with:', wordData);
    
    // Create new word object with same structure as storage.js
    const newWord = {
      id: wordData.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      word: wordData.word.trim(),
      meaning: wordData.meaning.trim(),
      example: wordData.example.trim(),
      phonetic: wordData.phonetic || "",
      audioUrl: wordData.audioUrl || null,
      wordType: wordData.wordType || "word",
      wordCount: wordData.word.split(/\s+/).length,
      srs: {
        easeFactor: wordData.srs?.easeFactor || 2.5,
        interval: wordData.srs?.interval || 0,
        repetitions: wordData.srs?.repetitions || 0,
        nextReview: wordData.srs?.nextReview || new Date().toISOString()
      },
      createdAt: wordData.createdAt || new Date().toISOString(),
      lastModified: new Date().toISOString(),
      tags: wordData.tags || [],
      difficulty: wordData.difficulty || "medium",
      source: wordData.source || "manual"
    };

    logger.log('New word object created:', newWord);

    // Save to Chrome Storage (primary storage)
    try {
      logger.log('Saving to Chrome Storage...');
      await saveToChromeStorage(newWord);
      logger.log('Word saved to Chrome Storage successfully');
      
      sendResponse({ success: true, word: newWord, source: 'Chrome Storage' });
    } catch (storageError) {
      logger.error('Chrome Storage save failed:', storageError);
      sendResponse({ success: false, error: storageError.message });
    }
    
  } catch (error) {
    logger.error('Error saving word:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle getting all words
async function handleGetWords(sendResponse) {
  try {
    logger.log("handleGetWords called");
    let words = [];
    let source = 'Chrome Storage';
    
    // Strategy: Get words from Chrome Storage (primary source)
    try {
      logger.log('Reading from Chrome Storage...');
      const result = await chrome.storage.local.get(['vocabWords']);
      words = result.vocabWords || [];
      logger.log(`Chrome Storage: ${words.length} words loaded`);
    } catch (storageError) {
      logger.error("Chrome Storage failed:", storageError);
      words = [];
      source = 'empty';
    }
    
    logger.log(`Final result: ${words.length} words from ${source}`);
    
    sendResponse({ 
      success: true, 
      words: words,
      source: source,
      timestamp: Date.now()
    });
    
  } catch (error) {
    logger.error("Critical error in handleGetWords:", error);
    sendResponse({ 
      success: false, 
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// Handle deleting a word
async function handleDeleteWord(wordId, sendResponse) {
  try {
    // ✅ Giữ lại: Delete from Chrome Storage
    const result = await chrome.storage.local.get(['vocabWords']);
    const existingWords = result.vocabWords || [];
    const updatedWords = existingWords.filter(w => w.id !== wordId);
    
    await chrome.storage.local.set({ vocabWords: updatedWords });
    logger.log('Word deleted from Chrome Storage successfully');
    
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
    // ✅ Giữ lại: Save to Chrome Storage
    await chrome.storage.local.set({ vocabWords: words });
    logger.log('All words saved to Chrome Storage successfully, count:', words.length);
    
    sendResponse({ success: true, source: 'Chrome Storage' });
  } catch (error) {
    logger.error('Error saving all words:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle updating word in storage
async function handleUpdateWord(wordId, updates, sendResponse) {
  try {
    logger.log('handleUpdateWord called with id:', wordId);
    logger.log('Updates:', updates);
    
    // Get existing words from Chrome Storage
    const result = await chrome.storage.local.get(['vocabWords']);
    const existingWords = result.vocabWords || [];
    
    // Find word to update
    const wordIndex = existingWords.findIndex(w => w.id === wordId);
    if (wordIndex === -1) {
      throw new Error(`Word with id ${wordId} not found`);
    }
    
    // Update word data
    const updatedWord = {
      ...existingWords[wordIndex],
      ...updates,
      lastModified: new Date().toISOString()
    };
    
    // Update in array
    existingWords[wordIndex] = updatedWord;
    
    // Save back to Chrome Storage
    await chrome.storage.local.set({ vocabWords: existingWords });
    
    logger.log('Word updated successfully:', updatedWord.word);
    sendResponse({ success: true, word: updatedWord, source: 'Chrome Storage' });
    
  } catch (error) {
    logger.error('Error updating word:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Save word to Chrome Storage with duplicate checking
async function saveToChromeStorage(newWord) {
  const result = await chrome.storage.local.get(['vocabWords']);
  const existingWords = result.vocabWords || [];
  
  // Check if word already exists (case-insensitive and trim whitespace)
  const normalizedNewWord = newWord.word.toLowerCase().trim();
  const wordExists = existingWords.some(w => w.word.toLowerCase().trim() === normalizedNewWord);
  
  if (wordExists) {
    // Find existing word
    const existingWordIndex = existingWords.findIndex(w => w.word.toLowerCase().trim() === normalizedNewWord);
    const existingWord = existingWords[existingWordIndex];
    
    // Check if the meaning is different
    const isMeaningDifferent = existingWord.meaning.toLowerCase().trim() !== newWord.meaning.toLowerCase().trim();
    
    if (isMeaningDifferent) {
      // Create new word entry with different meaning
      const newWordEntry = {
        ...newWord,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      
      existingWords.push(newWordEntry);
    } else {
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
      } else {
        throw new Error('Word with this meaning and example already exists');
      }
    }
  } else {
    // Add new word
    existingWords.push(newWord);
  }
  
  // Save back to storage
  await chrome.storage.local.set({ vocabWords: existingWords });
}

// Handle opening review window
async function handleOpenReviewWindow(sendResponse) {
    try {
        const result = await chrome.storage.local.get(['vocabWords']);
        const allWords = result.vocabWords || [];
        
        if (allWords.length === 0) {
            sendResponse({ success: false, error: 'No words available for review' });
            return;
        }
        
        // Filter due words for review
        const dueWords = allWords.filter(word => {
            try {
                if (!word.srs || !word.srs.nextReview) return true;
                const nextReview = new Date(word.srs.nextReview);
                return nextReview <= new Date();
            } catch (dateError) {
                return true; // Treat as due if date parsing fails
            }
        });
        
        if (dueWords.length === 0) {
            sendResponse({ success: false, error: 'No words are due for review right now' });
            return;
        }
        
        // Sort due words by nextReview (earliest first)
        const sortedDueWords = dueWords.sort((a, b) => {
            const aTime = a.srs?.nextReview ? new Date(a.srs.nextReview).getTime() : 0;
            const bTime = b.srs?.nextReview ? new Date(b.srs.nextReview).getTime() : 0;
            
            if (aTime > 0 && bTime > 0) {
                return aTime - bTime; // Earliest first
            }
            
            // Prioritize words without nextReview (new words)
            if (aTime === 0 && bTime > 0) return -1;
            if (aTime > 0 && bTime === 0) return 1;
            
            // If neither has nextReview, sort by creation date
            const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bCreated - aCreated; // Newest first
        });
        
        // Open review window with sorted due words count
        logger.log(`Opening review window with ${sortedDueWords.length} due words (sorted by nextReview)`);
        openPopup("src/ui/html/review.html", 1000, 700, sendResponse);
        
    } catch (error) {
        logger.error('Error preparing review data:', error);
        sendResponse({ success: false, error: 'Failed to prepare review data' });
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