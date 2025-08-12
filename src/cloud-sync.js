// Cloud Sync & Backup System for Vocab SRS Extension
class CloudSyncManager {
  constructor() {
    this.storageKey = 'vocabCloudSync';
    this.isInitialized = false;
    this.syncInProgress = false;
    this.lastSyncAttempt = null;
    this.consecutiveFailures = 0;
    this.maxRetries = 5;
    this.baseRetryDelay = 1000; // 1 second
    
    // Event listeners for data changes
    this.eventListeners = new Map();
    
    // Sync configuration
    this.config = {
      autoSyncEnabled: true,
      autoSyncInterval: 5 * 60 * 1000, // 5 minutes
      compressionEnabled: true,
      encryptionEnabled: true,
      maxBackupVersions: 10,
      conflictResolutionStrategy: 'merge', // 'local', 'remote', 'merge', 'ask'
      syncOnExtensionStart: true,
      syncOnDataChange: true,
      syncBeforeImportantActions: true
    };
    
    // Initialize encryption key
    this.initializeEncryption();
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🔄 Initializing Cloud Sync Manager...');
    
    try {
      // Load sync configuration
      await this.loadSyncConfig();
      
      // Initialize Firebase connection
      await this.initializeFirebase();
      
      // Set up auto-sync if enabled
      if (this.config.autoSyncEnabled) {
        this.startAutoSync();
      }
      
      // Set up data change listeners
      this.setupDataChangeListeners();
      
      // Perform initial sync if enabled
      if (this.config.syncOnExtensionStart) {
        setTimeout(() => this.performSync('startup'), 2000);
      }
      
      this.isInitialized = true;
      console.log('✅ Cloud Sync Manager initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Cloud Sync Manager:', error);
      throw error;
    }
  }
  
  // ========== FIREBASE INTEGRATION ==========
  
