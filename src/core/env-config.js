// Environment Configuration Manager for Vocab SRS Extension
class EnvConfig {
  constructor() {
    this.config = {};
    this.isLoaded = false;
  }
  
  // Load configuration from environment or Chrome storage
  async loadConfig() {
    if (this.isLoaded) return this.config;
    
    try {
      // For development: try to load from .env file (if available)
      if (typeof process !== 'undefined' && process.env) {
        this.config = this.loadFromProcessEnv();
        console.log('🔧 Config loaded from process.env');
      } 
      // For extension: load from Chrome storage or hardcoded values
      else {
        this.config = await this.loadFromChromeStorage();
        console.log('🔧 Config loaded from Chrome storage');
      }
      
      this.isLoaded = true;
      return this.config;
      
    } catch (error) {
      console.error('❌ Failed to load config:', error);
      // Fallback to empty config
      this.config = this.getDefaultConfig();
      this.isLoaded = true;
      return this.config;
    }
  }
  
  // Load from Node.js process environment
  loadFromProcessEnv() {
    return {
      firebase: {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID,
      },
      environment: process.env.NODE_ENV || 'development'
    };
  }
  
  // Load from Chrome extension storage
  async loadFromChromeStorage() {
    return new Promise((resolve) => {
      // Check if we're in a Chrome extension context
      if (typeof chrome === 'undefined' || !chrome.storage) {
        resolve(this.getDefaultConfig());
        return;
      }
      
      chrome.storage.local.get(['firebaseConfig'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome storage error:', chrome.runtime.lastError);
          resolve(this.getDefaultConfig());
          return;
        }
        
        // Check if firebaseConfig exists and has the right structure
        const firebaseConfig = result.firebaseConfig;
        if (firebaseConfig) {
          // If it's already in the correct format { firebase: {...} }
          if (firebaseConfig.firebase) {
            resolve(firebaseConfig);
          } 
          // If it's just the firebase config object directly (from options.js save)
          else if (firebaseConfig.apiKey || firebaseConfig.projectId) {
            resolve({ firebase: firebaseConfig });
          }
          // Otherwise, use default
          else {
            resolve(this.getDefaultConfig());
          }
        } else {
          resolve(this.getDefaultConfig());
        }
      });
    });
  }
  
  // Save configuration to Chrome storage
  async saveConfig(config) {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        resolve(); // Skip if not in extension context
        return;
      }
      
      chrome.storage.local.set({ firebaseConfig: config }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          this.config = config;
          console.log('✅ Config saved to Chrome storage');
          resolve();
        }
      });
    });
  }
  
  // Get default configuration (for fallback)
  getDefaultConfig() {
    return {
      firebase: {
        apiKey: "",
        authDomain: "",
        projectId: "vocab-srs-demo", // Default demo project
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
      },
      environment: 'development',
      cloudSync: {
        enabled: false, // Disable by default until configured
        autoSync: false,
        encryptionEnabled: true,
        compressionEnabled: true
      }
    };
  }
  
  // Get Firebase configuration
  getFirebaseConfig() {
    if (!this.isLoaded) {
      console.warn('⚠️ Config not loaded yet, using default');
      return this.getDefaultConfig().firebase;
    }
    return this.config.firebase;
  }
  
  // Check if Firebase is properly configured
  isFirebaseConfigured() {
    const firebaseConfig = this.getFirebaseConfig();
    return firebaseConfig.apiKey && 
           firebaseConfig.projectId && 
           firebaseConfig.apiKey !== "" && 
           firebaseConfig.projectId !== "";
  }
  
  // Get environment
  getEnvironment() {
    return this.config.environment || 'development';
  }
  
  // Check if development mode
  isDevelopment() {
    return this.getEnvironment() === 'development';
  }
  
  // Check if production mode
  isProduction() {
    return this.getEnvironment() === 'production';
  }
  
  // Setup wizard for first-time configuration
  async setupWizard() {
    console.log('🧙‍♂️ Firebase Setup Wizard');
    
    // Check if already configured
    if (this.isFirebaseConfigured()) {
      console.log('✅ Firebase already configured');
      return true;
    }
    
    // For extension context, show setup instructions
    if (typeof chrome !== 'undefined' && chrome.storage) {
      this.showSetupInstructions();
      return false;
    }
    
    // For development context, show .env instructions
    console.log(`
🔧 Firebase Setup Required:

1. Create .env file in your project root
2. Copy .env.example to .env
3. Replace placeholder values with your actual Firebase config
4. Restart your development server

Example:
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_PROJECT_ID=vocab-srs-sync
...
    `);
    
    return false;
  }
  
  showSetupInstructions() {
    // This could be enhanced to show a modal in the extension
    console.log(`
☁️ Cloud Sync Setup Required:

To enable cloud synchronization:

1. Follow the Firebase setup guide: chrome-extension://[extension-id]/FIREBASE_SETUP.md
2. Get your Firebase configuration from Firebase Console
3. Open extension options page to enter your Firebase config
4. Enable cloud sync in the popup

For now, the extension will work in offline mode only.
    `);
  }
  
  // Validate Firebase configuration
  validateFirebaseConfig(config) {
    const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missing = required.filter(key => !config[key] || config[key] === '');
    
    if (missing.length > 0) {
      throw new Error(`Missing required Firebase config: ${missing.join(', ')}`);
    }
    
    // Validate format
    if (!config.apiKey.startsWith('AIza')) {
      throw new Error('Invalid API key format');
    }
    
    if (!config.authDomain.includes('.firebaseapp.com')) {
      throw new Error('Invalid auth domain format');
    }
    
    if (!config.appId.startsWith('1:')) {
      throw new Error('Invalid app ID format');
    }
    
    return true;
  }
  
  // Update specific configuration
  async updateFirebaseConfig(newConfig) {
    try {
      // Validate new config
      this.validateFirebaseConfig(newConfig);
      
      // Merge with existing config
      const updatedConfig = {
        ...this.config,
        firebase: { ...this.config.firebase, ...newConfig }
      };
      
      // Save to storage
      await this.saveConfig(updatedConfig);
      
      console.log('✅ Firebase configuration updated');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to update Firebase config:', error);
      throw error;
    }
  }
}

// Create global instance
const envConfig = new EnvConfig();

// Auto-load configuration
envConfig.loadConfig().then(() => {
  console.log('🔧 Environment configuration loaded');
  
  // Run setup wizard if not configured
  if (!envConfig.isFirebaseConfigured()) {
    envConfig.setupWizard();
  }
}).catch(error => {
  console.error('Failed to load environment configuration:', error);
});

// Export for use
if (typeof window !== 'undefined') {
  window.EnvConfig = EnvConfig;
  window.envConfig = envConfig;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnvConfig;
}