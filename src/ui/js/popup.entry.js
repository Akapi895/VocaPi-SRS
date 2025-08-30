// Popup entry point - simplified without modules
console.log("🚀 Popup entry loading...");

// Load core dependencies first
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const fullUrl = chrome.runtime.getURL(src);
    console.log(`📥 Loading script: ${src} -> ${fullUrl}`);
    script.src = fullUrl;
    script.onload = () => {
      console.log(`✅ Script loaded successfully: ${src}`);
      resolve();
    };
    script.onerror = (error) => {
      console.error(`❌ Script failed to load: ${src}`, error);
      reject(error);
    };
    document.head.appendChild(script);
  });
};

// Load scripts in order
async function loadScripts() {
  try {
    console.log("🔄 Starting to load scripts...");
    
    // Load mock-chrome.js first if needed
    if (typeof chrome === 'undefined') {
      await loadScript('src/ui/js/mock-chrome.js');
      console.log("✅ Mock Chrome API loaded");
    }
    
    // Load core dependencies
    await loadScript('src/core/indexeddb.js');
    console.log("✅ IndexedDB loaded");
    
    await loadScript('src/core/utils.js');
    console.log("✅ Utils loaded");
    
    await loadScript('src/core/storage.js');
    console.log("✅ Storage loaded");
    
    await loadScript('src/core/migration.js');
    console.log("✅ Migration loaded");
    
    // Load main popup script
    await loadScript('src/ui/js/popup.js');
    console.log("✅ Popup loaded");
    
    console.log("✅ All scripts loaded successfully");
  } catch (error) {
    console.error("❌ Error loading scripts:", error);
  }
}

// Start loading scripts
loadScripts().then(() => {
  console.log('🚀 All scripts loaded, initializing popup...');
  // Initialize popup after all scripts are loaded
  if (typeof VocabSRSPopup !== 'undefined') {
    try {
      const popup = new VocabSRSPopup();
      console.log('✅ VocabSRSPopup instance created successfully:', popup);
    } catch (error) {
      console.error('❌ Error creating VocabSRSPopup:', error);
    }
  } else {
    console.error('❌ VocabSRSPopup class not found after loading scripts');
  }
}).catch(error => {
  console.error('❌ Failed to load scripts:', error);
});