// Theme Manager - Support Dark/Light Mode
class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.themes = {
      light: {
        primary: '#667eea',
        secondary: '#764ba2',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      dark: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        border: '#334155',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      blue: {
        primary: '#0ea5e9',
        secondary: '#06b6d4',
        background: '#f0f9ff',
        surface: '#e0f2fe',
        text: '#0c4a6e',
        textSecondary: '#0369a1',
        border: '#bae6fd'
      }
    };
    
    this.init();
  }

  async init() {
    // Load saved theme
    const saved = await this.getSavedTheme();
    this.currentTheme = saved || this.detectSystemPreference();
    
    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          if (this.currentTheme === 'auto') {
            this.applyTheme(e.matches ? 'dark' : 'light');
          }
        });
    }
    
    this.applyTheme(this.currentTheme);
  }

  detectSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  async getSavedTheme() {
    try {
      const result = await chrome.storage.local.get(['selectedTheme']);
      return result.selectedTheme;
    } catch (error) {
      console.warn('Theme load error:', error);
      return null;
    }
  }

  async saveTheme(theme) {
    try {
      await chrome.storage.local.set({ selectedTheme: theme });
      this.currentTheme = theme;
    } catch (error) {
      console.error('Theme save error:', error);
    }
  }

  applyTheme(themeName) {
    const theme = this.themes[themeName] || this.themes.light;
    const root = document.documentElement;
    
    // Apply CSS custom properties
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    
    // Add theme class to body
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${themeName}`);
    
    // Update meta theme-color for mobile
    this.updateMetaThemeColor(theme.primary);
  }

  updateMetaThemeColor(color) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = color;
  }

  async setTheme(themeName) {
    if (this.themes[themeName]) {
      await this.saveTheme(themeName);
      this.applyTheme(themeName);
      
      // Broadcast theme change to other extension pages
      chrome.runtime.sendMessage({
        type: 'THEME_CHANGED',
        theme: themeName
      });
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getAvailableThemes() {
    return Object.keys(this.themes);
  }

  // Generate dynamic CSS for current theme
  generateThemeCSS() {
    const theme = this.themes[this.currentTheme];
    return `
      :root {
        ${Object.entries(theme).map(([key, value]) => 
          `--theme-${key}: ${value};`
        ).join('\n        ')}
      }
      
      /* Dark mode specific styles */
      .theme-dark .vocab-card {
        background: var(--theme-surface);
        border-color: var(--theme-border);
        color: var(--theme-text);
      }
      
      .theme-dark .popup-header {
        background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
      }
      
      .theme-dark .modal-content {
        background: var(--theme-surface);
        color: var(--theme-text);
      }
      
      .theme-dark input, .theme-dark textarea, .theme-dark select {
        background: var(--theme-background);
        border-color: var(--theme-border);
        color: var(--theme-text);
      }
    `;
  }
}

// Initialize theme manager
if (typeof window !== 'undefined') {
  window.ThemeManager = ThemeManager;
  window.themeManager = new ThemeManager();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}