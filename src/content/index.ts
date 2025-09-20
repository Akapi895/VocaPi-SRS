// Content script for VocaPi extension
import { VocabWord } from '@/types';

// Global variables
let selectedText = '';
let isModalOpen = false;

// Initialize content script
function init() {
  // Listen for text selection
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keyup', handleTextSelection);
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Add floating button when text is selected
  createFloatingButton();
}

// Handle text selection
function handleTextSelection() {
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    selectedText = selection.toString().trim();
    showFloatingButton();
  } else {
    hideFloatingButton();
  }
}

// Create floating button
function createFloatingButton() {
  const button = document.createElement('div');
  button.id = 'vocab-srs-floating-btn';
  button.innerHTML = `
    <div class="vocab-srs-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      <span>Add to Dictionary</span>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #vocab-srs-floating-btn {
      position: fixed;
      z-index: 10000;
      display: none;
      pointer-events: none;
    }
    
    .vocab-srs-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      pointer-events: all;
      transition: all 0.2s ease;
      border: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .vocab-srs-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    
    .vocab-srs-btn:active {
      transform: translateY(0);
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(button);
  
  // Add click handler
  button.addEventListener('click', () => {
    showAddModal(selectedText);
  });
}

// Show floating button
function showFloatingButton() {
  const button = document.getElementById('vocab-srs-floating-btn');
  if (button) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      button.style.display = 'block';
      button.style.left = `${rect.left + window.scrollX}px`;
      button.style.top = `${rect.bottom + window.scrollY + 5}px`;
    }
  }
}

// Hide floating button
function hideFloatingButton() {
  const button = document.getElementById('vocab-srs-floating-btn');
  if (button) {
    button.style.display = 'none';
  }
}

// Show add modal
function showAddModal(word?: string) {
  if (isModalOpen) return;
  
  isModalOpen = true;
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'vocab-srs-modal';
  modal.innerHTML = `
    <div class="vocab-srs-modal-overlay">
      <div class="vocab-srs-modal-content">
        <div class="vocab-srs-modal-header">
          <h3>Add to Dictionary</h3>
          <button class="vocab-srs-modal-close">&times;</button>
        </div>
        <div class="vocab-srs-modal-body">
          <div class="vocab-srs-form-group">
            <label>Word</label>
            <input type="text" id="vocab-word" value="${word || ''}" placeholder="Enter word">
          </div>
          <div class="vocab-srs-form-group">
            <label>Meaning</label>
            <input type="text" id="vocab-meaning" placeholder="Enter meaning">
          </div>
          <div class="vocab-srs-form-group">
            <label>Example (optional)</label>
            <input type="text" id="vocab-example" placeholder="Enter example sentence">
          </div>
          <div class="vocab-srs-form-group">
            <label>Phonetic (optional)</label>
            <input type="text" id="vocab-phonetic" placeholder="Enter phonetic">
          </div>
        </div>
        <div class="vocab-srs-modal-footer">
          <button class="vocab-srs-btn-cancel">Cancel</button>
          <button class="vocab-srs-btn-save">Save to Dictionary</button>
        </div>
      </div>
    </div>
  `;
  
  // Add modal styles
  const style = document.createElement('style');
  style.textContent = `
    #vocab-srs-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10001;
    }
    
    .vocab-srs-modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .vocab-srs-modal-content {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 400px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }
    
    .vocab-srs-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .vocab-srs-modal-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .vocab-srs-modal-close {
      background: none;
      border: none;
      font-size: 24px;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .vocab-srs-modal-close:hover {
      color: #374151;
    }
    
    .vocab-srs-modal-body {
      padding: 24px;
    }
    
    .vocab-srs-form-group {
      margin-bottom: 20px;
    }
    
    .vocab-srs-form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #374151;
      font-size: 14px;
    }
    
    .vocab-srs-form-group input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    
    .vocab-srs-form-group input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .vocab-srs-modal-footer {
      display: flex;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
    }
    
    .vocab-srs-btn-cancel,
    .vocab-srs-btn-save {
      flex: 1;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .vocab-srs-btn-cancel {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    
    .vocab-srs-btn-cancel:hover {
      background: #e5e7eb;
    }
    
    .vocab-srs-btn-save {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
    }
    
    .vocab-srs-btn-save:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    
    .vocab-srs-btn-save:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(modal);
  
  // Add event listeners
  const closeBtn = modal.querySelector('.vocab-srs-modal-close');
  const cancelBtn = modal.querySelector('.vocab-srs-btn-cancel');
  const saveBtn = modal.querySelector('.vocab-srs-btn-save');
  
  const closeModal = () => {
    document.body.removeChild(modal);
    document.head.removeChild(style);
    isModalOpen = false;
  };
  
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  
  saveBtn?.addEventListener('click', async () => {
    const wordInput = modal.querySelector('#vocab-word') as HTMLInputElement;
    const meaningInput = modal.querySelector('#vocab-meaning') as HTMLInputElement;
    const exampleInput = modal.querySelector('#vocab-example') as HTMLInputElement;
    const phoneticInput = modal.querySelector('#vocab-phonetic') as HTMLInputElement;
    
    const word = wordInput?.value.trim();
    const meaning = meaningInput?.value.trim();
    
    if (!word || !meaning) {
      alert('Please fill in both word and meaning');
      return;
    }
    
    const newWord: VocabWord = {
      id: `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      word,
      meaning,
      example: exampleInput?.value.trim() || undefined,
      phonetic: phoneticInput?.value.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
      nextReview: Date.now(),
      quality: 0,
      totalReviews: 0,
      correctReviews: 0
    };
    
    try {
      // Save to storage
      const result = await chrome.storage.local.get(['vocabWords']);
      const existingWords = result.vocabWords || [];
      existingWords.push(newWord);
      
      await chrome.storage.local.set({ vocabWords: existingWords });
      
      // Show success message
      alert('Word added to dictionary successfully!');
      closeModal();
      
      // Hide floating button
      hideFloatingButton();
      
    } catch (error) {
      console.error('Failed to save word:', error);
      alert('Failed to save word. Please try again.');
    }
  });
  
  // Close on overlay click
  modal.querySelector('.vocab-srs-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  });
  
  // Focus on meaning input
  setTimeout(() => {
    const meaningInput = modal.querySelector('#vocab-meaning') as HTMLInputElement;
    meaningInput?.focus();
  }, 100);
}

// Handle messages from popup
function handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
  switch (message.type) {
    case 'GET_SELECTED_TEXT':
      sendResponse({ text: selectedText });
      break;
      
    case 'SHOW_ADD_MODAL':
      showAddModal(message.data?.word);
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
