class EnvConfig {
  constructor(){ this.config={}; this.isLoaded=false; }

  async loadConfig(){
    if (this.isLoaded) return this.config;
    try {
      this.config = (typeof process!=='undefined' && process.env)
        ? this.loadFromProcessEnv()
        : await this.loadFromChromeStorage();
      this.isLoaded=true;
    } catch {
      this.config=this.getDefaultConfig(); this.isLoaded=true;
    }
    return this.config;
  }

  loadFromProcessEnv(){
    const e=process.env;
    return { firebase:{ apiKey:e.VITE_FIREBASE_API_KEY, authDomain:e.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:e.VITE_FIREBASE_PROJECT_ID, storageBucket:e.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId:e.VITE_FIREBASE_MESSAGING_SENDER_ID, appId:e.VITE_FIREBASE_APP_ID },
      environment:e.NODE_ENV||'development' };
  }

  loadFromChromeStorage(){
    return new Promise(res=>{
      if (!chrome?.storage) return res(this.getDefaultConfig());
      chrome.storage.local.get(['firebaseConfig'],r=>{
        const c=r.firebaseConfig;
        res(c?.firebase?c : (c?.apiKey?{firebase:c}:this.getDefaultConfig()));
      });
    });
  }

  saveConfig(cfg){
    return new Promise((res,rej)=>{
      if (!chrome?.storage) return res();
      chrome.storage.local.set({firebaseConfig:cfg},()=>{
        if (chrome.runtime.lastError) rej(new Error(chrome.runtime.lastError.message));
        else { this.config=cfg; res(); }
      });
    });
  }

  getDefaultConfig(){ return { firebase:{apiKey:'',authDomain:'',projectId:'vocab-srs-demo',
    storageBucket:'',messagingSenderId:'',appId:''}, environment:'development',
    cloudSync:{enabled:false,autoSync:false,encryptionEnabled:true,compressionEnabled:true} }; }
  
  getFirebaseConfig(){ return this.isLoaded?this.config.firebase:this.getDefaultConfig().firebase; }
  isFirebaseConfigured(){ const f=this.getFirebaseConfig(); return f.apiKey && f.projectId; }
  getEnvironment(){ return this.config.environment||'development'; }
  isDevelopment(){ return this.getEnvironment()==='development'; }
  isProduction(){ return this.getEnvironment()==='production'; }

  validateFirebaseConfig(c){
    const required=['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId'];
    const missing=required.filter(k=>!c[k]); if (missing.length) throw new Error('Missing:'+missing.join(','));
    if (!c.apiKey.startsWith('AIza')) throw new Error('Invalid API key');
    if (!c.authDomain.includes('.firebaseapp.com')) throw new Error('Invalid auth domain');
    if (!c.appId.startsWith('1:')) throw new Error('Invalid app ID');
    return true;
  }

  async updateFirebaseConfig(newCfg){
    this.validateFirebaseConfig(newCfg);
    const updated={...this.config, firebase:{...this.config.firebase,...newCfg}};
    await this.saveConfig(updated); return true;
  }
}

const envConfig=new EnvConfig();
envConfig.loadConfig().then(()=>{
  if (!envConfig.isFirebaseConfigured()) console.log('⚠️ Firebase not configured. Run setup wizard.');
});
if (typeof window!=='undefined'){ window.EnvConfig=EnvConfig; window.envConfig=envConfig; }
if (typeof module!=='undefined') module.exports=EnvConfig;
