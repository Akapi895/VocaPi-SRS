// Content script for Vocab SRS Extension
console.log('Vocab SRS content script loaded');

// Ensure we don't initialize multiple times
if (!window.vocabSRSInitialized) {
  window.vocabSRSInitialized = true;
  
  // Initialize the extension when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVocabSRS);
  } else {
    initVocabSRS();
  }
}

function initVocabSRS() {
  console.log('Initializing Vocab SRS on', window.location.hostname);
  
  // Check if utilities are available
  if (!window.VocabUtils || !window.VocabAPI) {
    console.error('Vocab SRS utilities not loaded');
    return;
  }
  
  // The Add Modal and Floating Button are already initialized 
  // by their respective scripts loaded via content_scripts
  console.log('Vocab SRS initialized successfully');
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'ping') {
    sendResponse({ status: 'content script active' });
    return true;
  }
  
  if (request.action === 'showAddModal' && request.word) {
    if (window.VocabSRS && window.VocabSRS.showAddModal) {
      window.VocabSRS.showAddModal(request.word);
      sendResponse({ status: 'modal shown' });
    } else {
      sendResponse({ status: 'modal not available' });
    }
    return true;
  }
  
  return false;
});

// Handle page navigation changes (for SPAs)
let currentUrl = window.location.href;

function handleUrlChange() {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    console.log('URL changed, re-checking Vocab SRS initialization');
    
    // Reinitialize if needed (some SPAs might need this)
    setTimeout(initVocabSRS, 500);
  }
}

// Monitor for URL changes in SPAs
const observer = new MutationObserver(() => {
  handleUrlChange();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Also listen for popstate events
window.addEventListener('popstate', handleUrlChange);

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (observer) {
    observer.disconnect();
  }
  
  // Stop any playing audio
  if (window.VocabAPI && window.VocabAPI.AudioPlayer) {
    window.VocabAPI.AudioPlayer.stop();
  }
});
