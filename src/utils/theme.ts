// Theme management utilities for VocaPi extension
import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: Theme = 'system';
  private observers: (() => void)[] = [];

  private constructor() {
    this.init();
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  private init() {
    // Load saved theme preference
    this.loadThemeFromStorage();
    
    // Apply initial theme
    this.applyTheme();
    
    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.currentTheme === 'system') {
          this.applyTheme();
          this.notifyObservers();
        }
      });
    }
  }

  private async loadThemeFromStorage() {
    try {
      // Check if chrome.storage is available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(['theme']);
        if (result.theme && ['light', 'dark', 'system'].includes(result.theme)) {
          this.currentTheme = result.theme as Theme;
        }
      } else {
        // Fallback to localStorage if chrome.storage is not available
        const stored = localStorage.getItem('theme');
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
          this.currentTheme = stored as Theme;
        }
      }
    } catch (error) {
      console.log('Failed to load theme from storage:', error);
      this.currentTheme = 'system';
    }
  }

  private async saveThemeToStorage() {
    try {
      // Check if chrome.storage is available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ theme: this.currentTheme });
      } else {
        // Fallback to localStorage if chrome.storage is not available
        localStorage.setItem('theme', this.currentTheme);
      }
    } catch (error) {
      console.error('Failed to save theme to storage:', error);
    }
  }

  private getEffectiveTheme(): 'light' | 'dark' {
    if (this.currentTheme === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return this.currentTheme;
  }

  private applyTheme() {
    const effectiveTheme = this.getEffectiveTheme();
    const html = document.documentElement;
    
    // Remove existing theme classes
    html.classList.remove('light', 'dark');
    
    // Add current theme class
    html.classList.add(effectiveTheme);
    
    // Set data attribute for CSS
    html.setAttribute('data-theme', effectiveTheme);
    
    // Update CSS custom properties for better performance
    this.updateCSSCustomProperties(effectiveTheme);
  }

  private updateCSSCustomProperties(theme: 'light' | 'dark') {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      // Dark theme CSS variables
      root.style.setProperty('--color-primary', '34 197 94');
      root.style.setProperty('--color-primary-light', '74 222 128');
      root.style.setProperty('--color-primary-dark', '21 128 61');
      root.style.setProperty('--color-accent', '16 185 129');
      root.style.setProperty('--color-accent-light', '52 211 153');
      root.style.setProperty('--color-accent-dark', '4 120 87');
      
      root.style.setProperty('--color-background', '15 23 42');
      root.style.setProperty('--color-background-secondary', '30 41 59');
      root.style.setProperty('--color-background-tertiary', '51 65 85');
      
      root.style.setProperty('--color-foreground', '248 250 252');
      root.style.setProperty('--color-foreground-secondary', '203 213 225');
      root.style.setProperty('--color-foreground-muted', '148 163 184');
      
      root.style.setProperty('--color-border', '51 65 85');
      root.style.setProperty('--color-border-secondary', '71 85 105');
    } else {
      // Light theme CSS variables
      root.style.setProperty('--color-primary', '34 197 94');
      root.style.setProperty('--color-primary-light', '74 222 128');
      root.style.setProperty('--color-primary-dark', '21 128 61');
      root.style.setProperty('--color-accent', '16 185 129');
      root.style.setProperty('--color-accent-light', '52 211 153');
      root.style.setProperty('--color-accent-dark', '4 120 87');
      
      root.style.setProperty('--color-background', '255 255 255');
      root.style.setProperty('--color-background-secondary', '249 250 251');
      root.style.setProperty('--color-background-tertiary', '243 244 246');
      
      root.style.setProperty('--color-foreground', '17 24 39');
      root.style.setProperty('--color-foreground-secondary', '55 65 81');
      root.style.setProperty('--color-foreground-muted', '107 114 128');
      
      root.style.setProperty('--color-border', '229 231 235');
      root.style.setProperty('--color-border-secondary', '209 213 219');
    }
  }

  public setTheme(theme: Theme) {
    this.currentTheme = theme;
    this.saveThemeToStorage();
    this.applyTheme();
    this.notifyObservers();
  }

  public getTheme(): Theme {
    return this.currentTheme;
  }

  public getEffectiveThemePublic(): 'light' | 'dark' {
    return this.getEffectiveTheme();
  }

  public subscribe(callback: () => void) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  private notifyObservers() {
    this.observers.forEach(callback => callback());
  }

  public toggleTheme() {
    const current = this.getEffectiveTheme();
    this.setTheme(current === 'dark' ? 'light' : 'dark');
  }

  // Utility methods for components
  public isDark(): boolean {
    return this.getEffectiveTheme() === 'dark';
  }

  public isLight(): boolean {
    return this.getEffectiveTheme() === 'light';
  }

  // Get theme-appropriate colors
  public getThemeColors() {
    const theme = this.getEffectiveTheme();
    
    return {
      primary: theme === 'dark' ? 'rgb(34, 197, 94)' : 'rgb(34, 197, 94)',
      primaryLight: theme === 'dark' ? 'rgb(74, 222, 128)' : 'rgb(74, 222, 128)',
      primaryDark: theme === 'dark' ? 'rgb(21, 128, 61)' : 'rgb(21, 128, 61)',
      background: theme === 'dark' ? 'rgb(15, 23, 42)' : 'rgb(255, 255, 255)',
      foreground: theme === 'dark' ? 'rgb(248, 250, 252)' : 'rgb(17, 24, 39)',
      border: theme === 'dark' ? 'rgb(51, 65, 85)' : 'rgb(229, 231, 235)',
    };
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance();

// Hook for React components
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(themeManager.getTheme());
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(
    themeManager.getEffectiveThemePublic()
  );

  useEffect(() => {
    const unsubscribe = themeManager.subscribe(() => {
      setTheme(themeManager.getTheme());
      setEffectiveTheme(themeManager.getEffectiveThemePublic());
    });

    return unsubscribe;
  }, []);

  const changeTheme = (newTheme: Theme) => {
    themeManager.setTheme(newTheme);
  };

  const toggleTheme = () => {
    themeManager.toggleTheme();
  };

  return {
    theme,
    effectiveTheme,
    isDark: effectiveTheme === 'dark',
    isLight: effectiveTheme === 'light',
    changeTheme,
    toggleTheme,
    colors: themeManager.getThemeColors(),
  };
}

// Initialize theme on import
if (typeof window !== 'undefined') {
  // Auto-initialize when imported in browser environment
  themeManager;
}