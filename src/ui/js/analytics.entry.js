// analytics.entry.js - Simplified without modules
console.log("📊 analytics.entry.js loaded");

// Mock VocabAnalytics for testing
window.VocabAnalytics = {
  init: function() {
    console.log("🔧 Mock VocabAnalytics.init called");
    return Promise.resolve();
  },
  
  ensureInitialized: function() {
    console.log("🔧 Mock VocabAnalytics.ensureInitialized called");
    return Promise.resolve();
  }
};

console.log("✅ analytics.entry.js mock functions created");
