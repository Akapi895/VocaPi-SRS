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
    outline: 2px solid #4f46e5 !important;
    outline-offset: 2px !important;
  }
  
  /* Keyboard shortcut help styles */
  .shortcut-section {
    margin-bottom: 24px;
  }
  
  .shortcut-section h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #374151;
  }
  
  .shortcut-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .shortcut-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f9fafb;
    border-radius: 6px;
  }
  
  .shortcut-item kbd {
    background: #374151;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid #6b7280;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
  
  .shortcut-item span {
    font-size: 14px;
    color: #6b7280;
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    [data-focused="true"] {
      outline: 3px solid #000 !important;
      background: #ffff00 !important;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .vocab-modal {
      animation: none !important;
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
