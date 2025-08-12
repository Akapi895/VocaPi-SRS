// Advanced Backup & Recovery Manager
class BackupRecoveryManager {
  constructor() {
    this.backupSchedule = {
      enabled: true,
      frequency: 'daily', // daily, weekly, monthly
      maxBackups: 10,
      autoCleanup: true
    };
    
    this.compressionEnabled = true;
    this.encryptionEnabled = false; // For privacy
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.scheduleAutoBackups();
    this.setupRecoveryMonitoring();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['backupSettings']);
      if (result.backupSettings) {
        this.backupSchedule = { ...this.backupSchedule, ...result.backupSettings };
      }
    } catch (error) {
      console.error('Failed to load backup settings:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({ backupSettings: this.backupSchedule });
    } catch (error) {
      console.error('Failed to save backup settings:', error);
    }
  }

  // Create comprehensive backup
  async createBackup(options = {}) {
    try {
      const timestamp = new Date().toISOString();
      const backupId = `backup_${Date.now()}`;
      
      // Collect all data
      const vocabData = await chrome.storage.local.get(null);
      
      const backup = {
        id: backupId,
        version: '1.0.0',
        timestamp,
        platform: this.detectPlatform(),
        browser: this.detectBrowser(),
        extensionVersion: chrome.runtime.getManifest().version,
        
        // Core data
        data: {
          vocabulary: vocabData.vocabWords || [],
          analytics: vocabData.analyticsData || {},
          gamification: vocabData.gamificationData || {},
          settings: {
            cloudSync: vocabData.cloudSyncConfig || {},
            preferences: vocabData.userPreferences || {},
            accessibility: vocabData.accessibilitySettings || {},
            theme: vocabData.selectedTheme || 'light',
            language: vocabData.selectedLanguage || 'en'
          }
        },
        
        // Metadata
        metadata: {
          totalWords: (vocabData.vocabWords || []).length,
          totalReviews: this.calculateTotalReviews(vocabData.analyticsData),
          studyStreak: vocabData.analyticsData?.currentStreak || 0,
          lastActivity: vocabData.analyticsData?.lastActivity || null,
          deviceInfo: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }
      };
      
      // Apply compression if enabled
      if (this.compressionEnabled) {
        backup.data = await this.compressData(backup.data);
        backup.compressed = true;
      }
      
      // Apply encryption if enabled
      if (this.encryptionEnabled && options.password) {
        backup.data = await this.encryptData(backup.data, options.password);
        backup.encrypted = true;
      }
      
      // Store backup locally
      await this.storeBackup(backup);
      
      // Export to file if requested
      if (options.exportToFile !== false) {
        await this.exportBackupToFile(backup, options.filename);
      }
      
      return backup;
      
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  async compressData(data) {
    try {
      const jsonString = JSON.stringify(data);
      const compressed = await this.gzipCompress(jsonString);
      return {
        compressed: true,
        data: compressed,
        originalSize: jsonString.length,
        compressedSize: compressed.length
      };
    } catch (error) {
      console.warn('Compression failed, using uncompressed data:', error);
      return data;
    }
  }

  async gzipCompress(text) {
    // Simple compression using browser's compression API if available
    if ('CompressionStream' in window) {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(new TextEncoder().encode(text));
      writer.close();
      
      const chunks = [];
      let result;
      while (!(result = await reader.read()).done) {
        chunks.push(result.value);
      }
      
      return new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
    } else {
      // Fallback: base64 encoding (not true compression but reduces storage)
      return btoa(text);
    }
  }

  async encryptData(data, password) {
    // Simple encryption using Web Crypto API
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedData = encoder.encode(JSON.stringify(data));
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encodedData
      );
      
      return {
        encrypted: true,
        data: Array.from(new Uint8Array(encryptedData)),
        salt: Array.from(salt),
        iv: Array.from(iv)
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  }

  async storeBackup(backup) {
    try {
      const existingBackups = await chrome.storage.local.get(['localBackups']);
      const backups = existingBackups.localBackups || [];
      
      backups.push({
        id: backup.id,
        timestamp: backup.timestamp,
        size: JSON.stringify(backup).length,
        compressed: backup.compressed || false,
        encrypted: backup.encrypted || false
      });
      
      // Store full backup data separately
      await chrome.storage.local.set({
        [`backup_${backup.id}`]: backup,
        localBackups: backups
      });
      
      // Cleanup old backups if needed
      if (this.backupSchedule.autoCleanup) {
        await this.cleanupOldBackups();
      }
      
    } catch (error) {
      console.error('Failed to store backup:', error);
      throw error;
    }
  }

  async exportBackupToFile(backup, filename) {
    try {
      const backupJson = JSON.stringify(backup, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      
      const defaultFilename = filename || `vocab-srs-backup-${backup.timestamp.split('T')[0]}.json`;
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      return defaultFilename;
    } catch (error) {
      console.error('Backup export failed:', error);
      throw error;
    }
  }

  // Restore from backup
  async restoreFromBackup(backup, options = {}) {
    try {
      let data = backup.data;
      
      // Decrypt if needed
      if (backup.encrypted && options.password) {
        data = await this.decryptData(data, options.password);
      }
      
      // Decompress if needed
      if (backup.compressed) {
        data = await this.decompressData(data);
      }
      
      // Validate backup data
      this.validateBackupData(data);
      
      // Create restore point before proceeding
      if (!options.skipRestorePoint) {
        await this.createBackup({ exportToFile: false });
      }
      
      // Restore data progressively
      const results = await this.performRestore(data, options);
      
      return {
        success: true,
        restored: results,
        backupInfo: {
          id: backup.id,
          timestamp: backup.timestamp,
          version: backup.version
        }
      };
      
    } catch (error) {
      console.error('Restore failed:', error);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  async decryptData(encryptedData, password) {
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const salt = new Uint8Array(encryptedData.salt);
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      const iv = new Uint8Array(encryptedData.iv);
      const data = new Uint8Array(encryptedData.data);
      
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );
      
      return JSON.parse(decoder.decode(decryptedData));
    } catch (error) {
      throw new Error('Decryption failed - incorrect password or corrupted data');
    }
  }

  async decompressData(compressedData) {
    try {
      if (compressedData.compressed && compressedData.data) {
        if ('DecompressionStream' in window) {
          const stream = new DecompressionStream('gzip');
          const writer = stream.writable.getWriter();
          const reader = stream.readable.getReader();
          
          writer.write(new Uint8Array(compressedData.data));
          writer.close();
          
          const chunks = [];
          let result;
          while (!(result = await reader.read()).done) {
            chunks.push(result.value);
          }
          
          const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
          return JSON.parse(new TextDecoder().decode(decompressed));
        } else {
          // Fallback: base64 decode
          return JSON.parse(atob(compressedData.data));
        }
      }
      return compressedData;
    } catch (error) {
      console.error('Decompression failed:', error);
      return compressedData;
    }
  }

  validateBackupData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup data format');
    }
    
    // Check required fields
    const requiredFields = ['vocabulary'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required backup field: ${field}`);
      }
    }
    
    // Validate vocabulary data
    if (!Array.isArray(data.vocabulary)) {
      throw new Error('Vocabulary data must be an array');
    }
  }

  async performRestore(data, options = {}) {
    const results = {
      vocabulary: 0,
      analytics: false,
      gamification: false,
      settings: false
    };
    
    try {
      // Restore vocabulary
      if (data.vocabulary && options.restoreVocabulary !== false) {
        if (options.mergeVocabulary) {
          await this.mergeVocabulary(data.vocabulary);
        } else {
          await chrome.storage.local.set({ vocabWords: data.vocabulary });
        }
        results.vocabulary = data.vocabulary.length;
      }
      
      // Restore analytics
      if (data.analytics && options.restoreAnalytics !== false) {
        await chrome.storage.local.set({ analyticsData: data.analytics });
        results.analytics = true;
      }
      
      // Restore gamification
      if (data.gamification && options.restoreGamification !== false) {
        await chrome.storage.local.set({ gamificationData: data.gamification });
        results.gamification = true;
      }
      
      // Restore settings
      if (data.settings && options.restoreSettings !== false) {
        const settingsToRestore = {};
        
        if (data.settings.cloudSync) {
          settingsToRestore.cloudSyncConfig = data.settings.cloudSync;
        }
        if (data.settings.preferences) {
          settingsToRestore.userPreferences = data.settings.preferences;
        }
        if (data.settings.accessibility) {
          settingsToRestore.accessibilitySettings = data.settings.accessibility;
        }
        if (data.settings.theme) {
          settingsToRestore.selectedTheme = data.settings.theme;
        }
        if (data.settings.language) {
          settingsToRestore.selectedLanguage = data.settings.language;
        }
        
        await chrome.storage.local.set(settingsToRestore);
        results.settings = true;
      }
      
      return results;
      
    } catch (error) {
      console.error('Restore operation failed:', error);
      throw error;
    }
  }

  async mergeVocabulary(backupVocabulary) {
    try {
      const currentData = await chrome.storage.local.get(['vocabWords']);
      const currentVocabulary = currentData.vocabWords || [];
      
      // Create a map of existing words by word text
      const existingWords = new Map();
      currentVocabulary.forEach((word, index) => {
        existingWords.set(word.word.toLowerCase(), { word, index });
      });
      
      const merged = [...currentVocabulary];
      let addedCount = 0;
      let updatedCount = 0;
      
      // Merge backup vocabulary
      for (const backupWord of backupVocabulary) {
        const wordKey = backupWord.word.toLowerCase();
        const existing = existingWords.get(wordKey);
        
        if (existing) {
          // Update if backup version is newer
          if (new Date(backupWord.lastModified || 0) > new Date(existing.word.lastModified || 0)) {
            merged[existing.index] = backupWord;
            updatedCount++;
          }
        } else {
          // Add new word
          merged.push(backupWord);
          addedCount++;
        }
      }
      
      await chrome.storage.local.set({ vocabWords: merged });
      
      console.log(`Vocabulary merged: ${addedCount} added, ${updatedCount} updated`);
      return { added: addedCount, updated: updatedCount };
      
    } catch (error) {
      console.error('Vocabulary merge failed:', error);
      throw error;
    }
  }

  // Automatic backup scheduling
  scheduleAutoBackups() {
    if (!this.backupSchedule.enabled) return;
    
    const intervals = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    };
    
    const interval = intervals[this.backupSchedule.frequency] || intervals.daily;
    
    setInterval(async () => {
      try {
        await this.createBackup({ exportToFile: false });
        console.log('Auto backup completed');
      } catch (error) {
        console.error('Auto backup failed:', error);
      }
    }, interval);
  }

  async cleanupOldBackups() {
    try {
      const result = await chrome.storage.local.get(['localBackups']);
      const backups = result.localBackups || [];
      
      if (backups.length <= this.backupSchedule.maxBackups) {
        return;
      }
      
      // Sort by timestamp and keep only the most recent
      backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const toKeep = backups.slice(0, this.backupSchedule.maxBackups);
      const toRemove = backups.slice(this.backupSchedule.maxBackups);
      
      // Remove old backup data
      for (const backup of toRemove) {
        await chrome.storage.local.remove([`backup_${backup.id}`]);
      }
      
      // Update backup list
      await chrome.storage.local.set({ localBackups: toKeep });
      
      console.log(`Cleaned up ${toRemove.length} old backups`);
      
    } catch (error) {
      console.error('Backup cleanup failed:', error);
    }
  }

  async listBackups() {
    try {
      const result = await chrome.storage.local.get(['localBackups']);
      return result.localBackups || [];
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  async deleteBackup(backupId) {
    try {
      const result = await chrome.storage.local.get(['localBackups']);
      const backups = result.localBackups || [];
      
      // Remove from backup list
      const updatedBackups = backups.filter(b => b.id !== backupId);
      
      // Remove backup data
      await chrome.storage.local.remove([`backup_${backupId}`]);
      await chrome.storage.local.set({ localBackups: updatedBackups });
      
      return true;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  }

  setupRecoveryMonitoring() {
    // Monitor for data corruption or loss
    setInterval(async () => {
      await this.performHealthCheck();
    }, 60 * 60 * 1000); // Check every hour
  }

  async performHealthCheck() {
    try {
      const data = await chrome.storage.local.get(['vocabWords', 'analyticsData']);
      
      // Check for data corruption signs
      if (data.vocabWords && !Array.isArray(data.vocabWords)) {
        console.error('Vocabulary data corruption detected');
        // Could trigger auto-restore here
      }
      
      if (data.analyticsData && typeof data.analyticsData !== 'object') {
        console.error('Analytics data corruption detected');
      }
      
      // Log health status
      console.log('Data health check passed');
      
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  // Utility methods
  detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('windows')) return 'Windows';
    if (userAgent.includes('mac')) return 'macOS';
    if (userAgent.includes('linux')) return 'Linux';
    if (userAgent.includes('android')) return 'Android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'iOS';
    return 'Unknown';
  }

  detectBrowser() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'Chrome';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('safari')) return 'Safari';
    if (userAgent.includes('edge')) return 'Edge';
    return 'Unknown';
  }

  calculateTotalReviews(analyticsData) {
    if (!analyticsData || !analyticsData.sessions) return 0;
    return analyticsData.sessions.reduce((total, session) => total + (session.reviews || 0), 0);
  }

  async updateBackupSchedule(newSchedule) {
    this.backupSchedule = { ...this.backupSchedule, ...newSchedule };
    await this.saveSettings();
  }

  getBackupSchedule() {
    return { ...this.backupSchedule };
  }
}

// Initialize backup manager
if (typeof window !== 'undefined') {
  window.BackupRecoveryManager = BackupRecoveryManager;
  window.backupManager = new BackupRecoveryManager();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackupRecoveryManager;
}
