const coreScripts = [
  'src/core/utils.js',
  'src/core/text.js',
  'src/core/api.js',
  'src/core/storage.js',
  'src/core/migration.js'
];

const uiScripts = [
  'src/ui/js/popup.js'
];

async function loadScripts() {
  for (const script of coreScripts) {
    try {
      await loadScript(script);
    } catch (error) {
      console.error(`Failed to load script: ${script}`, error);
    }
  }
  
  for (const script of uiScripts) {
    try {
      await loadScript(script);
    } catch (error) {
      console.error(`Failed to load script: ${script}`, error);
    }
  }
  
  try {
    const popup = new VocabSRSPopup();
  } catch (error) {
    console.error('Failed to create VocabSRSPopup:', error);
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(src);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadScripts);
} else {
  loadScripts();
}