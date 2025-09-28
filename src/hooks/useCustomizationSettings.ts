import { useState, useEffect } from 'react';

export interface SRSSettings {
  easeFactor: number;
  easyBonus: number;
  hardPenalty: number;
  intervalModifier: number;
  maximumInterval: number;
  minimumInterval: number;
  graduatingInterval: number;
  easyInterval: number;
}

export interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  fontSize: string;
  fontFamily: string;
  borderRadius: string;
  animation: boolean;
  darkMode: string;
}

export interface StudySettings {
  sessionLength: number;
  breakReminder: boolean;
  breakInterval: number;
  autoPlayAudio: boolean;
  showProgress: boolean;
  enableHints: boolean;
  retryOnMistake: boolean;
}

export interface AccessibilitySettings {
  fontSize: string;
  highContrast: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
  focusIndicators: boolean;
}

export interface AudioSettings {
  voiceSelection: string;
  speechRate: number;
  speechVolume: number;
  pronunciationAutoplay: boolean;
  soundEffects: boolean;
  notificationSounds: boolean;
}

export interface CustomizationSettings {
  srs?: SRSSettings;
  theme?: ThemeSettings;
  study?: StudySettings;
  accessibility?: AccessibilitySettings;
  audio?: AudioSettings;
}

const defaultSettings: CustomizationSettings = {
  srs: {
    easeFactor: 2.5,
    easyBonus: 1.3,
    hardPenalty: 1.2,
    intervalModifier: 1.0,
    maximumInterval: 365,
    minimumInterval: 1,
    graduatingInterval: 1,
    easyInterval: 4
  },
  theme: {
    primaryColor: '#3b82f6',
    accentColor: '#8b5cf6',
    fontSize: 'medium',
    fontFamily: 'Inter',
    borderRadius: 'medium',
    animation: true,
    darkMode: 'auto'
  },
  study: {
    sessionLength: 20,
    breakReminder: true,
    breakInterval: 30,
    autoPlayAudio: true,
    showProgress: true,
    enableHints: true,
    retryOnMistake: true
  },
  accessibility: {
    fontSize: '100%',
    highContrast: false,
    reducedMotion: false,
    keyboardNavigation: false,
    screenReader: false,
    focusIndicators: false
  },
  audio: {
    voiceSelection: 'default',
    speechRate: 1.0,
    speechVolume: 0.8,
    pronunciationAutoplay: true,
    soundEffects: true,
    notificationSounds: true
  }
};

export const useCustomizationSettings = () => {
  const [settings, setSettings] = useState<CustomizationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get(['customizationSettings']);
      if (result.customizationSettings) {
        setSettings({
          ...defaultSettings,
          ...result.customizationSettings
        });
      }
    } catch (error) {
      console.error('Failed to load customization settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<CustomizationSettings>) => {
    try {
      const updatedSettings = {
        ...settings,
        ...newSettings
      };
      await chrome.storage.local.set({ customizationSettings: updatedSettings });
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update customization settings:', error);
    }
  };

  useEffect(() => {
    loadSettings();
    
    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.customizationSettings) {
        setSettings({
          ...defaultSettings,
          ...changes.customizationSettings.newValue
        });
      }
    };

    chrome.storage.local.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.local.onChanged.removeListener(handleStorageChange);
  }, []);

  return {
    settings,
    loading,
    updateSettings,
    srs: settings.srs || defaultSettings.srs!,
    theme: settings.theme || defaultSettings.theme!,
    study: settings.study || defaultSettings.study!,
    accessibility: settings.accessibility || defaultSettings.accessibility!,
    audio: settings.audio || defaultSettings.audio!
  };
};