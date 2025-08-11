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
    
    // Validate single word selection
    if (!isValidSingleWord(selectedText)) {
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

// Helper function to validate single word selection
function isValidSingleWord(text) {
  if (!text || text.length === 0) return false;
  
  // Check for single word (no spaces, only letters and common word characters)
  const wordPattern = /^[a-zA-Z]+(?:[''-][a-zA-Z]+)*$/;
  const words = text.split(/\s+/);
  
  return words.length === 1 && wordPattern.test(words[0]);
}

// Function injected into content script to show selection error
function showSelectionError(selectedText) {
  if (window.VocabSRS && window.VocabSRS.showError) {
    window.VocabSRS.showError('Please select a single English word only.');
  } else {
    alert('Please select a single English word only.');
  }
}

// Function injected into content script to show add word modal
function showAddWordModal(word) {
  if (window.VocabSRS && window.VocabSRS.showAddModal) {
    window.VocabSRS.showAddModal(word);
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
  
  if (request.action === 'openDebugWindow') {
    // Open debug analytics window
    chrome.windows.create({
      url: chrome.runtime.getURL('src/ui/debug-analytics.html'),
      type: 'popup',
      width: 800,
      height: 600,
      focused: true
    }).then((window) => {
      sendResponse({ success: true, windowId: window.id });
    }).catch((error) => {
      console.error('Error opening debug window:', error);
      sendResponse({ success: false, error: error.message });
    });
    
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
    
    return true; // Will respond asynchronously
  }
  
  // Handle any other background tasks if needed
  return false;
});
