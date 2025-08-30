// IndexedDB Manager for persistent data storage
class IndexedDBManager {
  constructor() {
    this.dbName = 'VocabSRSDB';
    this.version = 1;
    this.db = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.error('❌ IndexedDB error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('✅ IndexedDB initialized successfully');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('vocabWords')) {
          const vocabStore = db.createObjectStore('vocabWords', { keyPath: 'id' });
          vocabStore.createIndex('word', 'word', { unique: false });
          vocabStore.createIndex('nextReview', 'srs.nextReview', { unique: false });
          vocabStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('gamification')) {
          db.createObjectStore('gamification', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('analytics')) {
          db.createObjectStore('analytics', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        
        console.log('🔧 IndexedDB schema upgraded');
      };
    });
  }

  async get(storeName, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async set(storeName, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(storeName, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(value);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async remove(storeName, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async query(storeName, indexName, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Global instance
const indexedDBManager = new IndexedDBManager();

// Utility functions for backward compatibility
const StorageManager = {
  async get(key) {
    if (key === 'vocabWords') {
      return await indexedDBManager.getAll('vocabWords');
    }
    return await indexedDBManager.get('settings', key);
  },

  async set(key, value) {
    if (key === 'vocabWords') {
      // For vocabWords, we need to handle the array differently
      if (Array.isArray(value)) {
        // Clear existing and add all new
        await indexedDBManager.clear('vocabWords');
        for (const item of value) {
          await indexedDBManager.add('vocabWords', item);
        }
        return true;
      }
    }
    return await indexedDBManager.set('settings', { key, value });
  },

  async remove(key) {
    if (key === 'vocabWords') {
      return await indexedDBManager.clear('vocabWords');
    }
    return await indexedDBManager.remove('settings', key);
  },

  async clear() {
    await indexedDBManager.clear('vocabWords');
    await indexedDBManager.clear('gamification');
    await indexedDBManager.clear('analytics');
    await indexedDBManager.clear('settings');
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.IndexedDBManager = IndexedDBManager;
  window.indexedDBManager = indexedDBManager;
  window.StorageManager = StorageManager;
}
