// Keyboard Shortcuts and Accessibility Enhancements for Vocab SRS
class VocabKeyboardHandler {
  constructor() {
    this.shortcuts = new Map();
    this.setupDefaultShortcuts();
    this.bindEvents();
  }

  setupDefaultShortcuts() {
    // Global shortcuts
    this.shortcuts.set('alt+v', () => this.toggleExtensionPopup());
    this.shortcuts.set('alt+r', () => this.startReview());
    this.shortcuts.set('alt+a', () => this.addCurrentSelection());
    
    // Review shortcuts
    this.shortcuts.set('enter', () => this.submitAnswer());
    this.shortcuts.set('space', () => this.playAudio());
    this.shortcuts.set('h', () => this.showHint());
    this.shortcuts.set('s', () => this.skipWord());
    this.shortcuts.set('escape', () => this.closeModal());
    
    // Quality shortcuts (0-5)
    for (let i = 0; i <= 5; i++) {
      this.shortcuts.set(i.toString(), () => this.selectQuality(i));
    }
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    // Focus management
    document.addEventListener('focusin', (e) => this.handleFocusIn(e));
    document.addEventListener('focusout', (e) => this.handleFocusOut(e));
  }

  handleKeydown(e) {
    const key = this.getKeyCombo(e);
    
    // Skip if user is typing in an input field
    if (this.isInputActive(e.target)) {
      return;
    }

    if (this.shortcuts.has(key)) {
      e.preventDefault();
      this.shortcuts.get(key)();
    }
  }

  getKeyCombo(e) {
    const modifiers = [];
    if (e.ctrlKey) modifiers.push('ctrl');
    if (e.altKey) modifiers.push('alt');
    if (e.shiftKey) modifiers.push('shift');
    
    const key = e.key.toLowerCase();
    
    if (modifiers.length > 0) {
      return `${modifiers.join('+')}+${key}`;
    }
    
    return key;
  }

  isInputActive(element) {
    const inputTags = ['input', 'textarea', 'select'];
    return inputTags.includes(element.tagName.toLowerCase()) || 
           element.contentEditable === 'true';
  }

  // Shortcut actions
  toggleExtensionPopup() {
    if (window.chrome && chrome.runtime) {
      chrome.runtime.sendMessage({
        action: 'togglePopup'
      });
    }
  }

  startReview() {
    const reviewBtn = document.getElementById('start-review-btn');
    if (reviewBtn && !reviewBtn.disabled) {
      reviewBtn.click();
    }
  }

  addCurrentSelection() {
    const selection = window.getSelection().toString().trim();
    if (selection && window.VocabModal) {
      window.VocabModal.openModal(selection);
    }
  }

  submitAnswer() {
    const submitBtn = document.getElementById('submit-answer-btn') || 
                     document.getElementById('retype-submit-btn');
    if (submitBtn && submitBtn.style.display !== 'none') {
      submitBtn.click();
    }
  }

  playAudio() {
    const audioBtn = document.getElementById('play-audio-btn');
    if (audioBtn && audioBtn.style.display !== 'none' && !audioBtn.disabled) {
      audioBtn.click();
    }
  }

