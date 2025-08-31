// src/core/env-config.js

class EnvConfig {
  constructor() {
    this.config = {};
    this.isLoaded = false;
  }

  async loadConfig() {
    if (this.isLoaded) return this.config;
    try {
      // Với extension chỉ quan tâm đến chrome.storage
      this.config = await this.loadFromChromeStorage();
      this.isLoaded = true;
    } catch (err) {
      console.warn("EnvConfig load error:", err);
      this.config = this.getDefaultConfig();
      this.isLoaded = true;
    }
    return this.config;
  }

  loadFromChromeStorage() {
    return new Promise((resolve) => {
      if (!chrome?.storage) {
        return resolve(this.getDefaultConfig());
      }
      chrome.storage.local.get(["firebaseConfig"], (result) => {
        const c = result.firebaseConfig;
        if (c?.firebase) {
          resolve(c);
        } else if (c?.apiKey) {
          resolve({ firebase: c });
        } else {
          resolve(this.getDefaultConfig());
        }
      });
    });
  }

  saveConfig(cfg) {
    return new Promise((resolve, reject) => {
      if (!chrome?.storage) return resolve();
      chrome.storage.local.set({ firebaseConfig: cfg }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          this.config = cfg;
          resolve();
        }
      });
    });
  }

  getDefaultConfig() {
    return {
      firebase: {
        apiKey: "",
        authDomain: "",
        projectId: "vocab-srs-demo",
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
      },
      environment: "development",
      cloudSync: {
        enabled: false,
        autoSync: false,
        encryptionEnabled: true,
        compressionEnabled: true,
      },
    };
  }

  getFirebaseConfig() {
    return this.isLoaded ? this.config.firebase : this.getDefaultConfig().firebase;
  }

  isFirebaseConfigured() {
    const f = this.getFirebaseConfig();
    return f.apiKey && f.projectId;
  }

  getEnvironment() {
    return this.config.environment || "development";
  }

  isDevelopment() {
    return this.getEnvironment() === "development";
  }

  isProduction() {
    return this.getEnvironment() === "production";
  }

  validateFirebaseConfig(c) {
    const required = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
    const missing = required.filter((k) => !c[k]);
    if (missing.length) throw new Error("Missing: " + missing.join(","));
    if (!c.apiKey.startsWith("AIza")) throw new Error("Invalid API key");
    if (!c.authDomain.includes(".firebaseapp.com")) throw new Error("Invalid auth domain");
    if (!c.appId.startsWith("1:")) throw new Error("Invalid app ID");
    return true;
  }

  async updateFirebaseConfig(newCfg) {
    this.validateFirebaseConfig(newCfg);
    const updated = {
      ...this.config,
      firebase: { ...this.config.firebase, ...newCfg },
    };
    await this.saveConfig(updated);
    return true;
  }
}

const envConfig = new EnvConfig();
await envConfig.loadConfig();

if (!envConfig.isFirebaseConfigured()) {
  console.log("⚠️ Firebase not configured. Run setup wizard.");
}

// Expose to window for content scripts
if (typeof window !== 'undefined') {
  window.EnvConfig = EnvConfig;
  window.envConfig = envConfig;
  console.log("✅ EnvConfig and envConfig exposed to window");
}