  async initializeFirebase() {
    try {
      // Load Firebase configuration from environment
      if (!window.envConfig) {
        throw new Error('Environment configuration not loaded');
      }
      
      await window.envConfig.loadConfig();
      const firebaseConfig = window.envConfig.getFirebaseConfig();
      
      // Check if Firebase is properly configured
      if (!window.envConfig.isFirebaseConfigured()) {
        console.warn('⚠️ Firebase not configured, running in demo mode');
        this.isDemoMode = true;
        return; // Skip Firebase initialization
      }
      
      console.log('🔥 Firebase configuration loaded:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        configured: true
      });
      
      // Store config for use in other methods
      this.firebaseConfig = firebaseConfig;
      this.isDemoMode = false;
      
      // Initialize authentication
      await this.initializeAuth();
      
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      
      // Fallback to demo mode
      this.isDemoMode = true;
      console.warn('🔧 Running in demo mode without cloud sync');
    }
  }
  
  async initializeAuth() {
    // Check if user is already authenticated
    const authData = await this.getAuthData();
    
    if (authData && authData.token) {
      console.log('👤 User already authenticated');
      return true;
    }
    
    // For now, use anonymous authentication
    // In production, implement proper Google OAuth
    const anonymousUser = await this.signInAnonymously();
    console.log('👤 Anonymous authentication successful');
    
    return true;
  }
  
  async signInAnonymously() {
    // Simulate Firebase anonymous auth
    const fakeToken = 'anonymous_' + Date.now() + '_' + Math.random();
    const authData = {
      token: fakeToken,
      userId: 'anon_' + Math.random().toString(36).substr(2, 9),
      provider: 'anonymous',
      createdAt: new Date().toISOString()
    };
    
    await this.saveAuthData(authData);
    return authData;
  }
  
  async getAuthData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['cloudAuthData'], (result) => {
        resolve(result.cloudAuthData || null);
      });
    });
  }
  
  async saveAuthData(authData) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ cloudAuthData: authData }, resolve);
    });
  }
  
  // ========== SYNC OPERATIONS ==========
  
  async performSync(trigger = 'manual') {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress, skipping...');
      return { success: false, message: 'Sync already in progress' };
    }
    
    // Check if Firebase is configured
    if (this.isDemoMode) {
      console.log('🔧 Demo mode: Simulating sync operation');
      return this.performDemoSync(trigger);
    }
    
    console.log(`🔄 Starting sync (trigger: ${trigger})...`);
    this.syncInProgress = true;
    this.lastSyncAttempt = Date.now();
    
    try {
      // Step 1: Get local data
      const localData = await this.getLocalData();
      console.log(`📊 Local data: ${localData.words.length} words, ${localData.analytics ? 'analytics' : 'no analytics'}`);
      
      // Step 2: Get remote data
      const remoteData = await this.getRemoteData();
      console.log(`☁️ Remote data: ${remoteData ? `${remoteData.words?.length || 0} words` : 'no remote data'}`);
      
      // Step 3: Resolve conflicts
      const mergedData = await this.resolveConflicts(localData, remoteData);
      console.log(`🔀 Merged data: ${mergedData.words.length} words`);
      
      // Step 4: Save merged data locally
      await this.saveLocalData(mergedData);
      
      // Step 5: Upload to cloud
      await this.uploadToCloud(mergedData);
      
      // Step 6: Update sync metadata
      await this.updateSyncMetadata({
        lastSyncTime: Date.now(),
        lastSyncTrigger: trigger,
        syncSuccess: true,
        wordsCount: mergedData.words.length
      });
      
      this.consecutiveFailures = 0;
      console.log('✅ Sync completed successfully');
      
      // Notify listeners
      this.emit('syncComplete', { success: true, trigger, wordsCount: mergedData.words.length });
      
      return { 
        success: true, 
        message: 'Sync completed successfully',
        wordsCount: mergedData.words.length,
        trigger
      };
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
      
      this.consecutiveFailures++;
      await this.updateSyncMetadata({
        lastSyncTime: Date.now(),
        lastSyncTrigger: trigger,
        syncSuccess: false,
        errorMessage: error.message
      });
      
      // Notify listeners
      this.emit('syncError', { error: error.message, trigger });
      
      // Schedule retry with exponential backoff
      if (this.consecutiveFailures < this.maxRetries) {
        const retryDelay = this.baseRetryDelay * Math.pow(2, this.consecutiveFailures - 1);
        console.log(`🔄 Scheduling retry in ${retryDelay / 1000} seconds...`);
        setTimeout(() => this.performSync(`retry_${this.consecutiveFailures}`), retryDelay);
      }
      
      return { success: false, message: error.message, trigger };
      
    } finally {
      this.syncInProgress = false;
    }
  }
  
  // Demo sync for development/testing
  async performDemoSync(trigger = 'manual') {
    console.log(`🎭 Demo sync started (trigger: ${trigger})`);
    
    try {
      // Simulate sync operations
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const localData = await this.getLocalData();
      
      // Update sync metadata
      await this.updateSyncMetadata({
        lastSyncTime: Date.now(),
        lastSyncTrigger: trigger,
        syncSuccess: true,
        wordsCount: localData.words.length,
        demoMode: true
      });
      
      console.log('✅ Demo sync completed successfully');
      
      // Notify listeners
      this.emit('syncComplete', { 
        success: true, 
        trigger, 
        wordsCount: localData.words.length,
        demoMode: true 
      });
      
      return { 
        success: true, 
        message: 'Demo sync completed successfully',
        wordsCount: localData.words.length,
        trigger,
        demoMode: true
      };
      
    } catch (error) {
      console.error('❌ Demo sync failed:', error);
      return { success: false, message: error.message, trigger, demoMode: true };
    }
  }
  
  // ========== DATA OPERATIONS ==========
  
  async getLocalData() {
    const [words, analytics, gamification, syncMetadata] = await Promise.all([
      window.VocabUtils.VocabStorage.getAllWords(),
      this.getAnalyticsData(),
      this.getGamificationData(),
      this.getSyncMetadata()
    ]);
    
    return {
      timestamp: Date.now(),
      version: '1.0.0',
      deviceId: await this.getDeviceId(),
      words: words || [],
      analytics: analytics,
      gamification: gamification,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalWords: words.length,
        lastModified: this.getLastModifiedTime(words)
      },
      syncMetadata: syncMetadata
    };
  }
  
  async getRemoteData() {
    const authData = await this.getAuthData();
    if (!authData) {
      throw new Error('Not authenticated');
    }
    
    try {
      // Simulate Firebase Firestore read
      const remoteData = await this.fetchFromFirestore(authData.userId);
      
      if (!remoteData) {
        console.log('☁️ No remote data found');
        return null;
      }
      
      // Decrypt data if needed
      if (this.config.encryptionEnabled && remoteData.encrypted) {
        remoteData.data = await this.decryptData(remoteData.data);
      }
      
      // Decompress if needed
      if (this.config.compressionEnabled && remoteData.compressed) {
        remoteData.data = await this.decompressData(remoteData.data);
      }
      
      return remoteData.data;
      
    } catch (error) {
      console.error('Failed to fetch remote data:', error);
      return null;
    }
  }
  
  async uploadToCloud(data) {
    const authData = await this.getAuthData();
    if (!authData) {
      throw new Error('Not authenticated');
    }
    
    try {
      let uploadData = { ...data };
      
      // Compress data if enabled
      if (this.config.compressionEnabled) {
        uploadData = await this.compressData(uploadData);
      }
      
      // Encrypt data if enabled
      if (this.config.encryptionEnabled) {
        uploadData = await this.encryptData(uploadData);
      }
      
      // Prepare cloud document
      const cloudDoc = {
        userId: authData.userId,
        data: uploadData,
        timestamp: Date.now(),
        version: '1.0.0',
        compressed: this.config.compressionEnabled,
        encrypted: this.config.encryptionEnabled,
        deviceId: await this.getDeviceId(),
        checksum: await this.calculateChecksum(uploadData)
      };
      
      // Upload to Firestore
      await this.uploadToFirestore(authData.userId, cloudDoc);
      
      console.log('☁️ Data uploaded successfully');
      
    } catch (error) {
      console.error('Failed to upload to cloud:', error);
      throw new Error(`Cloud upload failed: ${error.message}`);
    }
  }
  
  // ========== CONFLICT RESOLUTION ==========
  
  async resolveConflicts(localData, remoteData) {
    if (!remoteData) {
      console.log('🔀 No remote data, using local data');
      return localData;
    }
    
    if (!localData || !localData.words || localData.words.length === 0) {
      console.log('🔀 No local data, using remote data');
      return remoteData;
    }
    
    console.log(`🔀 Resolving conflicts between local (${localData.words.length}) and remote (${remoteData.words.length}) data`);
    
    switch (this.config.conflictResolutionStrategy) {
      case 'local':
        return this.resolveConflictsLocal(localData, remoteData);
      case 'remote':
        return this.resolveConflictsRemote(localData, remoteData);
      case 'merge':
        return this.resolveConflictsMerge(localData, remoteData);
      case 'ask':
        return await this.resolveConflictsAsk(localData, remoteData);
      default:
        return this.resolveConflictsMerge(localData, remoteData);
    }
  }
  
  resolveConflictsLocal(localData, remoteData) {
    console.log('🔀 Conflict resolution: Using local data');
    return localData;
  }
  
  resolveConflictsRemote(localData, remoteData) {
    console.log('🔀 Conflict resolution: Using remote data');
    return remoteData;
  }
  
  resolveConflictsMerge(localData, remoteData) {
    console.log('🔀 Conflict resolution: Merging data');
    
    const merged = {
      timestamp: Math.max(localData.timestamp, remoteData.timestamp),
      version: localData.version,
      deviceId: localData.deviceId,
      words: [],
      analytics: this.mergeAnalytics(localData.analytics, remoteData.analytics),
      gamification: this.mergeGamification(localData.gamification, remoteData.gamification),
      metadata: {
        exportedAt: new Date().toISOString(),
        totalWords: 0,
        lastModified: Math.max(
          localData.metadata?.lastModified || 0,
          remoteData.metadata?.lastModified || 0
        )
      }
    };
    
    // Merge words using advanced strategy
    merged.words = this.mergeWords(localData.words, remoteData.words);
    merged.metadata.totalWords = merged.words.length;
    
    console.log(`🔀 Merge complete: ${merged.words.length} words`);
    return merged;
  }
  
  mergeWords(localWords, remoteWords) {
    const wordMap = new Map();
    const conflicts = [];
    
    // Process local words first
    localWords.forEach(word => {
      wordMap.set(word.id, { ...word, source: 'local' });
    });
    
    // Process remote words and detect conflicts
    remoteWords.forEach(remoteWord => {
      const localWord = wordMap.get(remoteWord.id);
      
      if (!localWord) {
        // New word from remote
        wordMap.set(remoteWord.id, { ...remoteWord, source: 'remote' });
      } else {
        // Potential conflict - merge based on last modified time
        const localModified = new Date(localWord.lastModified || localWord.createdAt);
        const remoteModified = new Date(remoteWord.lastModified || remoteWord.createdAt);
        
        if (remoteModified > localModified) {
          // Remote is newer - use remote but preserve local SRS progress if better
          const mergedWord = {
            ...remoteWord,
            source: 'merged',
            srs: this.mergeSRSData(localWord.srs, remoteWord.srs)
          };
          wordMap.set(remoteWord.id, mergedWord);
        } else {
          // Local is newer or same - keep local but merge some remote data
          const mergedWord = {
            ...localWord,
            source: 'merged',
            // Merge example and phonetic if local doesn't have them
            example: localWord.example || remoteWord.example,
            phonetic: localWord.phonetic || remoteWord.phonetic,
            audioUrl: localWord.audioUrl || remoteWord.audioUrl
          };
          wordMap.set(localWord.id, mergedWord);
        }
      }
    });
    
    return Array.from(wordMap.values()).map(word => {
      const { source, ...cleanWord } = word;
      return cleanWord;
    });
  }
  
  mergeSRSData(localSRS, remoteSRS) {
    if (!localSRS && !remoteSRS) {
      return { repetitions: 0, interval: 1, easiness: 2.5, nextReview: new Date().toISOString() };
    }
    
    if (!remoteSRS) return localSRS;
    if (!localSRS) return remoteSRS;
    
    // Use the SRS data with more progress (higher repetitions or longer interval)
    const localProgress = (localSRS.repetitions || 0) * (localSRS.interval || 1);
    const remoteProgress = (remoteSRS.repetitions || 0) * (remoteSRS.interval || 1);
    
    return localProgress >= remoteProgress ? localSRS : remoteSRS;
  }
  
  mergeAnalytics(localAnalytics, remoteAnalytics) {
    if (!localAnalytics && !remoteAnalytics) return null;
    if (!remoteAnalytics) return localAnalytics;
    if (!localAnalytics) return remoteAnalytics;
    
    // Merge analytics data intelligently
    return {
      ...localAnalytics,
      // Use maximum values for cumulative stats
      totalWordsLearned: Math.max(localAnalytics.totalWordsLearned || 0, remoteAnalytics.totalWordsLearned || 0),
      totalReviewSessions: Math.max(localAnalytics.totalReviewSessions || 0, remoteAnalytics.totalReviewSessions || 0),
      totalTimeSpent: Math.max(localAnalytics.totalTimeSpent || 0, remoteAnalytics.totalTimeSpent || 0),
      longestStreak: Math.max(localAnalytics.longestStreak || 0, remoteAnalytics.longestStreak || 0),
      currentStreak: Math.max(localAnalytics.currentStreak || 0, remoteAnalytics.currentStreak || 0),
      // Merge daily stats
      dailyStats: this.mergeDailyStats(localAnalytics.dailyStats, remoteAnalytics.dailyStats),
      // Merge quality distribution
      qualityDistribution: this.mergeQualityDistribution(
        localAnalytics.qualityDistribution, 
        remoteAnalytics.qualityDistribution
      )
    };
  }
  
  mergeDailyStats(localDaily, remoteDaily) {
    const merged = { ...localDaily };
    
    if (remoteDaily) {
      Object.keys(remoteDaily).forEach(date => {
        if (!merged[date]) {
          merged[date] = remoteDaily[date];
        } else {
          // Merge daily stats for same date (use maximum values)
          merged[date] = {
            wordsReviewed: Math.max(merged[date].wordsReviewed || 0, remoteDaily[date].wordsReviewed || 0),
            timeSpent: Math.max(merged[date].timeSpent || 0, remoteDaily[date].timeSpent || 0),
            sessions: Math.max(merged[date].sessions || 0, remoteDaily[date].sessions || 0),
            accuracy: Math.max(merged[date].accuracy || 0, remoteDaily[date].accuracy || 0)
          };
        }
      });
    }
    
    return merged;
  }
  
  mergeQualityDistribution(localQuality, remoteQuality) {
    const merged = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    // Add local distribution
    if (localQuality) {
      Object.keys(localQuality).forEach(quality => {
        merged[quality] = (merged[quality] || 0) + (localQuality[quality] || 0);
      });
    }
    
    // Add remote distribution
    if (remoteQuality) {
      Object.keys(remoteQuality).forEach(quality => {
        merged[quality] = (merged[quality] || 0) + (remoteQuality[quality] || 0);
      });
    }
    
    return merged;
  }
  
  mergeGamification(localGamification, remoteGamification) {
    if (!localGamification && !remoteGamification) return null;
    if (!remoteGamification) return localGamification;
    if (!localGamification) return remoteGamification;
    
    // Merge gamification data
    return {
      ...localGamification,
      // Use maximum values for progress
      level: Math.max(localGamification.level || 1, remoteGamification.level || 1),
      xp: Math.max(localGamification.xp || 0, remoteGamification.xp || 0),
      longestStreak: Math.max(localGamification.longestStreak || 0, remoteGamification.longestStreak || 0),
      // Merge achievements
      unlockedAchievements: [
        ...(localGamification.unlockedAchievements || []),
        ...(remoteGamification.unlockedAchievements || [])
      ].filter((value, index, self) => self.indexOf(value) === index), // Remove duplicates
      // Merge completed challenges
      completedChallenges: [
        ...(localGamification.completedChallenges || []),
        ...(remoteGamification.completedChallenges || [])
      ].filter((challenge, index, self) => 
        self.findIndex(c => c.id === challenge.id && c.date === challenge.date) === index
      )
    };
  }
  
  // ========== ENCRYPTION & COMPRESSION ==========
  
  async initializeEncryption() {
    // Initialize encryption key from storage or generate new one
    const existingKey = await this.getEncryptionKey();
    if (!existingKey) {
      const newKey = await this.generateEncryptionKey();
      await this.saveEncryptionKey(newKey);
    }
  }
  
  async generateEncryptionKey() {
    // Generate a simple key for demo purposes
    // In production, use proper crypto libraries
    const key = 'vocab_srs_key_' + Date.now() + '_' + Math.random().toString(36);
    return key;
  }
  
  async getEncryptionKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['encryptionKey'], (result) => {
        resolve(result.encryptionKey || null);
      });
    });
  }
  
  async saveEncryptionKey(key) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ encryptionKey: key }, resolve);
    });
  }
  
  async encryptData(data) {
    // Simple base64 encoding for demo
    // In production, use proper AES encryption
    const jsonString = JSON.stringify(data);
    const encrypted = btoa(unescape(encodeURIComponent(jsonString)));
    return encrypted;
  }
  
  async decryptData(encryptedData) {
    try {
      // Simple base64 decoding for demo
      const decrypted = decodeURIComponent(escape(atob(encryptedData)));
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt data');
    }
  }
  
  async compressData(data) {
    // Simple compression using JSON.stringify with minimal spaces
    // In production, use proper compression libraries like LZ-string
    const compressed = JSON.stringify(data);
    return compressed;
  }
  
  async decompressData(compressedData) {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      throw new Error('Failed to decompress data');
    }
  }
  
  // ========== FIRESTORE SIMULATION ==========
  
  async fetchFromFirestore(userId) {
    // Simulate Firestore read operation
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        // For demo, return null to simulate no remote data
        // In production, this would be an actual Firestore query
        resolve(null);
      }, 1000);
    });
  }
  
  async uploadToFirestore(userId, data) {
    // Simulate Firestore write operation
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        // Simulate random network failures for testing
        if (Math.random() < 0.1) { // 10% failure rate
          reject(new Error('Simulated network error'));
        } else {
          console.log('📤 Simulated upload to Firestore successful');
          resolve();
        }
      }, 2000);
    });
  }
  
  // ========== UTILITY METHODS ==========
  
  async getDeviceId() {
    let deviceId = await new Promise((resolve) => {
      chrome.storage.local.get(['deviceId'], (result) => {
        resolve(result.deviceId);
      });
    });
    
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      await new Promise((resolve) => {
        chrome.storage.local.set({ deviceId }, resolve);
      });
    }
    
    return deviceId;
  }
  
  getLastModifiedTime(words) {
    if (!words || words.length === 0) return 0;
    
    return Math.max(...words.map(word => 
      new Date(word.lastModified || word.createdAt || 0).getTime()
    ));
  }
  
  async calculateChecksum(data) {
    // Simple checksum calculation
    const jsonString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
  
  // ========== HELPER DATA ACCESS METHODS ==========
  
  async getAnalyticsData() {
    if (window.VocabAnalytics && typeof window.VocabAnalytics.getAnalyticsData === 'function') {
      return await window.VocabAnalytics.getAnalyticsData();
    }
    return null;
  }
  
  async getGamificationData() {
    if (window.VocabGamification) {
      const gamification = new window.VocabGamification();
      return await gamification.getGamificationData();
    }
    return null;
  }
  
  async getSyncMetadata() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['syncMetadata'], (result) => {
        resolve(result.syncMetadata || {});
      });
    });
  }
  
  async updateSyncMetadata(metadata) {
    const existing = await this.getSyncMetadata();
    const updated = { ...existing, ...metadata };
    
    return new Promise((resolve) => {
      chrome.storage.local.set({ syncMetadata: updated }, resolve);
    });
  }
  
  async saveLocalData(data) {
    // Save words
    await window.VocabUtils.VocabStorage.getAllWords().then(async () => {
      // Clear existing words
      await chrome.storage.local.remove(['vocab_words']);
      // Save new words
      await chrome.storage.local.set({ vocab_words: data.words });
    });
    
    // Save analytics if available
    if (data.analytics && window.VocabAnalytics && typeof window.VocabAnalytics.saveAnalyticsData === 'function') {
      await window.VocabAnalytics.saveAnalyticsData(data.analytics);
    }
    
    // Save gamification if available
    if (data.gamification && window.VocabGamification) {
      const gamification = new window.VocabGamification();
      if (typeof gamification.saveGamificationData === 'function') {
        await gamification.saveGamificationData(data.gamification);
      }
    }
  }
  
  // ========== CONFIGURATION ==========
  
  async loadSyncConfig() {
    const config = await new Promise((resolve) => {
      chrome.storage.sync.get(['cloudSyncConfig'], (result) => {
        resolve(result.cloudSyncConfig || {});
      });
    });
    
    // Merge with defaults
    this.config = { ...this.config, ...config };
  }
  
  async saveSyncConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ cloudSyncConfig: this.config }, resolve);
    });
  }
  
  // ========== AUTO SYNC ==========
  
  startAutoSync() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
    }
    
    this.autoSyncTimer = setInterval(() => {
      if (!this.syncInProgress) {
        this.performSync('auto');
      }
    }, this.config.autoSyncInterval);
    
    console.log(`⏰ Auto-sync started (interval: ${this.config.autoSyncInterval / 1000}s)`);
  }
  
  stopAutoSync() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
      console.log('⏰ Auto-sync stopped');
    }
  }
  
  // ========== EVENT SYSTEM ==========
  
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }
  
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
  
  setupDataChangeListeners() {
    // Listen for vocabulary changes
    if (window.VocabUtils && window.VocabUtils.VocabStorage) {
      // Override storage methods to trigger sync
      const originalAddWord = window.VocabUtils.VocabStorage.addWord;
      const originalUpdateWord = window.VocabUtils.VocabStorage.updateWord;
      const originalRemoveWord = window.VocabUtils.VocabStorage.removeWord;
      
      window.VocabUtils.VocabStorage.addWord = async (...args) => {
        const result = await originalAddWord.apply(window.VocabUtils.VocabStorage, args);
        if (this.config.syncOnDataChange) {
          setTimeout(() => this.performSync('dataChange'), 5000);
        }
        return result;
      };
      
      window.VocabUtils.VocabStorage.updateWord = async (...args) => {
        const result = await originalUpdateWord.apply(window.VocabUtils.VocabStorage, args);
        if (this.config.syncOnDataChange) {
          setTimeout(() => this.performSync('dataChange'), 5000);
        }
        return result;
      };
      
      window.VocabUtils.VocabStorage.removeWord = async (...args) => {
        const result = await originalRemoveWord.apply(window.VocabUtils.VocabStorage, args);
        if (this.config.syncOnDataChange) {
          setTimeout(() => this.performSync('dataChange'), 5000);
        }
        return result;
      };
    }
  }
  
  // ========== PUBLIC API ==========
  
  async getStatus() {
    const metadata = await this.getSyncMetadata();
    const authData = await this.getAuthData();
    
    return {
      isInitialized: this.isInitialized,
      isAuthenticated: !!authData,
      syncInProgress: this.syncInProgress,
      lastSyncTime: metadata.lastSyncTime,
      lastSyncSuccess: metadata.syncSuccess,
      consecutiveFailures: this.consecutiveFailures,
      autoSyncEnabled: this.config.autoSyncEnabled,
      autoSyncInterval: this.config.autoSyncInterval,
      wordsCount: metadata.wordsCount || 0
    };
  }
  
  async enableAutoSync(interval = 5 * 60 * 1000) {
    this.config.autoSyncEnabled = true;
    this.config.autoSyncInterval = interval;
    await this.saveSyncConfig();
    this.startAutoSync();
  }
  
  async disableAutoSync() {
    this.config.autoSyncEnabled = false;
    await this.saveSyncConfig();
    this.stopAutoSync();
  }
  
  async forceSync() {
    return await this.performSync('manual');
  }
  
  async resetSync() {
    // Clear sync metadata
    await chrome.storage.local.remove(['syncMetadata']);
    
    // Reset failure counter
    this.consecutiveFailures = 0;
    
    console.log('🔄 Sync state reset');
  }
}

// Global instance
if (typeof window !== 'undefined') {
  window.CloudSyncManager = CloudSyncManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CloudSyncManager;
}
