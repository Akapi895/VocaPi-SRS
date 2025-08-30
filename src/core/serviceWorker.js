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