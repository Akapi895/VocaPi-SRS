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
    
    // Try to sync data from Chrome Storage to IndexedDB on install
    await syncDataOnInstall();
  } catch (error) {
    logger.error("Error setting up context menus:", error);
  }
});

// Setup context menu on startup
chrome.runtime.onStartup.addListener(async () => {
  try {
    logger.log("Extension started, checking data consistency...");
    
    // Check if we need to sync data
    await checkAndSyncData();
  } catch (error) {
    logger.error("Error during startup sync:", error);
  }
});

// Sync data from Chrome Storage to IndexedDB on install
async function syncDataOnInstall() {
  try {
    logger.log("Starting data sync on install...");
    
    // Get words from Chrome Storage
    const result = await chrome.storage.local.get(['vocabWords']);
    const words = result.vocabWords || [];
    
    if (words.length > 0) {
      logger.log(`Found ${words.length} words in Chrome Storage, attempting to sync to IndexedDB...`);
      
      // Try to migrate to IndexedDB
      try {
        await migrateToIndexedDB(words);
        logger.log("Data sync completed successfully");
      } catch (migrationError) {
        logger.warn("Data sync failed, will retry later:", migrationError);
      }
    } else {
      logger.log("No words found in Chrome Storage");
    }
  } catch (error) {
    logger.error("Error during data sync:", error);
  }
}

// Check and sync data on startup
async function checkAndSyncData() {
  try {
    logger.log("Checking data consistency on startup...");
    
    // Get words from Chrome Storage
    const result = await chrome.storage.local.get(['vocabWords']);
    const chromeStorageWords = result.vocabWords || [];
    
    if (chromeStorageWords.length === 0) {
      logger.log("No words in Chrome Storage, nothing to sync");
      return;
    }
    
    logger.log(`Found ${chromeStorageWords.length} words in Chrome Storage`);
    
    // Try to sync with IndexedDB if available
    try {
      await migrateToIndexedDB(chromeStorageWords);
      logger.log("Startup data sync completed successfully");
    } catch (migrationError) {
      logger.log("Startup data sync failed, continuing with Chrome Storage only");
    }
  } catch (error) {
    logger.error("Error during startup data check:", error);
  }
}

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
    // Strategy 1: Delete from Chrome Storage first (primary storage)
    try {
      const result = await chrome.storage.local.get(['vocabWords']);
      const existingWords = result.vocabWords || [];
      const updatedWords = existingWords.filter(w => w.id !== wordId);
      
      await chrome.storage.local.set({ vocabWords: updatedWords });
      logger.log('Word deleted from Chrome Storage successfully');
    } catch (storageError) {
      logger.error('Chrome Storage delete failed:', storageError);
      sendResponse({ success: false, error: 'Failed to delete from Chrome Storage' });
      return;
    }
    
    // Strategy 2: Try to delete from IndexedDB if available (for sync)
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tabs.length > 0) {
        const tab = tabs[0];
        
        if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
          try {
            const indexedDBPromise = chrome.tabs.sendMessage(tab.id, { 
              action: 'deleteWordFromIndexedDB',
              wordId: wordId,
              timestamp: Date.now()
            });
            
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('IndexedDB timeout')), 2000);
            });
            
            const response = await Promise.race([indexedDBPromise, timeoutPromise]);
            
            if (response && response.success) {
              logger.log('Word deleted from IndexedDB successfully');
            }
          } catch (indexedDBError) {
            logger.log("IndexedDB delete not available, word deleted from Chrome Storage only");
          }
        }
      }
    } catch (indexedDBError) {
      logger.log("IndexedDB delete attempt failed, continuing with Chrome Storage only");
    }
    
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
    // Save to Chrome Storage first (primary storage)
    await chrome.storage.local.set({ vocabWords: words });
    logger.log('All words saved to Chrome Storage successfully, count:', words.length);
    
    // Try to sync to IndexedDB if available
    try {
      await migrateToIndexedDB(words);
      logger.log('Words also synced to IndexedDB');
      sendResponse({ success: true, source: 'Both (Chrome Storage + IndexedDB)' });
    } catch (migrationError) {
      logger.log('IndexedDB sync failed, words saved to Chrome Storage only');
      sendResponse({ success: true, source: 'Chrome Storage (IndexedDB unavailable)' });
    }
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

// Migrate words from Chrome Storage to IndexedDB
async function migrateToIndexedDB(words) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tabs.length > 0) {
      const tab = tabs[0];
      
      if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        // Send words to content script for IndexedDB storage
        await chrome.tabs.sendMessage(tab.id, { 
          action: 'migrateWordsToIndexedDB',
          words: words,
          timestamp: Date.now()
        });
        
        logger.log(`Migration request sent for ${words.length} words`);
      }
    }
  } catch (error) {
    logger.error("Migration failed:", error);
    throw error;
  }
}

// Sync words from IndexedDB to Chrome Storage
async function syncIndexedDBToChromeStorage(words) {
  try {
    logger.log(`Syncing ${words.length} words from IndexedDB to Chrome Storage...`);
    
    // Save all words to Chrome Storage
    await chrome.storage.local.set({ vocabWords: words });
    
    logger.log("Successfully synced words to Chrome Storage");
  } catch (error) {
    logger.error("Failed to sync to Chrome Storage:", error);
    throw error;
  }
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