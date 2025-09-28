import React, { useState, useEffect } from 'react';
import { useChromeStorage } from '@/hooks/useChromeStorage';
import { useCustomizationSettings } from '@/hooks/useCustomizationSettings';
import { 
  Settings as SettingsIcon,
  Palette,
  Brain,
  Clock,
  Accessibility,
  Volume2,
  Download,
  Upload,
  AlertTriangle,
  Info,
  Save,
  Trash2,
  Check,
  X
} from 'lucide-react';

const Options: React.FC = () => {
  const { data, loading, saveData } = useChromeStorage();
  const { settings, updateSettings, srs, theme, study, accessibility, audio, loading: settingsLoading } = useCustomizationSettings();

  const [activeTab, setActiveTab] = useState<'srs' | 'theme' | 'study' | 'accessibility' | 'audio' | 'data'>('srs');
  const [saveNotification, setSaveNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Toast notification function
  const showNotification = (type: 'success' | 'error', message: string) => {
    setSaveNotification({ type, message });
    setTimeout(() => setSaveNotification(null), 3000);
  };

  // Apply theme changes to CSS custom properties in real-time
  useEffect(() => {
    if (!theme) return;
    
    const root = document.documentElement;
    
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    // Apply primary color
    const primaryRgb = hexToRgb(theme.primaryColor);
    if (primaryRgb) {
      root.style.setProperty('--color-primary', `${primaryRgb.r} ${primaryRgb.g} ${primaryRgb.b}`);
    }
    
    // Apply accent color
    const accentRgb = hexToRgb(theme.accentColor);
    if (accentRgb) {
      root.style.setProperty('--color-accent', `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}`);
    }
    
    // Apply dark mode
    if (theme.darkMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme.darkMode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto mode - check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  // Apply accessibility changes to the document
  useEffect(() => {
    if (!accessibility) return;
    
    const body = document.body;
    
    // Apply font size
    body.style.fontSize = accessibility.fontSize;
    
    // Apply high contrast
    if (accessibility.highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }
    
    // Apply reduced motion
    if (accessibility.reducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
    }
  }, [accessibility]);

  // Save settings functions using the hook
  const handleSaveSRSSettings = async () => {
    try {
      await updateSettings({ srs });
      showNotification('success', 'SRS settings saved successfully!');
    } catch (error) {
      console.error('Failed to save SRS settings:', error);
      showNotification('error', 'Failed to save SRS settings');
    }
  };

  const handleSaveThemeSettings = async () => {
    try {
      await updateSettings({ theme });
      showNotification('success', 'Theme settings saved successfully!');
    } catch (error) {
      console.error('Failed to save theme settings:', error);
      showNotification('error', 'Failed to save theme settings');
    }
  };

  const handleSaveStudySettings = async () => {
    try {
      await updateSettings({ study });
      showNotification('success', 'Study settings saved successfully!');
    } catch (error) {
      console.error('Failed to save study settings:', error);
      showNotification('error', 'Failed to save study settings');
    }
  };

  const handleSaveAccessibilitySettings = async () => {
    try {
      await updateSettings({ accessibility });
      showNotification('success', 'Accessibility settings saved successfully!');
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
      showNotification('error', 'Failed to save accessibility settings');
    }
  };

  const handleSaveAudioSettings = async () => {
    try {
      await updateSettings({ audio });
      showNotification('success', 'Audio settings saved successfully!');
    } catch (error) {
      console.error('Failed to save audio settings:', error);
      showNotification('error', 'Failed to save audio settings');
    }
  };

  // Reset individual tab functions using the hook
  const handleResetSRSSettings = async () => {
    const defaultSRS = {
      easeFactor: 2.5,
      easyBonus: 1.3,
      hardPenalty: 1.2,
      intervalModifier: 1.0,
      maximumInterval: 365,
      minimumInterval: 1,
      graduatingInterval: 1,
      easyInterval: 4
    };
    await updateSettings({ srs: defaultSRS });
    showNotification('success', 'SRS settings reset to defaults');
  };

  const handleResetThemeSettings = async () => {
    const defaultTheme = {
      primaryColor: '#3b82f6',
      accentColor: '#8b5cf6',
      fontSize: 'medium',
      fontFamily: 'Inter',
      borderRadius: 'medium',
      animation: true,
      darkMode: 'auto'
    };
    await updateSettings({ theme: defaultTheme });
    showNotification('success', 'Theme settings reset to defaults');
  };

  const handleResetStudySettings = async () => {
    const defaultStudy = {
      sessionLength: 20,
      breakReminder: true,
      breakInterval: 30,
      autoPlayAudio: true,
      showProgress: true,
      enableHints: true,
      retryOnMistake: true
    };
    await updateSettings({ study: defaultStudy });
    showNotification('success', 'Study settings reset to defaults');
  };

  const handleResetAccessibilitySettings = async () => {
    const defaultAccessibility = {
      fontSize: '90%',
      highContrast: false,
      reducedMotion: false,
      keyboardNavigation: false,
      screenReader: false,
      focusIndicators: false
    };
    await updateSettings({ accessibility: defaultAccessibility });
    showNotification('success', 'Accessibility settings reset to defaults');
  };

  const handleResetAudioSettings = async () => {
    const defaultAudio = {
      voiceSelection: 'default',
      speechRate: 1.0,
      speechVolume: 0.8,
      pronunciationAutoplay: true,
      soundEffects: true,
      notificationSounds: true
    };
    await updateSettings({ audio: defaultAudio });
    showNotification('success', 'Audio settings reset to defaults');
  };

  // Data Management Functions
  const handleExportData = async () => {
    try {
      const exportData = {
        vocabWords: data?.vocabWords || [],
        gamification: data?.gamification || {},
        analytics: data?.analytics || {},
        settings: settings,
        exportDate: new Date().toISOString(),
        version: '1.0.1'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vocab-srs-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data:', err);
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const importData = JSON.parse(text);
          
          if (importData.vocabWords && importData.settings) {
            await saveData(importData);
            alert('Data imported successfully!');
            window.location.reload();
          }
        } catch (err) {
          alert('Failed to import data. Please check the file format.');
        }
      }
    };
    input.click();
  };

  const handleResetSettings = async () => {
    if (confirm('This will reset all customization settings to defaults. Are you sure?')) {
      try {
        // Clear the customization settings in Chrome storage
        await chrome.storage.local.remove(['customizationSettings']);
        showNotification('success', 'All settings have been reset to defaults!');
      } catch (error) {
        console.error('Failed to reset settings:', error);
        showNotification('error', 'Failed to reset settings');
      }
    }
  };

  // Tab navigation
  const tabs = [
    { id: 'srs', label: 'SRS Algorithm', icon: Brain },
    { id: 'theme', label: 'Theme Studio', icon: Palette },
    { id: 'study', label: 'Study Settings', icon: Clock },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { id: 'audio', label: 'Audio Settings', icon: Volume2 },
    { id: 'data', label: 'Data Management', icon: Download }
  ];

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-dark-background dark:to-dark-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-foreground-secondary">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-dark-background dark:to-dark-background-secondary p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-3 gradient-text">
            <SettingsIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            Study Customization Hub
          </h1>
          <p className="text-foreground-secondary">Personalize your learning experience with advanced settings</p>
        </div>

        {/* Tab Navigation */}
        <div className="card p-2 mb-8 bg-background shadow-soft">
          <nav className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white shadow-green-glow'
                      : 'text-foreground-secondary hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-foreground'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          
          {/* SRS Algorithm Tab */}
          {activeTab === 'srs' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                SRS Algorithm Fine-tuning
              </h2>
              <p className="text-foreground-secondary mb-6">Adjust the Spaced Repetition System parameters to match your learning style</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ease Factor (Default: 2.5)
                  </label>
                  <input
                    type="range"
                    min="2.0"
                    max="3.0"
                    step="0.1"
                    value={srs.easeFactor}
                    onChange={(e) => updateSettings({ srs: { ...srs, easeFactor: parseFloat(e.target.value) } })}
                    className="w-full mb-2"
                  />
                  <div className="text-sm text-foreground-secondary">
                    Current: {srs.easeFactor} - Controls how quickly intervals increase
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Easy Bonus (Default: 1.3)
                  </label>
                  <input
                    type="range"
                    min="1.1"
                    max="1.5"
                    step="0.1"
                    value={srs.easyBonus}
                    onChange={(e) => updateSettings({ srs: { ...srs, easyBonus: parseFloat(e.target.value) } })}
                    className="w-full mb-2"
                  />
                  <div className="text-sm text-foreground-secondary">
                    Current: {srs.easyBonus} - Bonus multiplier for easy cards
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Hard Penalty (Default: 1.2)
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="1.5"
                    step="0.1"
                    value={srs.hardPenalty}
                    onChange={(e) => updateSettings({ srs: { ...srs, hardPenalty: parseFloat(e.target.value) } })}
                    className="w-full mb-2"
                  />
                  <div className="text-sm text-foreground-secondary">
                    Current: {srs.hardPenalty} - Penalty multiplier for hard cards
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Maximum Interval (days)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="36500"
                    value={srs.maximumInterval}
                    onChange={(e) => updateSettings({ srs: { ...srs, maximumInterval: parseInt(e.target.value) } })}
                    className="input w-full"
                  />
                  <div className="text-sm text-foreground-secondary">
                    Maximum days between reviews
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button onClick={handleSaveSRSSettings} className="btn btn-primary px-6 py-3">
                  <Save className="w-4 h-4 mr-2" />
                  Save SRS Settings
                </button>
                <button 
                  onClick={handleResetSRSSettings}
                  className="btn btn-outline px-6 py-3"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset to Default
                </button>
              </div>
            </div>
          )}
          
          {/* Theme Studio Tab */}
          {activeTab === 'theme' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                Theme Studio
              </h2>
              <p className="text-foreground-secondary mb-6">Customize the visual appearance of your learning interface</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => updateSettings({ theme: { ...theme, primaryColor: e.target.value } })}
                    className="w-full h-12 rounded-lg border border-border cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Accent Color
                  </label>
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => updateSettings({ theme: { ...theme, accentColor: e.target.value } })}
                    className="w-full h-12 rounded-lg border border-border cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Font Size
                  </label>
                  <select
                    value={theme.fontSize}
                    onChange={(e) => updateSettings({ theme: { ...theme, fontSize: e.target.value } })}
                    className="input w-full"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra-large">Extra Large</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Font Family
                  </label>
                  <select
                    value={theme.fontFamily}
                    onChange={(e) => updateSettings({ theme: { ...theme, fontFamily: e.target.value } })}
                    className="input w-full"
                  >
                    <option value="Inter">Inter (Default)</option>
                    <option value="system">System Font</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button onClick={handleSaveThemeSettings} className="btn btn-primary px-6 py-3">
                  <Save className="w-4 h-4 mr-2" />
                  Save Theme Settings
                </button>
                <button 
                  onClick={handleResetThemeSettings}
                  className="btn btn-outline px-6 py-3"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset to Default
                </button>
              </div>
            </div>
          )}
          
          {/* Study Settings Tab */}
          {activeTab === 'study' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                Study Preferences
              </h2>
              <p className="text-foreground-secondary mb-6">Configure your study sessions for optimal learning</p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Default Session Length (words)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={study.sessionLength}
                      onChange={(e) => updateSettings({ study: { ...study, sessionLength: parseInt(e.target.value) } })}
                      className="input w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Break Reminder (minutes)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="60"
                      value={study.breakInterval}
                      onChange={(e) => updateSettings({ study: { ...study, breakInterval: parseInt(e.target.value) } })}
                      className="input w-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Auto-play Audio</h3>
                      <p className="text-sm text-foreground-secondary">Automatically play pronunciation after revealing answer</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={study.autoPlayAudio}
                        onChange={(e) => updateSettings({ study: { ...study, autoPlayAudio: e.target.checked } })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Show Progress Bar</h3>
                      <p className="text-sm text-foreground-secondary">Display progress indicator during study sessions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={study.showProgress}
                        onChange={(e) => updateSettings({ study: { ...study, showProgress: e.target.checked } })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button onClick={handleSaveStudySettings} className="btn btn-primary px-6 py-3">
                  <Save className="w-4 h-4 mr-2" />
                  Save Study Settings
                </button>
                <button 
                  onClick={handleResetStudySettings}
                  className="btn btn-outline px-6 py-3"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset to Default
                </button>
              </div>
            </div>
          )}
          
          {/* Accessibility Tab */}
          {activeTab === 'accessibility' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Accessibility className="w-5 h-5 text-orange-600" />
                Accessibility Options
              </h2>
              <p className="text-foreground-secondary mb-6">Make VocaPi more accessible and comfortable to use</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Font Size Scale
                  </label>
                  <input
                    type="range"
                    min="80"
                    max="150"
                    step="10"
                    value={parseInt(accessibility.fontSize.replace('%', ''))}
                    onChange={(e) => updateSettings({ accessibility: { ...accessibility, fontSize: e.target.value + '%' } })}
                    className="w-full mb-2"
                  />
                  <div className="text-sm text-foreground-secondary">
                    Current: {accessibility.fontSize}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">High Contrast Mode</h3>
                      <p className="text-sm text-foreground-secondary">Increase contrast for better visibility</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={accessibility.highContrast}
                        onChange={(e) => updateSettings({ accessibility: { ...accessibility, highContrast: e.target.checked } })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Reduced Motion</h3>
                      <p className="text-sm text-foreground-secondary">Minimize animations and transitions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={accessibility.reducedMotion}
                        onChange={(e) => updateSettings({ accessibility: { ...accessibility, reducedMotion: e.target.checked } })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Enhanced Focus Indicators</h3>
                      <p className="text-sm text-foreground-secondary">Stronger visual focus indicators for keyboard navigation</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={accessibility.focusIndicators}
                        onChange={(e) => updateSettings({ accessibility: { ...accessibility, focusIndicators: e.target.checked } })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button onClick={handleSaveAccessibilitySettings} className="btn btn-primary px-6 py-3">
                  <Save className="w-4 h-4 mr-2" />
                  Save Accessibility Settings
                </button>
                <button 
                  onClick={handleResetAccessibilitySettings}
                  className="btn btn-outline px-6 py-3"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset to Default
                </button>
              </div>
            </div>
          )}
          
          {/* Audio Settings Tab */}
          {activeTab === 'audio' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-indigo-600" />
                Audio Settings
              </h2>
              <p className="text-foreground-secondary mb-6">Configure voice and sound preferences</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Speech Rate
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={audio.speechRate}
                    onChange={(e) => updateSettings({ audio: { ...audio, speechRate: parseFloat(e.target.value) } })}
                    className="w-full mb-2"
                  />
                  <div className="text-sm text-foreground-secondary">
                    Current: {audio.speechRate}x speed
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Speech Volume
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={audio.speechVolume}
                    onChange={(e) => updateSettings({ audio: { ...audio, speechVolume: parseFloat(e.target.value) } })}
                    className="w-full mb-2"
                  />
                  <div className="text-sm text-foreground-secondary">
                    Current: {Math.round(audio.speechVolume * 100)}%
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Sound Effects</h3>
                      <p className="text-sm text-foreground-secondary">Play sound effects for interactions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={audio.soundEffects}
                        onChange={(e) => updateSettings({ audio: { ...audio, soundEffects: e.target.checked } })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Notification Sounds</h3>
                      <p className="text-sm text-foreground-secondary">Play sounds for notifications and alerts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={audio.notificationSounds}
                        onChange={(e) => updateSettings({ audio: { ...audio, notificationSounds: e.target.checked } })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button onClick={handleSaveAudioSettings} className="btn btn-primary px-6 py-3">
                  <Save className="w-4 h-4 mr-2" />
                  Save Audio Settings
                </button>
                <button 
                  onClick={handleResetAudioSettings}
                  className="btn btn-outline px-6 py-3"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset to Default
                </button>
              </div>
            </div>
          )}
          
          {/* Data Management Tab */}
          {activeTab === 'data' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-green-600" />
                Data Management
              </h2>
              <p className="text-foreground-secondary mb-6">Import, export, and manage your vocabulary data</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-4">
                    <Download className="w-6 h-6 text-blue-600" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Export Data</h3>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    Download your complete vocabulary database, including all words, progress, and settings as a backup file.
                  </p>
                  <button onClick={handleExportData} className="btn btn-primary w-full px-6 py-3">
                    <Download className="w-4 h-4 mr-2" />
                    Export All Data
                  </button>
                </div>
                
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-4">
                    <Upload className="w-6 h-6 text-green-600" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Import Data</h3>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                    Upload vocabulary data from a backup file or another vocabulary learning app.
                  </p>
                  <button onClick={handleImportData} className="btn btn-success w-full px-6 py-3">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </button>
                </div>
              </div>
              
              {/* Data Statistics */}
              <div className="p-6 bg-surface rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-gray-500" />
                  Data Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{data?.vocabWords?.length || 0}</div>
                    <div className="text-sm text-foreground-secondary">Total Words</div>
                  </div>
                  <div className="p-4 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{data?.gamification?.level || 1}</div>
                    <div className="text-sm text-foreground-secondary">Current Level</div>
                  </div>
                  <div className="p-4 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{data?.gamification?.streak || 0}</div>
                    <div className="text-sm text-foreground-secondary">Day Streak</div>
                  </div>
                  <div className="p-4 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{data?.analytics?.accuracy || 0}%</div>
                    <div className="text-sm text-foreground-secondary">Accuracy</div>
                  </div>
                </div>
              </div>
              
              {/* Danger Zone */}
              <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Danger Zone
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  These actions cannot be undone. Please proceed with caution.
                </p>
                <button 
                  onClick={handleResetSettings} 
                  className="btn btn-danger px-6 py-3"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset All Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {saveNotification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border flex items-center gap-3 animate-slide-in-right ${
          saveNotification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200' 
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
        }`}>
          {saveNotification.type === 'success' ? (
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <X className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <span className="font-medium">{saveNotification.message}</span>
        </div>
      )}
    </div>
  );
};

export default Options;
