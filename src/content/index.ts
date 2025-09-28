// Content script for VocaPi extension
import { VocabWord } from '@/types';
import { DictionaryModal, type WordData } from './DictionaryModal';

// Global variables
let selectedText = '';
let isModalOpen = false;
let wordHighlightingEnabled = true;
let isInitialized = false;

function showSuccessPopup(message: string, duration = 3000) {
  showPopupMessage(message, 'success', duration);
}

function showErrorPopup(message: string, duration = 4000) {
  showPopupMessage(message, 'error', duration);
}

function showPopupMessage(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
  const existingPopup = document.getElementById('vocab-srs-popup-message');
  if (existingPopup) {
    document.body.removeChild(existingPopup);
  }

  const popup = document.createElement('div');
  popup.id = 'vocab-srs-popup-message';
  popup.className = `vocab-srs-popup-message vocab-srs-popup-${type}`;
  let icon = '';
  if (type === 'success') {
    icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22,4 12,14.01 9,11.01"/>
    </svg>`;
  } else if (type === 'error') {
    icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>`;
  } else {
    icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`;
  }
  
  popup.innerHTML = `
    <div class="vocab-srs-popup-content">
      <div class="vocab-srs-popup-icon">${icon}</div>
      <div class="vocab-srs-popup-text">${message}</div>
      <button class="vocab-srs-popup-close">&times;</button>
    </div>
  `;

  // Add styles if not already added
  let styleElement = document.getElementById('vocab-srs-popup-styles');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'vocab-srs-popup-styles';
    styleElement.textContent = `
      /* Toast Notifications */
      .vocab-srs-popup-message {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 10001;
        transform: translateY(50px);
        opacity: 0;
        transition: all 0.3s ease-out;
        max-width: 300px;
      }
      
      .vocab-srs-popup-show {
        transform: translateY(0);
        opacity: 1;
      }
      
      .vocab-srs-popup-success {
        border-left: 4px solid #059669;
        color: #047857;
        background-color: #f0fdfa;
      }
      
      .vocab-srs-popup-error {
        border-left: 4px solid #ef4444;
        color: #dc2626;
        background: white;
      }
      
      .vocab-srs-popup-info {
        border-left: 4px solid #059669;
        color: #047857;
        background-color: #f0fdfa;
      }
      
      .vocab-srs-popup-content {
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
      }
      
      .vocab-srs-popup-icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .vocab-srs-popup-icon svg {
        width: 16px;
        height: 16px;
        stroke-width: 2;
      }
      
      .vocab-srs-popup-text {
        flex: 1;
        font-size: inherit;
        font-weight: inherit;
        line-height: 1.4;
      }
      
      .vocab-srs-popup-close {
        background: none;
        border: none;
        color: currentColor;
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;
        flex-shrink: 0;
        opacity: 0.7;
        margin-left: 8px;
      }
      
      .vocab-srs-popup-close:hover {
        opacity: 1;
        background: rgba(0, 0, 0, 0.1);
      }
      
      .vocab-srs-popup-close:active {
        transform: scale(0.95);
      }
      
      .vocab-srs-popup-message.vocab-srs-closing {
        transform: translateY(50px);
        opacity: 0;
      }
    `;
    document.head.appendChild(styleElement);
  }

  document.body.appendChild(popup);
  
  setTimeout(() => {
    popup.classList.add('vocab-srs-popup-show');
  }, 10);

  const closePopup = () => {
    popup.classList.remove('vocab-srs-popup-show');
    popup.classList.add('vocab-srs-closing');
    setTimeout(() => {
      if (popup.parentNode) {
        document.body.removeChild(popup);
      }
    }, 300);
  };

  const closeBtn = popup.querySelector('.vocab-srs-popup-close');
  closeBtn?.addEventListener('click', closePopup);

  setTimeout(closePopup, duration);

  const handleOutsideClick = (event: MouseEvent) => {
    if (!popup.contains(event.target as Node)) {
      closePopup();
      document.removeEventListener('click', handleOutsideClick);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
  }, 100);
}

function init() {
  try {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    
    injectExtensionStyles();
    loadWordHighlightingSetting();
    attachEventListenersToAllElements();
    chrome.runtime.onMessage.addListener(handleMessage);
    createFloatingButton();
    setupDynamicContentObserver();
    
    setTimeout(() => {
      if (document.readyState === 'complete') {
        const selection = window.getSelection();
        if (selection && selection.toString().trim() && wordHighlightingEnabled) {
          selectedText = selection.toString().trim();
          showFloatingButton();
        }
      }
    }, 1000);
  } catch (error) {
    console.error('VocaPi: Error during initialization:', error);
  }
}

function injectExtensionStyles() {
  const styleId = 'vocab-srs-extension-styles';
  if (document.getElementById(styleId)) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* VocaPi Extension Styles */
    .vocab-srs-floating-btn {
      position: fixed !important;
      z-index: 2147483647 !important;
      display: none !important;
      pointer-events: none !important;
      animation: vocab-srs-float 3s ease-in-out infinite !important;
      will-change: transform !important;
      backface-visibility: hidden !important;
      transform: translateZ(0) !important;
      contain: layout style paint !important;
    }
    
    .vocab-srs-btn {
      background: linear-gradient(135deg, #22c55e, #16a34a) !important;
      color: white !important;
      padding: 10px 16px !important;
      border-radius: 24px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
      cursor: pointer !important;
      pointer-events: all !important;
      transition: all 0.3s ease !important;
      border: none !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      white-space: nowrap !important;
      backdrop-filter: blur(10px) !important;
      min-width: 140px !important;
      min-height: 36px !important;
      position: relative !important;
      isolation: isolate !important;
    }
    
    .vocab-srs-btn:hover {
      transform: translateY(-3px) scale(1.05) !important;
      box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4) !important;
      background: linear-gradient(135deg, #34d399, #22c55e) !important;
    }
    
    .vocab-srs-btn:active {
      transform: translateY(-1px) scale(1.02) !important;
    }
    
    /* Modal Styles */
    .vocab-srs-modal {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 10001 !important;
      animation: vocab-srs-fadeIn 0.3s ease-out !important;
    }
    
    .vocab-srs-modal-overlay {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0, 0, 0, 0.6) !important;
      backdrop-filter: blur(8px) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
    }
    
    .vocab-srs-modal-content {
      background: white !important;
      border-radius: 16px !important;
      width: 100% !important;
      max-width: 420px !important;
      max-height: 90vh !important;
      overflow-y: auto !important;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25) !important;
      border: 1px solid #e5e7eb !important;
      animation: vocab-srs-slideUp 0.4s ease-out !important;
    }
    
    .vocab-srs-modal-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 24px 28px !important;
      border-bottom: 1px solid #e5e7eb !important;
    }
    
    .vocab-srs-modal-header h3 {
      margin: 0 !important;
      font-size: 20px !important;
      font-weight: 600 !important;
      background: linear-gradient(135deg, #22c55e, #16a34a) !important;
      -webkit-background-clip: text !important;
      background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
    }
    
    .vocab-srs-modal-close {
      background: none !important;
      border: none !important;
      font-size: 24px !important;
      color: #6b7280 !important;
      cursor: pointer !important;
      padding: 8px !important;
      border-radius: 8px !important;
      transition: all 0.2s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    
    .vocab-srs-modal-close:hover {
      color: #374151 !important;
      background: #f3f4f6 !important;
      transform: scale(1.1) !important;
    }
    
    .vocab-srs-modal-body {
      padding: 28px !important;
    }
    
    .vocab-srs-form-group {
      margin-bottom: 24px !important;
    }
    
    .vocab-srs-form-group label {
      display: block !important;
      margin-bottom: 8px !important;
      font-weight: 500 !important;
      color: #374151 !important;
      font-size: 14px !important;
    }
    
    .vocab-srs-form-group input,
    .vocab-srs-form-group select {
      width: 100% !important;
      padding: 12px 16px !important;
      border: 2px solid #e5e7eb !important;
      border-radius: 10px !important;
      font-size: 14px !important;
      transition: all 0.2s ease !important;
      background: white !important;
      color: #374151 !important;
      font-family: inherit !important;
      box-sizing: border-box !important;
    }
    
    .vocab-srs-form-group input:focus,
    .vocab-srs-form-group select:focus {
      outline: none !important;
      border-color: #22c55e !important;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1) !important;
    }
    
    .vocab-srs-form-group input:read-only {
      background: #f9fafb !important;
      cursor: default !important;
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .vocab-srs-modal-content {
        background: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      .vocab-srs-modal-header {
        border-bottom-color: #374151 !important;
      }
      
      .vocab-srs-modal-close {
        color: #9ca3af !important;
      }
      
      .vocab-srs-modal-close:hover {
        color: #d1d5db !important;
        background: #374151 !important;
      }
      
      .vocab-srs-form-group label {
        color: #d1d5db !important;
      }
      
      .vocab-srs-form-group input,
      .vocab-srs-form-group select {
        background: #374151 !important;
        border-color: #4b5563 !important;
        color: #d1d5db !important;
      }
      
      .vocab-srs-form-group input:read-only {
        background: #2d3748 !important;
      }
    }
    
    /* Animations */
    @keyframes vocab-srs-float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }
    
    @keyframes vocab-srs-fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes vocab-srs-slideUp {
      from {
        transform: translateY(30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  
  document.head.appendChild(style);
}

// Load word highlighting setting from storage
async function loadWordHighlightingSetting() {
  try {
    const result = await chrome.storage.local.get(['settings']);
    const settings = result.settings;
    wordHighlightingEnabled = settings?.notifications ?? true;
  } catch (error) {
    wordHighlightingEnabled = true;
  }
}

function attachEventListenersToAllElements() {
  document.removeEventListener('mouseup', handleTextSelection);
  document.removeEventListener('keyup', handleTextSelection);
  document.removeEventListener('touchend', handleTextSelection);
  document.removeEventListener('click', handleTextSelection);
  document.removeEventListener('selectionchange', handleTextSelection);
  window.removeEventListener('scroll', handleScrollAndCheck);
  
  document.addEventListener('mouseup', handleTextSelection, true);
  document.addEventListener('keyup', handleTextSelection, true);
  document.addEventListener('touchend', handleTextSelection, true);
  document.addEventListener('click', handleTextSelection, true);
  document.addEventListener('selectionchange', handleTextSelection, true);
  
  window.addEventListener('scroll', handleScrollAndCheck, { passive: true });
  window.addEventListener('resize', handleScrollAndCheck, { passive: true });
}

function handleScrollAndCheck() {
  clearTimeout((window as any).vocapiScrollTimeout);
  (window as any).vocapiScrollTimeout = setTimeout(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() && wordHighlightingEnabled) {
      selectedText = selection.toString().trim();
      showFloatingButton();
    }
  }, 100);
}

function setupDynamicContentObserver() {
  const observer = new MutationObserver((mutations) => {
    let hasSignificantChanges = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE && (node as Element).children.length > 0) {
              hasSignificantChanges = true;
              break;
            }
          }
        }
        
        if (mutation.removedNodes.length > 0) {
          hasSignificantChanges = true;
        }
      }
      
      if (mutation.type === 'attributes' && 
          ['class', 'style', 'hidden'].includes(mutation.attributeName || '')) {
        hasSignificantChanges = true;
      }
    });
    
    if (hasSignificantChanges) {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim() && wordHighlightingEnabled) {
          selectedText = selection.toString().trim();
          showFloatingButton();
        }
      }, 150);
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden'],
    characterData: false
  });
}

function handleTextSelection(event?: Event) {
  try {
    if (event && event.target) {
      const target = event.target as Element;
      if (target.closest('#vocab-srs-floating-btn') || 
          target.closest('#vocab-srs-modal') || 
          target.id === 'vocab-srs-floating-btn' ||
          target.id === 'vocab-srs-modal') {
        return;
      }
    }
    
    if (!wordHighlightingEnabled) {
      hideFloatingButton();
      selectedText = '';
      return;
    }
    
    clearTimeout((window as any).vocapiSelectionTimeout);
    
    (window as any).vocapiSelectionTimeout = setTimeout(() => {
      try {
        const selection = window.getSelection();
        const selectionText = selection ? selection.toString().trim() : '';
        
        if (selection && selectionText && selection.rangeCount > 0) {
          selectedText = selectionText;
          showFloatingButton();
        } else {
          if (!isModalOpen) {
            selectedText = '';
            hideFloatingButton();
          }
        }
      } catch (error) {
        console.error('VocaPi: Error in selection timeout handler:', error);
      }
    }, 10);
  } catch (error) {
    console.error('VocaPi: Error in handleTextSelection:', error);
  }
}

function createFloatingButton() {
  const existingButton = document.getElementById('vocab-srs-floating-btn');
  if (existingButton) {
    return existingButton;
  }
  
  const button = document.createElement('div');
  button.id = 'vocab-srs-floating-btn';
  button.className = 'vocab-srs-floating-btn';
  
  button.setAttribute('role', 'button');
  button.setAttribute('tabindex', '0');
  button.setAttribute('aria-label', 'Add selected word to dictionary');
  
  button.innerHTML = `
    <div class="vocab-srs-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      <span>Add to Dictionary</span>
    </div>
  `;
  
  button.style.display = 'none';
  button.style.position = 'fixed';
  button.style.zIndex = '2147483647';
  button.style.pointerEvents = 'none';
  
  document.body.appendChild(button);
  
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showAddModal(selectedText);
  });
  
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      showAddModal(selectedText);
    }
  });
  
  return button;
}

function showFloatingButton() {
  if (!wordHighlightingEnabled) {
    return;
  }
  
  // Don't show floating button when modal is open
  if (isModalOpen) {
    hideFloatingButton();
    return;
  }
  
  const selection = window.getSelection();
  
  if (!selection || selection.toString().trim() === '') {
    hideFloatingButton();
    return;
  }
  
  const selectionText = selection.toString().trim();
  
  let button = document.getElementById('vocab-srs-floating-btn');
  if (!button) {
    button = createFloatingButton();
  }
  
  if (!button) {
    return;
  }
  
  if (selection.rangeCount === 0) {
    hideFloatingButton();
    return;
  }
  
  try {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    if (rect.width === 0 && rect.height === 0) {
      hideFloatingButton();
      return;
    }
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = rect.left + (rect.width / 2) - 75;
    let top = rect.bottom + 8;
    
    if (left < 10) left = 10;
    if (left + 150 > viewportWidth - 10) left = viewportWidth - 160;
    if (top > viewportHeight - 50) top = rect.top - 50;
    if (top < 10) top = 10;
    
    button.style.cssText = `
      display: flex !important;
      position: fixed !important;
      left: ${left}px !important;
      top: ${top}px !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      z-index: 2147483647 !important;
      width: 150px !important;
      height: 40px !important;
      background: var(--vocab-srs-primary, #22c55e) !important;
      color: white !important;
      border-radius: 8px !important;
      border: none !important;
      cursor: pointer !important;
      transform: translateZ(0) !important;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      padding: 0 12px !important;
    `;
    
    button.offsetHeight;
    selectedText = selectionText;
    
  } catch (error) {
    hideFloatingButton();
  }
}

function hideFloatingButton() {
  const button = document.getElementById('vocab-srs-floating-btn');
  if (button) {
    button.style.display = 'none';
    button.style.visibility = 'hidden';
    button.style.opacity = '0';
    button.style.pointerEvents = 'none';
  }
}

// Fetch word data from API
async function fetchWordData(word: string): Promise<{ phonetic: string; pronunUrl: string }> {
  const fallbackData = {
    phonetic: generateSimplePhonetic(word),
    pronunUrl: ''
  };

  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { 
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    clearTimeout(timeoutId);
    
    if (response.ok && response.status === 200) {
      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        
        // Extract phonetic with multiple fallbacks
        let phonetic = '';
        if (entry.phonetic) {
          phonetic = entry.phonetic;
        } else if (entry.phonetics && Array.isArray(entry.phonetics)) {
          // Try to find phonetic with text
          for (const phoneticEntry of entry.phonetics) {
            if (phoneticEntry.text && phoneticEntry.text.trim()) {
              phonetic = phoneticEntry.text;
              break;
            }
          }
        }
        
        // Extract audio URL with multiple fallbacks
        let audioUrl = '';
        if (entry.phonetics && Array.isArray(entry.phonetics)) {
          for (const phoneticEntry of entry.phonetics) {
            if (phoneticEntry.audio && phoneticEntry.audio.trim()) {
              audioUrl = phoneticEntry.audio;
              break;
            }
          }
        }
        
        return {
          phonetic: phonetic || fallbackData.phonetic,
          pronunUrl: audioUrl || ''
        };
      }
    }
    
    return fallbackData;
    
  } catch (error) {
    return fallbackData;
  }
}

// Simple phonetic generation fallback
function generateSimplePhonetic(word: string): string {
  // This is a very basic phonetic approximation
  // In a real app, you'd want a proper phonetic library
  return `/${word.toLowerCase()}/`;
}

// Play audio for a word with given audio URL
function playWordAudio(word: string, pronunUrl: string): void {
  // Try to play from pronunUrl first
  if (pronunUrl && pronunUrl.trim() !== '') {
    const audio = new Audio(pronunUrl);
    audio.play().catch(() => {
      // Fallback to TTS if audio URL fails
      playTextToSpeech(word);
    });
  } else {
    // Use TTS if no audio URL available
    playTextToSpeech(word);
  }
}

// Play text-to-speech for a word
function playTextToSpeech(word: string): void {
  if ('speechSynthesis' in window) {
    try {
      // Cancel any existing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.volume = 0.8;
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      // Silent fail
    }
  }
}

// Custom confirmation dialog
interface ConfirmDialogOptions {
  title: string;
  message: string;
  existingMeanings: string[];
  newMeaning: string;
  confirmText: string;
  cancelText: string;
}

function showCustomConfirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'vocab-srs-confirm-modal';
    modal.className = 'vocab-srs-modal';
    
    modal.innerHTML = `
      <div class="vocab-srs-modal-overlay">
        <div class="vocab-srs-modal-content vocab-srs-confirm-dialog">
          <div class="vocab-srs-modal-header">
            <h3>${options.title}</h3>
          </div>
          <div class="vocab-srs-modal-body">
            <div class="vocab-srs-confirm-message">
              <p>${options.message}</p>
            </div>
            
            <div class="vocab-srs-existing-meanings">
              <div class="vocab-srs-meanings-label">Existing meanings:</div>
              <ul class="vocab-srs-meanings-list">
                ${options.existingMeanings.map(meaning => `<li>• ${meaning}</li>`).join('')}
              </ul>
            </div>
            
            <div class="vocab-srs-new-meaning">
              <div class="vocab-srs-new-meaning-label">New meaning to add:</div>
              <div class="vocab-srs-new-meaning-text">"${options.newMeaning}"</div>
            </div>
            
            <div class="vocab-srs-confirm-question">
              <div class="vocab-srs-question-icon">❓</div>
              <div class="vocab-srs-question-text">Do you want to proceed with adding this new meaning?</div>
            </div>
          </div>
          <div class="vocab-srs-modal-footer">
            <button class="vocab-srs-btn-cancel" data-action="cancel">${options.cancelText}</button>
            <button class="vocab-srs-btn-confirm" data-action="confirm">${options.confirmText}</button>
          </div>
        </div>
      </div>
    `;

    // Add custom styles for confirm dialog
    const confirmStyle = document.createElement('style');
    confirmStyle.id = 'vocab-srs-confirm-styles';
    confirmStyle.textContent = `
      .vocab-srs-confirm-dialog {
        max-width: 480px !important;
      }
      
      .vocab-srs-confirm-message {
        margin-bottom: 20px !important;
        font-size: 15px !important;
        color: #374151 !important;
      }
      
      .vocab-srs-existing-meanings {
        background: #f8fafc !important;
        border: 2px solid #e2e8f0 !important;
        border-radius: 12px !important;
        padding: 16px !important;
        margin: 16px 0 !important;
      }
      
      .vocab-srs-meanings-label {
        font-weight: 600 !important;
        color: #475569 !important;
        font-size: 14px !important;
        margin-bottom: 8px !important;
      }
      
      .vocab-srs-meanings-list {
        list-style: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      
      .vocab-srs-meanings-list li {
        padding: 4px 0 !important;
        color: #64748b !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
      }
      
      .vocab-srs-new-meaning {
        background: linear-gradient(135deg, #ecfdf5, #f0fdf4) !important;
        border: 2px solid #22c55e !important;
        border-radius: 12px !important;
        padding: 16px !important;
        margin: 16px 0 !important;
      }
      
      .vocab-srs-new-meaning-label {
        font-weight: 600 !important;
        color: #16a34a !important;
        font-size: 14px !important;
        margin-bottom: 8px !important;
      }
      
      .vocab-srs-new-meaning-text {
        font-size: 15px !important;
        color: #15803d !important;
        font-weight: 500 !important;
        font-style: italic !important;
      }
      
      .vocab-srs-confirm-question {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        margin: 20px 0 !important;
        padding: 16px !important;
        background: #fef3c7 !important;
        border: 2px solid #f59e0b !important;
        border-radius: 12px !important;
      }
      
      .vocab-srs-question-icon {
        font-size: 24px !important;
        flex-shrink: 0 !important;
      }
      
      .vocab-srs-question-text {
        font-size: 15px !important;
        font-weight: 500 !important;
        color: #92400e !important;
      }
      
      .vocab-srs-btn-confirm {
        background: linear-gradient(135deg, #22c55e, #16a34a) !important;
        color: white !important;
        box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3) !important;
        border-radius: 10px !important;
      }
      
      .vocab-srs-btn-confirm:hover {
        background: linear-gradient(135deg, #34d399, #22c55e) !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4) !important;
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .vocab-srs-confirm-message {
          color: #d1d5db !important;
        }
        
        .vocab-srs-existing-meanings {
          background: #374151 !important;
          border-color: #4b5563 !important;
        }
        
        .vocab-srs-meanings-label {
          color: #d1d5db !important;
        }
        
        .vocab-srs-meanings-list li {
          color: #9ca3af !important;
        }
        
        .vocab-srs-new-meaning {
          background: linear-gradient(135deg, #064e3b, #065f46) !important;
          border-color: #059669 !important;
        }
        
        .vocab-srs-new-meaning-label {
          color: #34d399 !important;
        }
        
        .vocab-srs-new-meaning-text {
          color: #6ee7b7 !important;
        }
        
        .vocab-srs-confirm-question {
          background: #451a03 !important;
          border-color: #d97706 !important;
        }
        
        .vocab-srs-question-text {
          color: #fbbf24 !important;
        }
      }
    `;

    document.head.appendChild(confirmStyle);
    document.body.appendChild(modal);

    // Add event listeners
    const handleAction = (action: string) => {
      // Remove modal and styles
      document.body.removeChild(modal);
      document.head.removeChild(confirmStyle);
      
      // Resolve promise based on action
      resolve(action === 'confirm');
    };

    // Button event listeners
    modal.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;
      if (action) {
        handleAction(action);
      }
    });

    // Close on overlay click
    modal.querySelector('.vocab-srs-modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        handleAction('cancel');
      }
    });

    // ESC key to cancel
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        document.removeEventListener('keydown', handleEscKey);
        handleAction('cancel');
      }
    };

    document.addEventListener('keydown', handleEscKey);

    // Focus on confirm button
    setTimeout(() => {
      const confirmBtn = modal.querySelector('.vocab-srs-btn-confirm') as HTMLElement;
      confirmBtn?.focus();
    }, 100);
  });
}

// Custom error dialog
interface ErrorDialogOptions {
  title: string;
  message: string;
  details: string;
  suggestion: string;
  buttonText: string;
}

function showCustomErrorDialog(options: ErrorDialogOptions): Promise<void> {
  return new Promise((resolve) => {
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'vocab-srs-error-modal';
    modal.className = 'vocab-srs-modal';
    
    modal.innerHTML = `
      <div class="vocab-srs-modal-overlay">
        <div class="vocab-srs-modal-content vocab-srs-error-dialog">
          <div class="vocab-srs-modal-header">
            <h3>${options.title}</h3>
          </div>
          <div class="vocab-srs-modal-body">
            <div class="vocab-srs-error-content">
              <div class="vocab-srs-error-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              
              <div class="vocab-srs-error-message">
                <p>${options.message}</p>
              </div>
              
              <div class="vocab-srs-error-details">
                <div class="vocab-srs-details-label">Details:</div>
                <div class="vocab-srs-details-text">${options.details}</div>
              </div>
              
              <div class="vocab-srs-error-suggestion">
                <div class="vocab-srs-suggestion-icon">💡</div>
                <div class="vocab-srs-suggestion-text">${options.suggestion}</div>
              </div>
            </div>
          </div>
          <div class="vocab-srs-modal-footer">
            <button class="vocab-srs-btn-ok" data-action="ok">${options.buttonText}</button>
          </div>
        </div>
      </div>
    `;

    // Add custom styles for error dialog
    const errorStyle = document.createElement('style');
    errorStyle.id = 'vocab-srs-error-styles';
    errorStyle.textContent = `
      .vocab-srs-error-dialog {
        max-width: 450px !important;
      }
      
      .vocab-srs-error-content {
        text-align: center !important;
      }
      
      .vocab-srs-error-icon {
        margin: 0 auto 20px !important;
        width: 64px !important;
        height: 64px !important;
        background: linear-gradient(135deg, #fef2f2, #fee2e2) !important;
        border: 3px solid #f87171 !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      .vocab-srs-error-icon svg {
        color: #dc2626 !important;
        width: 32px !important;
        height: 32px !important;
      }
      
      .vocab-srs-error-message {
        margin-bottom: 20px !important;
        font-size: 16px !important;
        color: #374151 !important;
        line-height: 1.5 !important;
      }
      
      .vocab-srs-error-details {
        background: #fef2f2 !important;
        border: 2px solid #fecaca !important;
        border-radius: 12px !important;
        padding: 16px !important;
        margin: 16px 0 !important;
        text-align: left !important;
      }
      
      .vocab-srs-details-label {
        font-weight: 600 !important;
        color: #dc2626 !important;
        font-size: 14px !important;
        margin-bottom: 8px !important;
      }
      
      .vocab-srs-details-text {
        font-size: 14px !important;
        color: #991b1b !important;
        font-style: italic !important;
      }
      
      .vocab-srs-error-suggestion {
        background: linear-gradient(135deg, #fffbeb, #fef3c7) !important;
        border: 2px solid #fbbf24 !important;
        border-radius: 12px !important;
        padding: 16px !important;
        margin: 16px 0 !important;
        display: flex !important;
        align-items: flex-start !important;
        gap: 12px !important;
        text-align: left !important;
      }
      
      .vocab-srs-suggestion-icon {
        font-size: 20px !important;
        flex-shrink: 0 !important;
        margin-top: 2px !important;
      }
      
      .vocab-srs-suggestion-text {
        font-size: 14px !important;
        color: #92400e !important;
        line-height: 1.4 !important;
      }
      
      .vocab-srs-btn-ok {
        background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
        color: white !important;
        padding: 12px 32px !important;
        border-radius: 10px !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.3s ease !important;
        border: none !important;
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3) !important;
        min-width: 120px !important;
      }
      
      .vocab-srs-btn-ok:hover {
        background: linear-gradient(135deg, #60a5fa, #3b82f6) !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4) !important;
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .vocab-srs-error-message {
          color: #d1d5db !important;
        }
        
        .vocab-srs-error-icon {
          background: linear-gradient(135deg, #450a0a, #7f1d1d) !important;
          border-color: #ef4444 !important;
        }
        
        .vocab-srs-error-icon svg {
          color: #f87171 !important;
        }
        
        .vocab-srs-error-details {
          background: #450a0a !important;
          border-color: #dc2626 !important;
        }
        
        .vocab-srs-details-label {
          color: #f87171 !important;
        }
        
        .vocab-srs-details-text {
          color: #fca5a5 !important;
        }
        
        .vocab-srs-error-suggestion {
          background: linear-gradient(135deg, #451a03, #78350f) !important;
          border-color: #d97706 !important;
        }
        
        .vocab-srs-suggestion-text {
          color: #fbbf24 !important;
        }
      }
    `;

    document.head.appendChild(errorStyle);
    document.body.appendChild(modal);

    // Add event listeners
    const handleAction = () => {
      // Remove modal and styles
      document.body.removeChild(modal);
      document.head.removeChild(errorStyle);
      
      // Resolve promise
      resolve();
    };

    // Button event listener
    modal.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.dataset.action === 'ok') {
        handleAction();
      }
    });

    // Close on overlay click
    modal.querySelector('.vocab-srs-modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        handleAction();
      }
    });

    // ESC key to close
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        document.removeEventListener('keydown', handleEscKey);
        handleAction();
      }
    };

    document.addEventListener('keydown', handleEscKey);

    // Focus on OK button
    setTimeout(() => {
      const okBtn = modal.querySelector('.vocab-srs-btn-ok') as HTMLElement;
      okBtn?.focus();
    }, 100);
  });
}

// Show add modal
function showAddModal(word?: string) {
  if (isModalOpen) return;
  
  isModalOpen = true;
  
  // Hide floating button when modal opens
  hideFloatingButton();
  
  // Create and show dictionary modal
  const dictionaryModal = new DictionaryModal({
    word,
    onSave: async (wordData: WordData) => {
      console.log('Content Script: onSave called with:', wordData);
      try {
        // Convert WordData to VocabWord format
        const vocabWord: VocabWord = {
          id: Date.now().toString(),
          word: wordData.word,
          meaning: wordData.meaning,
          phonetic: wordData.phonetic,
          pronunUrl: wordData.audioUrl || '',
          wordType: wordData.wordType as VocabWord['wordType'],
          example: wordData.example,
          audioUrl: wordData.audioUrl,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          
          // SRS defaults
          interval: 1,
          repetitions: 0,
          easeFactor: 2.5,
          nextReview: Date.now(),
          quality: 0,
          
          // Analytics defaults
          totalReviews: 0,
          correctReviews: 0
        };
        
        // Use direct storage save for faster performance (skip service worker)
        console.log('Content Script: Saving directly to storage for faster response:', vocabWord);
        
        const result = await chrome.storage.local.get(['vocabWords']);
        const existingWords = result.vocabWords || [];
        
        // Check if word already exists
        const existingWord = existingWords.find((w: any) => 
          w.word.toLowerCase() === vocabWord.word.toLowerCase() &&
          w.meaning.toLowerCase() === vocabWord.meaning.toLowerCase()
        );
        
        let response;
        if (existingWord) {
          // Show confirmation for existing word
          const confirmed = await showCustomConfirmDialog({
            title: 'Word Already Exists',
            message: `The word "${vocabWord.word}" is already in your dictionary.`,
            existingMeanings: [existingWord.meaning],
            newMeaning: vocabWord.meaning,
            confirmText: 'Update Word',
            cancelText: 'Cancel'
          });
          
          if (!confirmed) {
            return; // User cancelled
          }
          
          // Update existing word
          const wordIndex = existingWords.findIndex((w: any) => w.id === existingWord.id);
          existingWords[wordIndex] = {
            ...existingWords[wordIndex],
            meaning: vocabWord.meaning,
            phonetic: vocabWord.phonetic,
            wordType: vocabWord.wordType,
            example: vocabWord.example,
            audioUrl: vocabWord.audioUrl,
            pronunUrl: vocabWord.pronunUrl,
            updatedAt: Date.now()
          };
          await chrome.storage.local.set({ vocabWords: existingWords });
          response = { success: true, word: existingWords[wordIndex] };
        } else {
          // Add new word
          existingWords.push(vocabWord);
          await chrome.storage.local.set({ vocabWords: existingWords });
          response = { success: true, word: vocabWord };
        }
        
        console.log('Content Script: Direct save completed:', response);
        
        if (response && response.success) {
          const isUpdate = existingWord ? 'updated' : 'added';
          showSuccessPopup(`Word "${vocabWord.word}" ${isUpdate} successfully!`);
          hideFloatingButton();
          
          // Clear selection
          if (window.getSelection) {
            window.getSelection()?.removeAllRanges();
          }
          selectedText = '';
        } else {
          showErrorPopup('Failed to save word. Please try again.');
        }
      } catch (error) {
        console.error('Error saving word:', error);
        showErrorPopup('Failed to save word. Please check your internet connection and try again.');
      }
    },
    onClose: () => {
      isModalOpen = false;
    }
  });
  
  dictionaryModal.show();
}

// Handle messages from popup
function handleMessage(message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
  switch (message.type) {
    case 'GET_SELECTED_TEXT':
      sendResponse({ text: selectedText });
      break;
      
    case 'SHOW_ADD_MODAL':
      showAddModal(message.data?.word);
      sendResponse({ success: true });
      break;
      
    case 'SHOW_SUCCESS_MESSAGE':
      showSuccessPopup(message.data?.message, message.data?.duration);
      sendResponse({ success: true });
      break;
      
    case 'SHOW_ERROR_MESSAGE':
      showErrorPopup(message.data?.message, message.data?.duration);
      sendResponse({ success: true });
      break;
      
    case 'TOGGLE_WORD_HIGHLIGHTING':
      wordHighlightingEnabled = message.data?.enabled ?? true;
      if (!wordHighlightingEnabled) {
        hideFloatingButton();
        // Clear any existing selection
        if (window.getSelection) {
          window.getSelection()?.removeAllRanges();
        }
        // Clear selected text to prevent showing button again
        selectedText = '';
      }
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
}

// Initialize when DOM is ready
function initializeContentScript() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

// Also initialize on window load to catch any late-loading content
window.addEventListener('load', () => {
  if (!isInitialized) {
    init();
  }
});

// Initialize immediately
initializeContentScript();
