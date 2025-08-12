// PWA Manager - Progressive Web App Features
class PWAManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.offlineQueue = [];
    this.cacheVersion = 'vocab-srs-v1';
    this.staticCaches = [];
    this.dynamicCaches = [];
    
    this.init();
  }

  async init() {
    // Register service worker for offline functionality
    await this.registerServiceWorker();
    
    // Setup offline detection
    this.setupOfflineDetection();
    
    // Setup background sync
    this.setupBackgroundSync();
    
    // Setup push notifications
    this.setupPushNotifications();
    
    // Setup cache management
    this.setupCacheManagement();
    
    // Setup app update detection
    this.setupUpdateDetection();
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/src/pwa-service-worker.js');
        console.log('PWA Service Worker registered:', registration);
        
        // Update found
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateAvailable();
              }
            });
          }
        });
        
        return registration;
      } catch (error) {
        console.error('PWA Service Worker registration failed:', error);
      }
    }
  }

  setupOfflineDetection() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showConnectivityStatus('online');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showConnectivityStatus('offline');
    });
    
    // Show initial status
    this.showConnectivityStatus(this.isOnline ? 'online' : 'offline');
  }

  showConnectivityStatus(status) {
    const existingBanner = document.querySelector('.connectivity-banner');
    if (existingBanner) {
      existingBanner.remove();
    }

    if (status === 'offline') {
      const banner = document.createElement('div');
      banner.className = 'connectivity-banner offline';
      banner.innerHTML = `
        <div class="banner-content">
          <span class="banner-icon">📡</span>
          <span class="banner-text">You're offline. Changes will sync when connection is restored.</span>
        </div>
      `;
      
      const style = document.createElement('style');
      style.textContent = `
        .connectivity-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #f59e0b;
          color: white;
          z-index: 10000;
          padding: 12px;
          text-align: center;
          animation: slideDown 0.3s ease-out;
        }
        
        .connectivity-banner.offline {
          background: #ef4444;
        }
        
        .banner-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(banner);
    } else {
      // Show brief "back online" message
      const banner = document.createElement('div');
      banner.className = 'connectivity-banner online';
      banner.innerHTML = `
        <div class="banner-content">
          <span class="banner-icon">✅</span>
          <span class="banner-text">Connection restored</span>
        </div>
      `;
      banner.style.background = '#10b981';
      
      document.body.appendChild(banner);
      
      setTimeout(() => {
        banner.remove();
      }, 3000);
    }
  }

  async setupBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('vocab-sync');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }

  async setupPushNotifications() {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      // Request permission
      const permission = await this.requestNotificationPermission();
      
      if (permission === 'granted') {
        await this.subscribeToNotifications();
      }
    }
  }

  async requestNotificationPermission() {
    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribeToNotifications() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey())
      });
      
      // Send subscription to server (would be implemented with your backend)
      console.log('Push notification subscription:', subscription);
      
      return subscription;
    } catch (error) {
      console.error('Push notification subscription failed:', error);
    }
  }

  getVapidPublicKey() {
    // In a real implementation, this would be your VAPID public key
    return 'your-vapid-public-key-here';
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  setupCacheManagement() {
    // Define cache strategies
    this.cacheStrategies = {
      static: 'cache-first',      // CSS, JS, images
      api: 'network-first',       // API calls
      pages: 'stale-while-revalidate'  // HTML pages
    };
  }

  setupUpdateDetection() {
    // Check for app updates periodically
    setInterval(() => {
      this.checkForUpdates();
    }, 30 * 60 * 1000); // Check every 30 minutes
  }

  async checkForUpdates() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.update();
      }
    }
  }

  showUpdateAvailable() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'update-banner';
    updateBanner.innerHTML = `
      <div class="banner-content">
        <span class="banner-icon">🔄</span>
        <span class="banner-text">A new version is available!</span>
        <button class="update-btn" onclick="window.pwaManager.applyUpdate()">Update Now</button>
        <button class="dismiss-btn" onclick="this.parentElement.parentElement.remove()">Later</button>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      .update-banner {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4285f4;
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 320px;
        animation: slideUp 0.3s ease-out;
      }
      
      .update-banner .banner-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .update-banner .update-btn,
      .update-banner .dismiss-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .update-banner .update-btn {
        background: white;
        color: #4285f4;
      }
      
      .update-banner .dismiss-btn {
        background: transparent;
        color: white;
        border: 1px solid rgba(255,255,255,0.3);
      }
      
      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(updateBanner);
  }

  async applyUpdate() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        // Send message to waiting service worker to take control
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Reload the page to use the new service worker
        window.location.reload();
      }
    }
  }

  // Queue operations for offline processing
  queueOfflineOperation(operation) {
    this.offlineQueue.push({
      ...operation,
      timestamp: Date.now(),
      id: this.generateId()
    });
    
    this.saveOfflineQueue();
  }

  async processOfflineQueue() {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return;
    }
    
    console.log(`Processing ${this.offlineQueue.length} offline operations...`);
    
    const processed = [];
    const failed = [];
    
    for (const operation of this.offlineQueue) {
      try {
        await this.processOfflineOperation(operation);
        processed.push(operation);
      } catch (error) {
        console.error('Failed to process offline operation:', error);
        failed.push(operation);
      }
    }
    
    // Remove processed operations
    this.offlineQueue = failed;
    this.saveOfflineQueue();
    
    if (processed.length > 0) {
      this.showOfflineProcessingResult(processed.length, failed.length);
    }
  }

  async processOfflineOperation(operation) {
    switch (operation.type) {
      case 'ADD_WORD':
        await window.VocabUtils.VocabStorage.addWord(operation.data);
        break;
      case 'UPDATE_WORD':
        await window.VocabUtils.VocabStorage.updateWord(operation.id, operation.data);
        break;
      case 'DELETE_WORD':
        await window.VocabUtils.VocabStorage.deleteWord(operation.id);
        break;
      case 'REVIEW_WORD':
        await window.VocabUtils.VocabStorage.reviewWord(operation.id, operation.quality);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  showOfflineProcessingResult(processed, failed) {
    const message = failed === 0 
      ? `✅ ${processed} offline changes synced successfully!`
      : `⚠️ ${processed} changes synced, ${failed} failed`;
    
    this.showToast(message);
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'pwa-toast';
    toast.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
      .pwa-toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #2d3748;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: toastSlideUp 0.3s ease-out;
      }
      
      @keyframes toastSlideUp {
        from { transform: translate(-50%, 100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  async saveOfflineQueue() {
    try {
      await chrome.storage.local.set({ offlineQueue: this.offlineQueue });
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  async loadOfflineQueue() {
    try {
      const result = await chrome.storage.local.get(['offlineQueue']);
      this.offlineQueue = result.offlineQueue || [];
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Install prompt for PWA
  async showInstallPrompt() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
      } else {
        console.log('PWA installation dismissed');
      }
      
      this.deferredPrompt = null;
    }
  }

  // Add to home screen functionality
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallBanner();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.hideInstallBanner();
    });
  }

  showInstallBanner() {
    const installBanner = document.createElement('div');
    installBanner.id = 'pwa-install-banner';
    installBanner.className = 'install-banner';
    installBanner.innerHTML = `
      <div class="banner-content">
        <span class="banner-icon">📱</span>
        <div class="banner-text">
          <strong>Install Vocab SRS</strong>
          <p>Add to your home screen for easier access!</p>
        </div>
        <button class="install-btn" onclick="window.pwaManager.showInstallPrompt()">Install</button>
        <button class="dismiss-btn" onclick="this.parentElement.parentElement.remove()">✕</button>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      .install-banner {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 320px;
        animation: slideIn 0.3s ease-out;
      }
      
      .install-banner .banner-content {
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        align-items: center;
        gap: 12px;
      }
      
      .install-banner .banner-icon {
        font-size: 24px;
      }
      
      .install-banner .banner-text strong {
        display: block;
        margin-bottom: 4px;
      }
      
      .install-banner .banner-text p {
        margin: 0;
        font-size: 14px;
        color: #64748b;
      }
      
      .install-banner .install-btn {
        background: #4285f4;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
      }
      
      .install-banner .dismiss-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #64748b;
        width: 24px;
        height: 24px;
        border-radius: 50%;
      }
      
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(installBanner);
  }

  hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.remove();
    }
  }

  // Get installation status
  isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
  }

  // Performance monitoring for PWA
  measurePerformance() {
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          const paint = performance.getEntriesByType('paint');
          
          const metrics = {
            loadTime: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime
          };
          
          console.log('PWA Performance Metrics:', metrics);
          
          // Store metrics for analytics
          this.storePerformanceMetrics(metrics);
        }, 0);
      });
    }
  }

  async storePerformanceMetrics(metrics) {
    try {
      const existingMetrics = await chrome.storage.local.get(['performanceMetrics']);
      const allMetrics = existingMetrics.performanceMetrics || [];
      
      allMetrics.push({
        ...metrics,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink
        } : null
      });
      
      // Keep only last 100 entries
      if (allMetrics.length > 100) {
        allMetrics.splice(0, allMetrics.length - 100);
      }
      
      await chrome.storage.local.set({ performanceMetrics: allMetrics });
    } catch (error) {
      console.error('Failed to store performance metrics:', error);
    }
  }
}

// Initialize PWA manager
if (typeof window !== 'undefined') {
  window.PWAManager = PWAManager;
  window.pwaManager = new PWAManager();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWAManager;
}
