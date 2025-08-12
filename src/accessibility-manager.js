// Accessibility Manager - WCAG 2.1 AA Compliance
class AccessibilityManager {
  constructor() {
    this.settings = {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReaderMode: false,
      keyboardNavigation: true,
      focusVisible: true
    };
    
    this.init();
  }

  async init() {
    // Load accessibility preferences
    await this.loadSettings();
    
    // Apply system preferences
    this.detectSystemPreferences();
    
    // Setup keyboard navigation
    this.setupKeyboardNavigation();
    
    // Setup focus management
    this.setupFocusManagement();
    
    // Setup screen reader support
    this.setupScreenReaderSupport();
    
    // Apply settings
    this.applySettings();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['accessibilitySettings']);
      if (result.accessibilitySettings) {
        this.settings = { ...this.settings, ...result.accessibilitySettings };
      }
    } catch (error) {
      console.warn('Accessibility settings load error:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({ accessibilitySettings: this.settings });
    } catch (error) {
      console.error('Accessibility settings save error:', error);
    }
  }

  detectSystemPreferences() {
    // Detect reduced motion preference
    if (window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.settings.reducedMotion = prefersReducedMotion.matches;
      
      prefersReducedMotion.addEventListener('change', (e) => {
        this.settings.reducedMotion = e.matches;
        this.applySettings();
      });

      // Detect high contrast preference
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
      this.settings.highContrast = prefersHighContrast.matches;
      
      prefersHighContrast.addEventListener('change', (e) => {
        this.settings.highContrast = e.matches;
        this.applySettings();
      });
    }
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Tab navigation enhancement
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }
      
      // Escape key handling
      if (e.key === 'Escape') {
        this.handleEscapeKey(e);
      }
      
      // Enter/Space for button activation
      if (e.key === 'Enter' || e.key === ' ') {
        this.handleActivation(e);
      }

      // Arrow key navigation for lists
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowNavigation(e);
      }
    });
  }

  setupFocusManagement() {
    // Improve focus visibility
    const style = document.createElement('style');
    style.textContent = `
      .accessibility-focus-visible:focus {
        outline: 3px solid #4285f4 !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.3) !important;
      }
      
      .accessibility-skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #4285f4;
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 10000;
        transition: top 0.3s;
      }
      
      .accessibility-skip-link:focus {
        top: 6px;
      }
    `;
    document.head.appendChild(style);

    // Add focus visible class to focusable elements
    this.markFocusableElements();
  }

  setupScreenReaderSupport() {
    // Add ARIA labels and descriptions
    this.enhanceAriaSupport();
    
    // Create live region for announcements
    this.createLiveRegion();
  }

  markFocusableElements() {
    const focusableSelectors = [
      'button',
      'input',
      'textarea',
      'select',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    focusableSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        element.classList.add('accessibility-focus-visible');
      });
    });
  }

  enhanceAriaSupport() {
    // Add skip links
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'accessibility-skip-link';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Enhance buttons without labels
    document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
      if (!button.textContent.trim()) {
        const icon = button.querySelector('i, span[class*="icon"]');
        if (icon) {
          button.setAttribute('aria-label', this.getIconAriaLabel(icon.className));
        }
      }
    });

    // Add aria-expanded for expandable elements
    document.querySelectorAll('[data-toggle], .dropdown-trigger, .menu-trigger').forEach(element => {
      if (!element.hasAttribute('aria-expanded')) {
        element.setAttribute('aria-expanded', 'false');
      }
    });
  }

  createLiveRegion() {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'accessibility-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
  }

  announce(message, priority = 'polite') {
    const liveRegion = document.getElementById('accessibility-live-region');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  handleTabNavigation(e) {
    // Trap focus in modals
    const modal = e.target.closest('.modal, .popup');
    if (modal && modal.classList.contains('active')) {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && e.target === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && e.target === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  handleEscapeKey(e) {
    // Close modals/popups
    const modal = document.querySelector('.modal.active, .popup.active');
    if (modal) {
      const closeButton = modal.querySelector('.close, .cancel, [data-dismiss]');
      if (closeButton) {
        closeButton.click();
      }
    }
  }

  handleActivation(e) {
    const element = e.target;
    
    // Handle custom button-like elements
    if (element.getAttribute('role') === 'button' && !element.disabled) {
      e.preventDefault();
      element.click();
    }
    
    // Handle expandable elements
    if (element.hasAttribute('aria-expanded')) {
      const expanded = element.getAttribute('aria-expanded') === 'true';
      element.setAttribute('aria-expanded', !expanded);
    }
  }

  handleArrowNavigation(e) {
    // Handle list navigation
    const listElement = e.target.closest('[role="listbox"], .vocab-list, .results-list');
    if (listElement) {
      const items = listElement.querySelectorAll('[role="option"], .vocab-item, .result-item');
      const currentIndex = Array.from(items).indexOf(e.target.closest('[role="option"], .vocab-item, .result-item'));
      
      let nextIndex;
      switch (e.key) {
        case 'ArrowUp':
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          break;
        case 'ArrowDown':
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          break;
        default:
          return;
      }
      
      if (items[nextIndex]) {
        e.preventDefault();
        const focusableElement = items[nextIndex].querySelector('button, a, input') || items[nextIndex];
        focusableElement.focus();
      }
    }
  }

  getIconAriaLabel(className) {
    const iconLabels = {
      'settings': 'Settings',
      'close': 'Close',
      'menu': 'Menu',
      'search': 'Search',
      'add': 'Add',
      'edit': 'Edit',
      'delete': 'Delete',
      'play': 'Play',
      'pause': 'Pause',
      'next': 'Next',
      'previous': 'Previous',
      'home': 'Home',
      'back': 'Back'
    };
    
    for (const [icon, label] of Object.entries(iconLabels)) {
      if (className.includes(icon)) {
        return label;
      }
    }
    
    return 'Button';
  }

  applySettings() {
    const root = document.documentElement;
    
    // High contrast mode
    root.classList.toggle('accessibility-high-contrast', this.settings.highContrast);
    
    // Large text mode
    root.classList.toggle('accessibility-large-text', this.settings.largeText);
    
    // Reduced motion mode
    root.classList.toggle('accessibility-reduced-motion', this.settings.reducedMotion);
    
    // Screen reader mode
    root.classList.toggle('accessibility-screen-reader', this.settings.screenReaderMode);
    
    this.applyAccessibilityCSS();
  }

  applyAccessibilityCSS() {
    const existingStyle = document.getElementById('accessibility-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = 'accessibility-styles';
    style.textContent = `
      /* High Contrast Mode */
      .accessibility-high-contrast {
        --theme-primary: #0066cc;
        --theme-secondary: #004499;
        --theme-background: #ffffff;
        --theme-text: #000000;
        --theme-border: #000000;
      }
      
      .accessibility-high-contrast .vocab-card,
      .accessibility-high-contrast .modal-content {
        border: 2px solid #000000 !important;
      }
      
      /* Large Text Mode */
      .accessibility-large-text {
        font-size: 1.2em !important;
      }
      
      .accessibility-large-text button,
      .accessibility-large-text input,
      .accessibility-large-text select {
        font-size: 1.1em !important;
        padding: 12px 16px !important;
      }
      
      /* Reduced Motion Mode */
      .accessibility-reduced-motion *,
      .accessibility-reduced-motion *::before,
      .accessibility-reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      
      /* Screen Reader Mode */
      .accessibility-screen-reader .decorative-icon {
        display: none !important;
      }
      
      .accessibility-screen-reader .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  async updateSetting(key, value) {
    this.settings[key] = value;
    await this.saveSettings();
    this.applySettings();
    
    this.announce(`${key} ${value ? 'enabled' : 'disabled'}`);
  }

  getSettings() {
    return { ...this.settings };
  }

  // Test accessibility compliance
  runAccessibilityCheck() {
    const issues = [];
    
    // Check for missing alt text
    document.querySelectorAll('img:not([alt])').forEach(img => {
      issues.push({ type: 'missing-alt', element: img });
    });
    
    // Check for missing form labels
    document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(input => {
      if (!input.closest('label') && input.type !== 'hidden') {
        issues.push({ type: 'missing-label', element: input });
      }
    });
    
    // Check contrast ratios
    // (This would require a color contrast library in a real implementation)
    
    return issues;
  }
}

// Initialize accessibility manager
if (typeof window !== 'undefined') {
  window.AccessibilityManager = AccessibilityManager;
  window.accessibilityManager = new AccessibilityManager();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityManager;
}