  showHint() {
    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn && hintBtn.style.display !== 'none' && !hintBtn.disabled) {
      hintBtn.click();
    }
  }

  skipWord() {
    const skipBtn = document.getElementById('skip-word-btn');
    if (skipBtn && skipBtn.style.display !== 'none') {
      skipBtn.click();
    }
  }

  selectQuality(quality) {
    const qualityBtn = document.querySelector(`[data-quality="${quality}"]`);
    if (qualityBtn && qualityBtn.style.display !== 'none') {
      qualityBtn.click();
    }
  }

  closeModal() {
    // Close any open modals
    const modals = document.querySelectorAll('.vocab-modal-overlay, .modal, [role="dialog"]');
    modals.forEach(modal => {
      if (modal.style.display !== 'none') {
        const closeBtn = modal.querySelector('.close, .btn-close, [aria-label="Close"]');
        if (closeBtn) {
          closeBtn.click();
        } else if (modal.classList.contains('vocab-modal-overlay')) {
          modal.remove();
        }
      }
    });
  }

  // Focus management for accessibility
  handleFocusIn(e) {
    // Add focus indicators
    if (e.target.matches('.btn, .quality-btn, input, select, textarea')) {
      e.target.setAttribute('data-focused', 'true');
    }
  }

  handleFocusOut(e) {
    e.target.removeAttribute('data-focused');
  }

  // Accessibility helpers
  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Show keyboard shortcut help
  showShortcutHelp() {
    // Check if help modal already exists
    const existingModal = document.querySelector('.keyboard-shortcuts-modal');
    if (existingModal) {
      // Toggle: remove if exists
      existingModal.remove();
      return;
    }
    
    const helpModal = VocabKeyboardHandler.createHelpModal();
    document.body.appendChild(helpModal);
  }

  // Static method for showing help - called from popup.js
  static showHelp() {
    // Check if modal already exists
    const existingModal = document.querySelector('.keyboard-shortcuts-modal');
    
    if (existingModal) {
      // If modal exists, remove it (toggle off)
      existingModal.remove();
    } else {
      // Create new modal if it doesn't exist
      const helpModal = this.createHelpModal();
      document.body.appendChild(helpModal);
    }
  }

  // Static method to create help modal
  static createHelpModal() {
    const modal = document.createElement('div');
    modal.className = 'vocab-modal-overlay keyboard-shortcuts-modal';
    modal.innerHTML = `
      <div class="vocab-modal" role="dialog" aria-labelledby="help-title">
        <div class="vocab-modal-header">
          <h3 id="help-title">⌨️ Keyboard Shortcuts</h3>
          <button class="vocab-close-btn" aria-label="Close">&times;</button>
        </div>
        <div class="vocab-modal-content">
          <div class="shortcut-section">
            <h4>Global Shortcuts</h4>
            <div class="shortcut-list">
              <div class="shortcut-item">
                <kbd>Alt + V</kbd>
                <span>Toggle extension popup</span>
              </div>
              <div class="shortcut-item">
                <kbd>Alt + R</kbd>
                <span>Start review session</span>
              </div>
              <div class="shortcut-item">
                <kbd>Alt + A</kbd>
                <span>Add selected word</span>
              </div>
            </div>
          </div>
          
          <div class="shortcut-section">
            <h4>Review Shortcuts</h4>
            <div class="shortcut-list">
              <div class="shortcut-item">
                <kbd>Enter</kbd>
                <span>Submit answer</span>
              </div>
              <div class="shortcut-item">
                <kbd>Space</kbd>
                <span>Play audio</span>
              </div>
              <div class="shortcut-item">
                <kbd>H</kbd>
                <span>Show hint</span>
              </div>
              <div class="shortcut-item">
                <kbd>S</kbd>
                <span>Skip word</span>
              </div>
              <div class="shortcut-item">
                <kbd>0-5</kbd>
                <span>Select quality rating</span>
              </div>
              <div class="shortcut-item">
                <kbd>Escape</kbd>
                <span>Close modal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Bind close button
    modal.querySelector('.vocab-close-btn').onclick = () => {
      modal.remove();
    };
    
    // Close on overlay click
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    };
    
    return modal;
  }
}

// CSS for keyboard shortcuts help and focus indicators
const keyboardCSS = `
  .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0,0,0,0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }
  
  /* Focus indicators */
  [data-focused="true"] {
    outline: 2px solid #059669 !important;
    outline-offset: 2px !important;
  }
  
  /* Keyboard shortcuts modal - unique styling */
  .keyboard-shortcuts-modal {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(0, 0, 0, 0.7) !important;
    backdrop-filter: blur(8px) !important;
    z-index: 999999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    animation: fadeIn 0.3s ease !important;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .keyboard-shortcuts-modal .vocab-modal {
    background: white !important;
    border-radius: 20px !important;
    box-shadow: 0 25px 50px rgba(5, 150, 105, 0.2), 0 10px 25px rgba(0, 0, 0, 0.15) !important;
    width: 90% !important;
    max-width: 480px !important;
    max-height: 80vh !important;
    overflow-y: auto !important;
    border: 2px solid rgba(5, 150, 105, 0.1) !important;
    transform: scale(0.9) !important;
    animation: modalScale 0.3s ease forwards !important;
    scrollbar-width: none !important; /* Firefox */
    -ms-overflow-style: none !important; /* Internet Explorer 10+ */
  }
  
  /* Hide scrollbar for webkit browsers */
  .keyboard-shortcuts-modal .vocab-modal::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    background: transparent !important;
  }
  
  @keyframes modalScale {
    to { 
      transform: scale(1); 
    }
  }
  
  .keyboard-shortcuts-modal .vocab-modal-header {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
    color: white !important;
    padding: 24px 28px !important;
    border-radius: 18px 18px 0 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    border-bottom: none !important;
  }
  
  .keyboard-shortcuts-modal .vocab-modal-header h3 {
    margin: 0 !important;
    font-size: 20px !important;
    font-weight: 700 !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
  }
  
  .keyboard-shortcuts-modal .vocab-close-btn {
    background: rgba(255, 255, 255, 0.15) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    color: white !important;
    border-radius: 8px !important;
    padding: 8px 12px !important;
    font-size: 18px !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    line-height: 1 !important;
  }
  
  .keyboard-shortcuts-modal .vocab-close-btn:hover {
    background: rgba(255, 255, 255, 0.25) !important;
    transform: scale(1.1) !important;
  }
  
  .keyboard-shortcuts-modal .vocab-modal-content {
    padding: 28px !important;
    background: white !important;
  }
  
  /* Shortcut sections */
  .keyboard-shortcuts-modal .shortcut-section {
    margin-bottom: 32px !important;
  }
  
  .keyboard-shortcuts-modal .shortcut-section:last-child {
    margin-bottom: 0 !important;
  }
  
  .keyboard-shortcuts-modal .shortcut-section h4 {
    font-size: 18px !important;
    font-weight: 700 !important;
    margin-bottom: 16px !important;
    color: #1f2937 !important;
    border-bottom: 2px solid #f3f4f6 !important;
    padding-bottom: 8px !important;
  }
  
  .keyboard-shortcuts-modal .shortcut-list {
    display: flex !important;
    flex-direction: column !important;
    gap: 12px !important;
  }
  
  .keyboard-shortcuts-modal .shortcut-item {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 16px 20px !important;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
    border-radius: 12px !important;
    border: 1px solid #e2e8f0 !important;
    transition: all 0.2s ease !important;
  }
  
  .keyboard-shortcuts-modal .shortcut-item:hover {
    background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%) !important;
    border-color: #059669 !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.1) !important;
  }
  
  .keyboard-shortcuts-modal .shortcut-item kbd {
    background: linear-gradient(135deg, #1f2937 0%, #374151 100%) !important;
    color: white !important;
    padding: 8px 12px !important;
    border-radius: 8px !important;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    border: 1px solid #4b5563 !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5) !important;
    min-width: 45px !important;
    text-align: center !important;
  }
  
  .keyboard-shortcuts-modal .shortcut-item span {
    font-size: 15px !important;
    color: #4b5563 !important;
    font-weight: 500 !important;
    flex: 1 !important;
    margin-left: 16px !important;
  }
  
  /* Dark mode support for keyboard shortcuts modal */
  @media (prefers-color-scheme: dark) {
    .keyboard-shortcuts-modal .vocab-modal {
      background: #1e293b !important;
      border-color: rgba(5, 150, 105, 0.3) !important;
    }
    
    .keyboard-shortcuts-modal .vocab-modal-content {
      background: #1e293b !important;
    }
    
    .keyboard-shortcuts-modal .shortcut-section h4 {
      color: #f1f5f9 !important;
      border-bottom-color: #374151 !important;
    }
    
    .keyboard-shortcuts-modal .shortcut-item {
      background: linear-gradient(135deg, #374151 0%, #475569 100%) !important;
      border-color: #4b5563 !important;
    }
    
    .keyboard-shortcuts-modal .shortcut-item:hover {
      background: linear-gradient(135deg, #065f46 0%, #047857 100%) !important;
      border-color: #10b981 !important;
    }
    
    .keyboard-shortcuts-modal .shortcut-item span {
      color: #d1d5db !important;
    }
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    [data-focused="true"] {
      outline: 3px solid #000 !important;
      background: #ffff00 !important;
    }
    
    .keyboard-shortcuts-modal .shortcut-item kbd {
      background: #000 !important;
      color: #fff !important;
      border-color: #333 !important;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .keyboard-shortcuts-modal {
      animation: none !important;
    }
    
    .keyboard-shortcuts-modal .vocab-modal {
      animation: none !important;
      transform: scale(1) !important;
    }
    
    .keyboard-shortcuts-modal .shortcut-item {
      transition: none !important;
    }
    
    .keyboard-shortcuts-modal .shortcut-item:hover {
      transform: none !important;
    }
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = keyboardCSS;
  document.head.appendChild(style);
}

// Export for use in extension
if (typeof window !== 'undefined') {
  window.VocabKeyboardHandler = VocabKeyboardHandler;
  
  // Auto-initialize if not in content script context
  if (!window.chrome || !chrome.runtime) {
    document.addEventListener('DOMContentLoaded', () => {
      new VocabKeyboardHandler();
    });
  }
}
