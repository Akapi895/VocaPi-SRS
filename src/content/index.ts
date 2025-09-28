// Content script for VocaPi extension
import { VocabWord } from '@/types';

// Global variables
let selectedText = '';
let isModalOpen = false;
let wordHighlightingEnabled = true;
let isInitialized = false;

// Show success popup message
function showSuccessPopup(message: string, duration = 3000) {
  showPopupMessage(message, 'success', duration);
}

// Show error popup message  
function showErrorPopup(message: string, duration = 4000) {
  showPopupMessage(message, 'error', duration);
}

// Generic popup message function
function showPopupMessage(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
  // Remove any existing popup message
  const existingPopup = document.getElementById('vocab-srs-popup-message');
  if (existingPopup) {
    document.body.removeChild(existingPopup);
  }

  // Create popup message element
  const popup = document.createElement('div');
  popup.id = 'vocab-srs-popup-message';
  popup.className = `vocab-srs-popup-message vocab-srs-popup-${type}`;
  
  // Choose icon based on type
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
      .vocab-srs-popup-message {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 10002;
        min-width: 340px;
        max-width: 450px;
        border-radius: 16px;
        box-shadow: 0 16px 60px rgba(0, 0, 0, 0.12), 0 8px 30px rgba(0, 0, 0, 0.08);
        backdrop-filter: blur(16px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.18);
        animation: vocab-srs-slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
        transform-origin: top right;
      }
      
      .vocab-srs-popup-success {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%);
        color: white;
        border-left: 4px solid #34d399;
      }
      
      .vocab-srs-popup-error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%);
        color: white;
        border-left: 4px solid #f87171;
      }
      
      .vocab-srs-popup-info {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%);
        color: white;
        border-left: 4px solid #34d399;
      }
      
      .vocab-srs-popup-content {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 20px 24px;
        position: relative;
      }
      
      .vocab-srs-popup-icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 10px;
        backdrop-filter: blur(8px);
        margin-top: 2px;
      }
      
      .vocab-srs-popup-icon svg {
        width: 18px;
        height: 18px;
        stroke-width: 2.5;
      }
      
      .vocab-srs-popup-text {
        flex: 1;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.5;
        margin-top: 4px;
        letter-spacing: -0.01em;
      }
      
      .vocab-srs-popup-close {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: currentColor;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
        position: absolute;
        top: 16px;
        right: 16px;
        backdrop-filter: blur(8px);
      }
      
      .vocab-srs-popup-close:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }
      
      .vocab-srs-popup-close:active {
        transform: scale(0.95);
      }
      
      @keyframes vocab-srs-slide-in {
        0% {
          transform: translateX(100%) scale(0.9);
          opacity: 0;
        }
        50% {
          opacity: 0.8;
        }
        100% {
          transform: translateX(0) scale(1);
          opacity: 1;
        }
      }
      
      @keyframes vocab-srs-slide-out {
        0% {
          transform: translateX(0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translateX(100%) scale(0.95);
          opacity: 0;
        }
      }
      
      .vocab-srs-popup-message.vocab-srs-closing {
        animation: vocab-srs-slide-out 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
      }
      
      /* Add subtle glow effect */
      .vocab-srs-popup-success::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(135deg, #34d399, #10b981);
        border-radius: 18px;
        z-index: -1;
        opacity: 0.3;
        filter: blur(8px);
      }
      
      .vocab-srs-popup-error::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(135deg, #f87171, #ef4444);
        border-radius: 18px;
        z-index: -1;
        opacity: 0.3;
        filter: blur(8px);
      }
      
      .vocab-srs-popup-info::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(135deg, #34d399, #10b981);
        border-radius: 18px;
        z-index: -1;
        opacity: 0.3;
        filter: blur(8px);
      }
    `;
    document.head.appendChild(styleElement);
  }

  // Add popup to body
  document.body.appendChild(popup);

  // Close function
  const closePopup = () => {
    popup.classList.add('vocab-srs-closing');
    setTimeout(() => {
      if (popup.parentNode) {
        document.body.removeChild(popup);
      }
    }, 400);
  };

  // Add close button event listener
  const closeBtn = popup.querySelector('.vocab-srs-popup-close');
  closeBtn?.addEventListener('click', closePopup);

  // Auto close after duration
  setTimeout(closePopup, duration);

  // Close on click outside (optional)
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

// Initialize content script
function init() {
  if (isInitialized) {
    return;
  }
  isInitialized = true;
  
  // Inject extension styles
  injectExtensionStyles();
  
  // Load word highlighting setting from storage
  loadWordHighlightingSetting();
  
  // Attach event listeners to all existing elements
  attachEventListenersToAllElements();
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Add floating button when text is selected
  createFloatingButton();
  
  // Set up observer for dynamic content changes
  setupDynamicContentObserver();
  
  // Debug: Mark content script as loaded
  console.log('VocaPi: Content script fully initialized');
  (window as any).vocapi_content_loaded = true;
}

// Inject extension styles into content script
function injectExtensionStyles() {
  const styleId = 'vocab-srs-extension-styles';
  if (document.getElementById(styleId)) {
    return; // Already injected
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* VocaPi Extension Styles */
    .vocab-srs-floating-btn {
      position: fixed !important;
      z-index: 999999 !important;
      display: none;
      pointer-events: none !important;
      animation: vocab-srs-float 3s ease-in-out infinite !important;
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
      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3) !important;
      cursor: pointer !important;
      pointer-events: all !important;
      transition: all 0.3s ease !important;
      border: none !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      white-space: nowrap !important;
      backdrop-filter: blur(10px) !important;
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
    // Use notifications as proxy for word highlighting (as in popup)
    wordHighlightingEnabled = settings?.notifications ?? true;
  } catch (error) {
    console.log('Failed to load word highlighting setting:', error);
    // Default to enabled
    wordHighlightingEnabled = true;
  }
}

// Attach event listeners to all existing elements on the page
function attachEventListenersToAllElements() {
  // Remove any existing listeners first to avoid duplicates
  document.removeEventListener('mouseup', handleTextSelection);
  document.removeEventListener('keyup', handleTextSelection);
  
  // Use event delegation on document level for better coverage
  document.addEventListener('mouseup', handleTextSelection, true);
  document.addEventListener('keyup', handleTextSelection, true);
  
  // Also listen to specific events that might trigger selection
  document.addEventListener('touchend', handleTextSelection, true);
  document.addEventListener('click', handleTextSelection, true);
  
  // Listen to selection changes globally
  document.addEventListener('selectionchange', handleTextSelection, true);
}

// Set up observer for dynamic content changes
function setupDynamicContentObserver() {
  // Use MutationObserver to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    // Since we're using event delegation, we don't need to attach listeners to new elements
    // Just ensure the floating button positioning works with new content
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Content changed, re-check selection if there's any
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection && selection.toString().trim() && wordHighlightingEnabled) {
            selectedText = selection.toString().trim();
            showFloatingButton();
          }
        }, 100);
      }
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Handle text selection
function handleTextSelection(event?: Event) {
  // Nếu click vào floating button hoặc modal, không xử lý selection
  if (event && event.target) {
    const target = event.target as Element;
    if (target.closest('#vocab-srs-floating-btn') || 
        target.closest('#vocab-srs-modal') || 
        target.id === 'vocab-srs-floating-btn' ||
        target.id === 'vocab-srs-modal') {
      return;
    }
  }
  
  // Nếu word highlighting bị tắt, ẩn nút và return
  if (!wordHighlightingEnabled) {
    hideFloatingButton();
    selectedText = '';
    return;
  }
  
  // Delay để đảm bảo selection đã hoàn thành
  setTimeout(() => {
    const selection = window.getSelection();
    const selectionText = selection ? selection.toString().trim() : '';
    
    console.log('VocaPi: Text selection changed:', { selectionText, wordHighlightingEnabled });
    
    if (selection && selectionText) {
      selectedText = selectionText;
      console.log('VocaPi: Showing floating button for:', selectionText);
      showFloatingButton();
    } else {
      // Chỉ hide button nếu không có modal mở
      if (!isModalOpen) {
        selectedText = '';
        console.log('VocaPi: Hiding floating button - no selection');
        hideFloatingButton();
      }
    }
  }, 10);
}

// Create floating button
function createFloatingButton() {
  // Check if button already exists
  const existingButton = document.getElementById('vocab-srs-floating-btn');
  if (existingButton) {
    console.log('VocaPi: Floating button already exists');
    return;
  }
  
  const button = document.createElement('div');
  button.id = 'vocab-srs-floating-btn';
  button.className = 'vocab-srs-floating-btn';
  button.innerHTML = `
    <div class="vocab-srs-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      <span>Add to Dictionary</span>
    </div>
  `;
  
  document.body.appendChild(button);
  console.log('VocaPi: Floating button created');
  
  // Add click handler
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('VocaPi: Floating button clicked');
    showAddModal(selectedText);
  });
}

// Show floating button
function showFloatingButton() {
  // Kiểm tra trạng thái wordHighlightingEnabled trước khi hiển thị
  if (!wordHighlightingEnabled) {
    console.log('VocaPi: Word highlighting disabled, not showing button');
    return;
  }
  
  const button = document.getElementById('vocab-srs-floating-btn');
  
  if (!button) {
    console.error('VocaPi: Floating button not found in DOM');
    return;
  }
  
  if (button) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Đảm bảo rect có giá trị hợp lệ
      if (rect.width > 0 || rect.height > 0) {
        console.log('VocaPi: Showing button at position:', { 
          left: rect.left, 
          top: rect.bottom, 
          width: rect.width, 
          height: rect.height 
        });
        
        // Reset all hiding styles
        button.style.display = 'block';
        button.style.visibility = 'visible';
        button.style.opacity = '1';
        button.style.pointerEvents = 'all';
        
        // Tính toán vị trí với scroll offset
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        const left = rect.left + scrollX;
        const top = rect.bottom + scrollY + 5;
        
        button.style.left = `${left}px`;
        button.style.top = `${top}px`;
        button.style.position = 'absolute'; // Đảm bảo position absolute
        
        console.log('VocaPi: Button positioned at:', { left, top });
        
        // Đảm bảo button không bị che khuất bởi viewport
        setTimeout(() => {
          const buttonRect = button.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          // Adjust horizontal position if button goes outside viewport
          if (buttonRect.right > viewportWidth) {
            button.style.left = `${viewportWidth - buttonRect.width - 10 + scrollX}px`;
          }
          
          // Adjust vertical position if button goes outside viewport
          if (buttonRect.bottom > viewportHeight) {
            button.style.top = `${rect.top + scrollY - buttonRect.height - 5}px`;
          }
        }, 0);
      }
    }
  }
}

// Hide floating button
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
    
    console.log(`Dictionary API returned status ${response.status} for word: ${word}`);
    return fallbackData;
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.log('Dictionary API request timed out for word:', word);
      } else {
        console.log('Dictionary API error for word:', word, error.message);
      }
    } else {
      console.log('Unknown error fetching word data for:', word);
    }
    
    // Always return fallback data instead of throwing
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
      console.log('Text-to-speech failed:', error);
    }
  }
}

// Show add modal
function showAddModal(word?: string) {
  if (isModalOpen) return;
  
  isModalOpen = true;
  
  // Hide floating button when modal opens
  hideFloatingButton();
  
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
            <label>Word *</label>
            <input type="text" id="vocab-word" value="${word || ''}" placeholder="Enter word" required>
          </div>
          <div class="vocab-srs-form-group">
            <label>Meaning *</label>
            <input type="text" id="vocab-meaning" placeholder="Enter meaning" required>
          </div>
          <div class="vocab-srs-form-group">
            <label>Phonetic *</label>
            <div class="vocab-srs-phonetic-group">
              <input type="text" id="vocab-phonetic" placeholder="Loading phonetic..." readonly>
              <button type="button" class="vocab-srs-play-audio" title="Play pronunciation">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5,6 9,2 9,2 15,6 15,11 19,11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="vocab-srs-form-group">
            <label>Word Type *</label>
            <select id="vocab-word-type" required>
              <option value="">Select word type</option>
              <option value="noun">Noun</option>
              <option value="verb">Verb</option>
              <option value="adjective">Adjective</option>
              <option value="adverb">Adverb</option>
              <option value="idiom">Idiom</option>
              <option value="phrase">Phrase</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="vocab-srs-form-group">
            <label>Example (optional)</label>
            <input type="text" id="vocab-example" placeholder="Enter example sentence">
          </div>
        </div>
        <div class="vocab-srs-modal-footer">
          <button class="vocab-srs-btn-cancel">Cancel</button>
          <button class="vocab-srs-btn-save">Save to Dictionary</button>
        </div>
      </div>
    </div>
  `;
  
  // Set modal classes
  modal.className = 'vocab-srs-modal';
  
  // Add additional styles for specific elements
  const additionalStyle = document.createElement('style');
  additionalStyle.textContent = `
    .vocab-srs-phonetic-group {
      display: flex !important;
      gap: 10px !important;
      align-items: center !important;
    }
    
    .vocab-srs-phonetic-group input {
      flex: 1 !important;
    }
    
    .vocab-srs-play-audio {
      background: #f9fafb !important;
      border: 2px solid #e5e7eb !important;
      border-radius: 8px !important;
      padding: 10px !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.2s ease !important;
      min-width: 42px !important;
      height: 42px !important;
    }
    
    .vocab-srs-play-audio:hover {
      background: rgba(34, 197, 94, 0.1) !important;
      border-color: #22c55e !important;
      transform: scale(1.05) !important;
    }
    
    .vocab-srs-play-audio:active {
      transform: scale(0.98) !important;
    }
    
    .vocab-srs-play-audio:disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
      transform: none !important;
    }
    
    .vocab-srs-play-audio svg {
      color: #22c55e !important;
    }
    
    .vocab-srs-modal-footer {
      display: flex !important;
      gap: 16px !important;
      padding: 24px 28px !important;
      border-top: 1px solid #e5e7eb !important;
    }
    
    .vocab-srs-btn-cancel,
    .vocab-srs-btn-save {
      flex: 1 !important;
      padding: 12px 20px !important;
      border-radius: 10px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
      border: none !important;
    }
    
    .vocab-srs-btn-cancel {
      background: #f3f4f6 !important;
      color: #374151 !important;
      border: 2px solid #e5e7eb !important;
    }
    
    .vocab-srs-btn-cancel:hover {
      background: #e5e7eb !important;
      transform: translateY(-1px) !important;
    }
    
    .vocab-srs-btn-save {
      background: linear-gradient(135deg, #22c55e, #16a34a) !important;
      color: white !important;
      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3) !important;
    }
    
    .vocab-srs-btn-save:hover {
      background: linear-gradient(135deg, #34d399, #22c55e) !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4) !important;
    }
    
    .vocab-srs-btn-save:disabled {
      opacity: 0.6 !important;
      cursor: not-allowed !important;
      transform: none !important;
      box-shadow: none !important;
    }
    
    /* Dark mode styles for modal buttons */
    @media (prefers-color-scheme: dark) {
      .vocab-srs-modal-footer {
        border-top-color: #374151 !important;
      }
      
      .vocab-srs-btn-cancel {
        background: #374151 !important;
        color: #d1d5db !important;
        border-color: #4b5563 !important;
      }
      
      .vocab-srs-btn-cancel:hover {
        background: #4b5563 !important;
        color: #f9fafb !important;
      }
      
      .vocab-srs-play-audio {
        background: #374151 !important;
        border-color: #4b5563 !important;
      }
      
      .vocab-srs-play-audio:hover {
        background: rgba(34, 197, 94, 0.2) !important;
        border-color: #22c55e !important;
      }
      
      .vocab-srs-play-audio svg {
        color: #34d399 !important;
      }
    }
  `;
  
  document.head.appendChild(additionalStyle);
  document.body.appendChild(modal);
  
  // Add event listeners
  const closeBtn = modal.querySelector('.vocab-srs-modal-close');
  const cancelBtn = modal.querySelector('.vocab-srs-btn-cancel');
  const saveBtn = modal.querySelector('.vocab-srs-btn-save');
  const playAudioBtn = modal.querySelector('.vocab-srs-play-audio');
  
  const closeModal = () => {
    document.body.removeChild(modal);
    document.head.removeChild(additionalStyle);
    isModalOpen = false;
    
    // Remove ESC key listener when modal closes
    document.removeEventListener('keydown', handleEscKey);
  };
  
  // Handle ESC key to close modal
  const handleEscKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isModalOpen) {
      event.preventDefault();
      event.stopPropagation();
      closeModal();
    }
  };
  
  // Add ESC key listener
  document.addEventListener('keydown', handleEscKey);
  
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  
  // Add play audio functionality
  playAudioBtn?.addEventListener('click', () => {
    if (word) {
      playWordAudio(word, modal.dataset.pronunUrl || '');
    }
  });
  
  saveBtn?.addEventListener('click', async () => {
    const wordInput = modal.querySelector('#vocab-word') as HTMLInputElement;
    const meaningInput = modal.querySelector('#vocab-meaning') as HTMLInputElement;
    const exampleInput = modal.querySelector('#vocab-example') as HTMLInputElement;
    const phoneticInput = modal.querySelector('#vocab-phonetic') as HTMLInputElement;
    const wordTypeInput = modal.querySelector('#vocab-word-type') as HTMLSelectElement;
    const saveBtnElement = saveBtn as HTMLButtonElement;
    
    const word = wordInput?.value.trim();
    const meaning = meaningInput?.value.trim();
    let phonetic = phoneticInput?.value.trim();
    const wordType = wordTypeInput?.value as VocabWord['wordType'];
    
    // Basic validation
    if (!word || !meaning || !wordType) {
      showErrorPopup('Please fill in the required fields: Word, Meaning, and Word Type', 4000);
      return;
    }
    
    // Use fallback phonetic if none provided or still loading
    if (!phonetic || phonetic === 'Loading...' || phonetic === 'Fetching phonetic data...') {
      phonetic = generateSimplePhonetic(word);
    }
    
    // Get the pronunUrl from the fetched data
    const pronunUrl = modal.dataset.pronunUrl || '';
    
    const newWord: VocabWord = {
      id: `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      word,
      meaning,
      example: exampleInput?.value.trim() || undefined,
      phonetic,
      pronunUrl,
      wordType,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
      nextReview: Date.now(), // New words are immediately available for review
      quality: 0,
      totalReviews: 0,
      correctReviews: 0
    };
    
    try {
      // Disable save button to prevent double submission
      saveBtnElement.disabled = true;
      saveBtnElement.textContent = 'Saving...';
      
      // Save to storage
      const result = await chrome.storage.local.get(['vocabWords']);
      const existingWords = result.vocabWords || [];
      
      // Check if word with same meaning already exists
      const existingWord = existingWords.find((w: VocabWord) => 
        w.word.toLowerCase() === word.toLowerCase() && 
        w.meaning.toLowerCase() === meaning.toLowerCase()
      );
      
      if (existingWord) {
        showErrorPopup(`The word "${word}" with the meaning "${meaning}" already exists in your dictionary! You can add the same word with different meanings.`, 5000);
        saveBtnElement.disabled = false;
        saveBtnElement.textContent = 'Save to Dictionary';
        return;
      }
      
      // Show existing meanings if word exists with different meanings
      const existingMeanings = existingWords.filter((w: VocabWord) => 
        w.word.toLowerCase() === word.toLowerCase()
      );
      
      if (existingMeanings.length > 0) {
        const meaningsList = existingMeanings.map((w: VocabWord) => `• ${w.meaning}`).join('\n');
        const confirmMessage = `The word "${word}" already exists with these meanings:\n\n${meaningsList}\n\nDo you want to add this word with a new meaning: "${meaning}"?`;
        
        if (!confirm(confirmMessage)) {
          saveBtnElement.disabled = false;
          saveBtnElement.textContent = 'Save to Dictionary';
          return;
        }
      }
      
      existingWords.push(newWord);
      await chrome.storage.local.set({ vocabWords: existingWords });
      
      // Show success message
      showSuccessPopup(`Word "${word}" added to dictionary successfully!`, 4000);
      closeModal();
      
      // Hide floating button
      hideFloatingButton();
      
    } catch (error) {
      console.error('Failed to save word:', error);
      showErrorPopup('Failed to save word. Please try again.', 4000);
      
      // Re-enable save button
      saveBtnElement.disabled = false;
      saveBtnElement.textContent = 'Save to Dictionary';
    }
  });
  
  // Close on overlay click
  modal.querySelector('.vocab-srs-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  });
  
  // Auto-fetch word data if word is provided
  if (word) {
    const phoneticInput = modal.querySelector('#vocab-phonetic') as HTMLInputElement;
    const saveBtn = modal.querySelector('.vocab-srs-btn-save') as HTMLButtonElement;
    const playAudioBtn = modal.querySelector('.vocab-srs-play-audio') as HTMLButtonElement;
    
    // Set initial loading state
    phoneticInput.value = 'Loading...';
    phoneticInput.placeholder = 'Fetching phonetic data...';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Loading...';
    playAudioBtn.disabled = true;
    
    // Fetch word data with better error handling
    fetchWordData(word)
      .then(({ phonetic, pronunUrl }) => {
        // Update UI with fetched data
        phoneticInput.value = phonetic || generateSimplePhonetic(word);
        phoneticInput.placeholder = phonetic || 'No phonetic available';
        
        // Store pronunUrl in modal dataset for later use
        modal.dataset.pronunUrl = pronunUrl || '';
        
        // Re-enable save button and play button
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save to Dictionary';
        playAudioBtn.disabled = false;
        
        // Auto-play pronunciation if available
        playWordAudio(word, pronunUrl);
      })
      .catch((error) => {
        console.error('Failed to fetch word data:', error);
        
        // Set fallback data
        const fallbackPhonetic = generateSimplePhonetic(word);
        phoneticInput.value = fallbackPhonetic;
        phoneticInput.placeholder = 'Fallback phonetic';
        
        // Store empty pronunUrl in modal dataset
        modal.dataset.pronunUrl = '';
        
        // Re-enable save button and play button
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save to Dictionary';
        playAudioBtn.disabled = false;
        
        // Use TTS as fallback
        playTextToSpeech(word);
      });
  }
  
  // Focus on meaning input
  setTimeout(() => {
    const meaningInput = modal.querySelector('#vocab-meaning') as HTMLInputElement;
    meaningInput?.focus();
  }, 100);
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
