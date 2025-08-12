// Internationalization Manager
class I18nManager {
  constructor() {
    this.currentLanguage = 'en';
    this.fallbackLanguage = 'en';
    this.translations = new Map();
    this.dateFormats = new Map();
    this.numberFormats = new Map();
    
    this.supportedLanguages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' }
    ];
    
    this.init();
  }

  async init() {
    // Detect user language
    await this.detectUserLanguage();
    
    // Load translations
    await this.loadTranslations(this.currentLanguage);
    
    // Setup formatters
    this.setupFormatters();
    
    // Apply translations to current page
    this.translatePage();
  }

  async detectUserLanguage() {
    try {
      // Check saved preference
      const result = await chrome.storage.local.get(['selectedLanguage']);
      if (result.selectedLanguage) {
        this.currentLanguage = result.selectedLanguage;
        return;
      }
    } catch (error) {
      console.warn('Language preference load error:', error);
    }
    
    // Detect from browser
    const browserLanguage = navigator.language || navigator.languages[0];
    const languageCode = browserLanguage.split('-')[0];
    
    if (this.supportedLanguages.some(lang => lang.code === languageCode)) {
      this.currentLanguage = languageCode;
    }
  }

  async loadTranslations(languageCode) {
    try {
      const translations = await this.getTranslationsForLanguage(languageCode);
      this.translations.set(languageCode, translations);
    } catch (error) {
      console.error(`Failed to load translations for ${languageCode}:`, error);
      
      // Load fallback language if not already loaded
      if (languageCode !== this.fallbackLanguage) {
        await this.loadTranslations(this.fallbackLanguage);
      }
    }
  }

  async getTranslationsForLanguage(languageCode) {
    // In a real implementation, this would load from external files
    // For now, we'll return embedded translations
    const translationData = {
      en: {
        // App General
        appName: 'Vocab SRS',
        appDescription: 'Spaced Repetition Vocabulary Learning',
        
        // Navigation
        home: 'Home',
        review: 'Review',
        analytics: 'Analytics', 
        settings: 'Settings',
        
        // Common Actions
        add: 'Add',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel',
        close: 'Close',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        export: 'Export',
        import: 'Import',
        backup: 'Backup',
        restore: 'Restore',
        sync: 'Sync',
        
        // Vocabulary
        word: 'Word',
        definition: 'Definition',
        pronunciation: 'Pronunciation',
        example: 'Example',
        category: 'Category',
        difficulty: 'Difficulty',
        
        // Review System
        reviewWord: 'Review Word',
        showAnswer: 'Show Answer',
        quality: 'How well did you remember?',
        qualityLabels: {
          0: 'Complete blackout',
          1: 'Incorrect, but familiar',
          2: 'Incorrect, but easy',
          3: 'Correct, difficult',
          4: 'Correct, hesitated',
          5: 'Perfect recall'
        },
        
        // Analytics
        totalWords: 'Total Words',
        wordsReviewed: 'Words Reviewed',
        accuracy: 'Accuracy',
        streak: 'Study Streak',
        timeSpent: 'Time Spent',
        
        // Cloud Sync
        cloudSync: 'Cloud Sync',
        syncEnabled: 'Sync Enabled',
        syncDisabled: 'Sync Disabled',
        lastSync: 'Last Sync',
        syncNow: 'Sync Now',
        
        // Messages
        addedSuccessfully: 'Word added successfully!',
        updatedSuccessfully: 'Word updated successfully!',
        deletedSuccessfully: 'Word deleted successfully!',
        syncSuccessful: 'Sync completed successfully!',
        exportSuccessful: 'Data exported successfully!',
        importSuccessful: 'Data imported successfully!',
        
        // Errors
        errorGeneric: 'An error occurred',
        errorNetwork: 'Network error',
        errorSync: 'Sync failed',
        errorImport: 'Import failed',
        errorExport: 'Export failed',
        
        // Time formats
        today: 'Today',
        yesterday: 'Yesterday',
        daysAgo: '{count} days ago',
        hoursAgo: '{count} hours ago',
        minutesAgo: '{count} minutes ago',
        justNow: 'Just now'
      },
      
      vi: {
        // App General
        appName: 'Vocab SRS',
        appDescription: 'Học từ vựng với lặp lại ngắt quãng',
        
        // Navigation
        home: 'Trang chủ',
        review: 'Ôn tập',
        analytics: 'Thống kê',
        settings: 'Cài đặt',
        
        // Common Actions
        add: 'Thêm',
        edit: 'Sửa',
        delete: 'Xóa',
        save: 'Lưu',
        cancel: 'Hủy',
        close: 'Đóng',
        search: 'Tìm kiếm',
        filter: 'Lọc',
        sort: 'Sắp xếp',
        export: 'Xuất',
        import: 'Nhập',
        backup: 'Sao lưu',
        restore: 'Khôi phục',
        sync: 'Đồng bộ',
        
        // Vocabulary
        word: 'Từ',
        definition: 'Nghĩa',
        pronunciation: 'Phát âm',
        example: 'Ví dụ',
        category: 'Danh mục',
        difficulty: 'Độ khó',
        
        // Review System
        reviewWord: 'Ôn tập từ',
        showAnswer: 'Hiện đáp án',
        quality: 'Bạn nhớ tốt như thế nào?',
        qualityLabels: {
          0: 'Hoàn toàn không nhớ',
          1: 'Sai, nhưng quen thuộc',
          2: 'Sai, nhưng dễ',
          3: 'Đúng, khó',
          4: 'Đúng, do dự',
          5: 'Nhớ hoàn hảo'
        },
        
        // Analytics
        totalWords: 'Tổng từ',
        wordsReviewed: 'Từ đã ôn',
        accuracy: 'Độ chính xác',
        streak: 'Chuỗi học tập',
        timeSpent: 'Thời gian học',
        
        // Cloud Sync
        cloudSync: 'Đồng bộ đám mây',
        syncEnabled: 'Đã bật đồng bộ',
        syncDisabled: 'Đã tắt đồng bộ',
        lastSync: 'Đồng bộ cuối',
        syncNow: 'Đồng bộ ngay',
        
        // Messages
        addedSuccessfully: 'Đã thêm từ thành công!',
        updatedSuccessfully: 'Đã cập nhật từ thành công!',
        deletedSuccessfully: 'Đã xóa từ thành công!',
        syncSuccessful: 'Đồng bộ hoàn tất thành công!',
        exportSuccessful: 'Xuất dữ liệu thành công!',
        importSuccessful: 'Nhập dữ liệu thành công!',
        
        // Errors
        errorGeneric: 'Đã xảy ra lỗi',
        errorNetwork: 'Lỗi mạng',
        errorSync: 'Đồng bộ thất bại',
        errorImport: 'Nhập thất bại',
        errorExport: 'Xuất thất bại',
        
        // Time formats
        today: 'Hôm nay',
        yesterday: 'Hôm qua',
        daysAgo: '{count} ngày trước',
        hoursAgo: '{count} giờ trước',
        minutesAgo: '{count} phút trước',
        justNow: 'Vừa xong'
      }
    };
    
    return translationData[languageCode] || translationData[this.fallbackLanguage];
  }

  setupFormatters() {
    // Date formatters
    this.dateFormats.set(this.currentLanguage, new Intl.DateTimeFormat(this.currentLanguage, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
    
    // Number formatters
    this.numberFormats.set(this.currentLanguage, new Intl.NumberFormat(this.currentLanguage));
  }

  translate(key, params = {}) {
    const translations = this.translations.get(this.currentLanguage) || 
                        this.translations.get(this.fallbackLanguage);
    
    if (!translations) {
      return key;
    }
    
    let text = translations[key] || key;
    
    // Replace parameters
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(new RegExp(`{${param}}`, 'g'), value);
    });
    
    return text;
  }

  // Alias for translate
  t(key, params = {}) {
    return this.translate(key, params);
  }

  formatDate(date, options = {}) {
    if (!date) return '';
    
    const formatter = this.dateFormats.get(this.currentLanguage);
    if (formatter) {
      return formatter.format(new Date(date));
    }
    
    return new Date(date).toLocaleDateString();
  }

  formatNumber(number) {
    if (typeof number !== 'number') return number;
    
    const formatter = this.numberFormats.get(this.currentLanguage);
    if (formatter) {
      return formatter.format(number);
    }
    
    return number.toLocaleString();
  }

  formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    
    if (diff < minute) {
      return this.translate('justNow');
    } else if (diff < hour) {
      const minutes = Math.floor(diff / minute);
      return this.translate('minutesAgo', { count: minutes });
    } else if (diff < day) {
      const hours = Math.floor(diff / hour);
      return this.translate('hoursAgo', { count: hours });
    } else if (diff < 2 * day) {
      return this.translate('yesterday');
    } else {
      const days = Math.floor(diff / day);
      return this.translate('daysAgo', { count: days });
    }
  }

  async setLanguage(languageCode) {
    if (!this.supportedLanguages.some(lang => lang.code === languageCode)) {
      throw new Error(`Unsupported language: ${languageCode}`);
    }
    
    this.currentLanguage = languageCode;
    
    // Save preference
    try {
      await chrome.storage.local.set({ selectedLanguage: languageCode });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
    
    // Load translations if not already loaded
    if (!this.translations.has(languageCode)) {
      await this.loadTranslations(languageCode);
    }
    
    // Setup formatters
    this.setupFormatters();
    
    // Retranslate page
    this.translatePage();
    
    // Update document language
    document.documentElement.lang = languageCode;
    
    // Broadcast language change
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'LANGUAGE_CHANGED',
        language: languageCode
      });
    }
  }

  translatePage() {
    // Translate elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.translate(key);
      
      if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'email')) {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });
    
    // Translate elements with data-i18n-title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.translate(key);
    });
    
    // Translate elements with data-i18n-aria-label attribute
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria-label');
      element.setAttribute('aria-label', this.translate(key));
    });
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getSupportedLanguages() {
    return [...this.supportedLanguages];
  }

  getLanguageInfo(languageCode) {
    return this.supportedLanguages.find(lang => lang.code === languageCode);
  }

  // Get text direction for current language
  getTextDirection() {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(this.currentLanguage) ? 'rtl' : 'ltr';
  }

  // Apply text direction to document
  applyTextDirection() {
    document.documentElement.dir = this.getTextDirection();
  }

  // Format currency (if needed for premium features)
  formatCurrency(amount, currency = 'USD') {
    try {
      return new Intl.NumberFormat(this.currentLanguage, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount}`;
    }
  }

  // Export translations for debugging
  exportTranslations() {
    const translations = {};
    for (const [lang, data] of this.translations) {
      translations[lang] = data;
    }
    return translations;
  }
}

// Initialize i18n manager
if (typeof window !== 'undefined') {
  window.I18nManager = I18nManager;
  window.i18n = new I18nManager();
  
  // Global translation function
  window.t = (key, params) => window.i18n.translate(key, params);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18nManager;
}
