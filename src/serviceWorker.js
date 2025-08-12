// Service Worker for Vocab SRS Extension
console.log('Vocab SRS Service Worker started');

// Menu setup
chrome.runtime.onInstalled.addListener(async () => {
  try {
    // Remove existing context menus to avoid duplicates
    await chrome.contextMenus.removeAll();
    
    chrome.contextMenus.create({
      id: "add-to-vocab",
      title: "Add '%s' to My Dictionary",
      contexts: ["selection"]
    });
    
    console.log('Context menu created successfully');
  } catch (error) {
    console.error('Error setting up context menus:', error);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "add-to-vocab" && info.selectionText) {
    const selectedText = info.selectionText.trim();
    
    // Enhanced validation for both words and phrases
    if (!isValidTextSelection(selectedText)) {
      // Inject script to show error message
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: showSelectionError,
          args: [selectedText]
        });
      } catch (error) {
        console.error('Error showing selection error:', error);
      }
      return;
    }
    
    // Inject script to show add word modal
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showAddWordModal,
        args: [selectedText]
      });
    } catch (error) {
      console.error('Error showing add word modal:', error);
    }
  }
});

// Enhanced helper function to validate text selection (words and phrases)
function isValidTextSelection(text) {
  if (!text || text.length === 0) return false;
  
  // Support both single words and phrases
  const trimmedText = text.trim();
  
  // Basic validation: not empty, reasonable length, contains letters
  if (trimmedText.length > 200) return false; // Max phrase length
  if (!/[a-zA-Z]/.test(trimmedText)) return false; // Must contain letters
  
  // Limit to reasonable number of words (up to 10 words for phrases)
  const wordCount = trimmedText.split(/\s+/).length;
  if (wordCount > 10) return false;
  
  // Allow letters, numbers, spaces, hyphens, apostrophes, commas, periods
  const phrasePattern = /^[a-zA-Z0-9\s''\-,.\(\)!?]+$/;
  return phrasePattern.test(trimmedText);
}

// Legacy function for backward compatibility
function isValidSingleWord(text) {
  if (!text || text.length === 0) return false;
  
  // Check for single word (no spaces, only letters and common word characters)
  const wordPattern = /^[a-zA-Z]+(?:[''-][a-zA-Z]+)*$/;
  const words = text.split(/\s+/);
  
  return words.length === 1 && wordPattern.test(words[0]);
}

// Function injected into content script to show selection error
function showSelectionError(selectedText) {
  const wordCount = selectedText.trim().split(/\s+/).length;
  let errorMessage = '';
  
  if (wordCount > 10) {
    errorMessage = 'Please select a shorter text (maximum 10 words).';
  } else if (selectedText.length > 200) {
    errorMessage = 'Please select shorter text (maximum 200 characters).';
  } else {
    errorMessage = 'Please select valid text containing letters.';
  }
  
  if (window.VocabSRS && window.VocabSRS.showError) {
    window.VocabSRS.showError(errorMessage);
  } else {
    alert(errorMessage);
  }
}

// Function injected into content script to show add word modal
function showAddWordModal(text) {
  // Support both words and phrases
  if (window.VocabSRS && window.VocabSRS.showAddModal) {
    window.VocabSRS.showAddModal(text);
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Service worker received message:', request);
  
  if (request.action === 'ping') {
    sendResponse({ status: 'pong' });
    return true;
  }
  
  if (request.action === 'openReviewWindow') {
    // Open review window
    chrome.windows.create({
      url: chrome.runtime.getURL('src/ui/review.html'),
      type: 'popup',
      width: 1000,
      height: 700,
      focused: true
    }).then((window) => {
      sendResponse({ success: true, windowId: window.id });
    }).catch((error) => {
      console.error('Error opening review window:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true;
  }
  
  if (request.action === 'openAnalyticsWindow') {
    // Open analytics window
    chrome.windows.create({
      url: chrome.runtime.getURL('src/ui/analytics.html'),
      type: 'popup',
      width: 1200,
      height: 800,
      focused: true
    }).then((window) => {
      sendResponse({ success: true, windowId: window.id });
    }).catch((error) => {
      console.error('Error opening analytics window:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true;
  }
  
  // Handle any other background tasks if needed
  return false;
});
