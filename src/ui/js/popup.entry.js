// Popup entry point - simplified without modules
console.log("🚀 Popup entry loading...");

// Load main popup script
const script = document.createElement('script');
script.src = './popup.js';
document.head.appendChild(script);

console.log("✅ Popup entry loaded");