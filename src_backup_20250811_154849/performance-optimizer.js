// Performance Optimization Module
class PerformanceOptimizer {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 1000;
    this.preloadQueue = [];
    this.observers = [];
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      avgResponseTime: 0,
      memoryUsage: 0
    };
    
    this.initializePerformanceMonitoring();
  }

  /**
   * Smart Caching System
   */
  async getFromCache(key, fetchFunction, ttl = 3600000) { // 1 hour default TTL
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      this.metrics.cacheHits++;
      return cached.data;
    }
    
    this.metrics.cacheMisses++;
    const startTime = performance.now();
    
    try {
      const data = await fetchFunction();
      const endTime = performance.now();
      
      this.updateResponseTime(endTime - startTime);
      this.setCacheItem(key, data);
      
      return data;
    } catch (error) {
      console.error('Cache fetch error:', error);
      throw error;
    }
  }

  setCacheItem(key, data) {
    // LRU eviction when cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1
    });
  }

  /**
   * Lazy Loading for Vocabulary Data
   */
  async lazyLoadWords(offset = 0, limit = 20) {
    const cacheKey = `words_${offset}_${limit}`;
    
    return this.getFromCache(cacheKey, async () => {
      const words = await window.VocabUtils.VocabStorage.getWordsPaginated(offset, limit);
      
      // Preload next batch
      this.preloadNextBatch(offset + limit, limit);
      
      return words;
    });
  }

  async preloadNextBatch(offset, limit) {
    if (this.preloadQueue.includes(`${offset}_${limit}`)) return;
    
    this.preloadQueue.push(`${offset}_${limit}`);
    
    // Preload in background with low priority
    requestIdleCallback(async () => {
      try {
        await this.lazyLoadWords(offset, limit);
        this.preloadQueue = this.preloadQueue.filter(item => item !== `${offset}_${limit}`);
      } catch (error) {
        console.warn('Preload failed:', error);
      }
    });
  }

  /**
   * Optimized Audio Handling
   */
  async optimizedAudioLoad(word, audioUrl) {
    const cacheKey = `audio_${word}`;
    
    return this.getFromCache(cacheKey, async () => {
      if (audioUrl) {
        // Try to load original audio
        const audio = new Audio();
        return new Promise((resolve, reject) => {
          audio.onloadeddata = () => resolve({ type: 'url', audio, source: audioUrl });
          audio.onerror = () => {
            // Fallback to TTS
            this.generateTTSAudio(word).then(resolve).catch(reject);
          };
          audio.src = audioUrl;
        });
      } else {
        return this.generateTTSAudio(word);
      }
    }, 1800000); // Cache for 30 minutes
  }

  async generateTTSAudio(word) {
    if (!window.speechSynthesis) {
      throw new Error('Speech synthesis not supported');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(word);
      
      // Optimize TTS settings
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Try to use high-quality voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang === 'en-US' && voice.name.includes('Enhanced')
      ) || voices.find(voice => voice.lang === 'en-US');
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve({ type: 'tts', utterance, word });
      utterance.onerror = reject;
      
      speechSynthesis.speak(utterance);
    });
  }

  /**
   * Memory Management
   */
  cleanupMemory() {
    // Clear old cache entries
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    this.updateMemoryMetrics();
  }

  /**
   * Database Optimization
   */
  async optimizedWordQuery(filters = {}) {
    const cacheKey = `query_${JSON.stringify(filters)}`;
    
    return this.getFromCache(cacheKey, async () => {
      // Use indexed queries for better performance
      if (filters.category) {
        return window.VocabUtils.VocabStorage.getWordsByCategory(filters.category);
      }
      
      if (filters.difficulty) {
        return window.VocabUtils.VocabStorage.getWordsByDifficulty(filters.difficulty);
      }
      
      if (filters.dueDate) {
        return window.VocabUtils.VocabStorage.getDueWords();
      }
      
      return window.VocabUtils.VocabStorage.getAllWords();
    }, 300000); // Cache for 5 minutes
  }

  /**
   * Background Sync Optimization
   */
  async optimizedBackgroundSync() {
    if (!navigator.serviceWorker) return;
    
    // Register background sync for offline capability
    const registration = await navigator.serviceWorker.ready;
    
    if ('sync' in registration) {
      await registration.sync.register('vocab-sync');
    }
    
    // Implement exponential backoff for failed syncs
    this.setupSyncRetry();
  }

  setupSyncRetry() {
    let retryCount = 0;
    const maxRetries = 5;
    
    const attemptSync = async () => {
      try {
        await this.syncData();
        retryCount = 0; // Reset on success
      } catch (error) {
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          setTimeout(attemptSync, delay);
          retryCount++;
        }
      }
    };
    
    return attemptSync;
  }

  /**
   * Performance Monitoring
   */
  initializePerformanceMonitoring() {
    // Monitor memory usage
    if (performance.memory) {
      setInterval(() => {
        this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
        
        // Cleanup if memory usage is high
        if (this.metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
          this.cleanupMemory();
        }
      }, 30000); // Check every 30 seconds
    }

    // Monitor performance observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.metrics.avgResponseTime = (this.metrics.avgResponseTime + entry.duration) / 2;
          }
        }
      });
      
      observer.observe({ entryTypes: ['measure'] });
      this.observers.push(observer);
    }
  }

  updateResponseTime(duration) {
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime + duration) / 2;
  }

  updateMemoryMetrics() {
    if (performance.memory) {
      this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
    }
  }

  /**
   * Batch Operations for Better Performance
   */
  async batchUpdateWords(updates) {
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < updates.length; i += batchSize) {
      batches.push(updates.slice(i, i + batchSize));
    }
    
    const results = [];
    for (const batch of batches) {
      const batchPromises = batch.map(update => 
        window.VocabUtils.VocabStorage.updateWord(update.id, update.data)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return results;
  }

  /**
   * Resource Preloading
   */
  preloadCriticalResources() {
    const criticalResources = [
      'popup.css',
      'review.css',
      'utils.js',
      'api.js'
    ];
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = chrome.runtime.getURL(`src/${resource}`);
      link.as = resource.endsWith('.css') ? 'style' : 'script';
      document.head.appendChild(link);
    });
  }

  /**
   * Get Performance Metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.cache.clear();
    this.preloadQueue = [];
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Initialize global performance optimizer
if (typeof window !== 'undefined') {
  window.PerformanceOptimizer = PerformanceOptimizer;
  window.performanceOptimizer = new PerformanceOptimizer();
}
