// Cloud Sync UI Component for Popup
class CloudSyncUI {
  constructor() {
    this.cloudSync = null;
    this.isInitialized = false;
    this.statusUpdateInterval = null;
    
    this.init();
  }
  
  async init() {
    console.log('🔄 Initializing Cloud Sync UI...');
    
    try {
      // Initialize Cloud Sync Manager
      if (window.CloudSyncManager) {
        this.cloudSync = new window.CloudSyncManager();
        await this.cloudSync.initialize();
      }
      
      this.createUI();
      this.bindEvents();
      this.startStatusUpdates();
      
      this.isInitialized = true;
      console.log('✅ Cloud Sync UI initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Cloud Sync UI:', error);
      this.showError(error.message);
    }
  }
  
  createUI() {
    const container = document.getElementById('cloud-sync-container');
    if (!container) {
      console.warn('Cloud sync container not found');
      return;
    }
    
    container.innerHTML = `
      <div class="cloud-sync-widget">
        <div class="sync-header">
          <div class="sync-title">
            <span class="sync-icon">☁️</span>
            <span class="sync-text">Cloud Sync</span>
            <span id="sync-status-badge" class="status-badge">Unknown</span>
          </div>
          <div class="sync-controls">
            <button id="sync-now-btn" class="btn-sync-now" title="Sync now">
              <span class="sync-icon">🔄</span>
            </button>
            <button id="sync-settings-btn" class="btn-sync-settings" title="Settings">
              <span class="sync-icon">⚙️</span>
            </button>
          </div>
        </div>
        
        <div class="sync-status-details">
          <div class="status-item">
            <span class="status-label">Last sync:</span>
            <span id="last-sync-time" class="status-value">Never</span>
          </div>
          <div class="status-item">
            <span class="status-label">Words synced:</span>
            <span id="synced-words-count" class="status-value">0</span>
          </div>
          <div class="status-item">
            <span class="status-label">Auto sync:</span>
            <span id="auto-sync-status" class="status-value">Off</span>
          </div>
        </div>
        
        <div id="sync-progress" class="sync-progress" style="display: none;">
          <div class="progress-bar">
            <div id="progress-fill" class="progress-fill"></div>
          </div>
          <div id="progress-text" class="progress-text">Syncing...</div>
        </div>
        
        <div id="sync-error" class="sync-error" style="display: none;">
          <span class="error-icon">⚠️</span>
          <span id="sync-error-message" class="error-message"></span>
          <button id="retry-sync-btn" class="btn-retry">Retry</button>
        </div>
      </div>
      
      <!-- Settings Modal -->
      <div id="sync-settings-modal" class="sync-modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Cloud Sync Settings</h3>
            <button id="close-settings-btn" class="btn-close">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="setting-section">
              <h4>Auto Sync</h4>
              <label class="toggle-switch">
                <input type="checkbox" id="auto-sync-toggle">
                <span class="toggle-slider"></span>
                <span class="toggle-label">Enable automatic synchronization</span>
              </label>
              
              <div class="setting-item">
                <label for="sync-interval">Sync interval:</label>
                <select id="sync-interval" class="sync-select">
                  <option value="300000">5 minutes</option>
                  <option value="600000">10 minutes</option>
                  <option value="1800000">30 minutes</option>
                  <option value="3600000">1 hour</option>
                </select>
              </div>
            </div>
            
            <div class="setting-section">
              <h4>Conflict Resolution</h4>
              <div class="setting-item">
                <label for="conflict-strategy">When data conflicts occur:</label>
                <select id="conflict-strategy" class="sync-select">
                  <option value="merge">Merge automatically (recommended)</option>
                  <option value="local">Keep local data</option>
                  <option value="remote">Use cloud data</option>
                  <option value="ask">Ask me each time</option>
                </select>
              </div>
            </div>
            
            <div class="setting-section">
              <h4>Security</h4>
              <label class="toggle-switch">
                <input type="checkbox" id="encryption-toggle">
                <span class="toggle-slider"></span>
                <span class="toggle-label">Encrypt data before upload</span>
              </label>
              
              <label class="toggle-switch">
                <input type="checkbox" id="compression-toggle">
                <span class="toggle-slider"></span>
                <span class="toggle-label">Compress data to save bandwidth</span>
              </label>
            </div>
            
            <div class="setting-section">
              <h4>Sync Triggers</h4>
              <label class="toggle-switch">
                <input type="checkbox" id="sync-on-start-toggle">
                <span class="toggle-slider"></span>
                <span class="toggle-label">Sync when extension starts</span>
              </label>
              
              <label class="toggle-switch">
                <input type="checkbox" id="sync-on-change-toggle">
                <span class="toggle-slider"></span>
                <span class="toggle-label">Sync when data changes</span>
              </label>
            </div>
          </div>
          
          <div class="modal-footer">
            <button id="save-settings-btn" class="btn-primary">Save Settings</button>
            <button id="reset-sync-btn" class="btn-secondary">Reset Sync Data</button>
          </div>
        </div>
      </div>
    `;
    
    // Add CSS styles
    this.injectStyles();
  }
  
  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .cloud-sync-widget {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(5, 150, 105, 0.2);
        border-radius: 12px;
        padding: 16px;
        margin: 12px 0;
        backdrop-filter: blur(20px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .sync-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .sync-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .sync-controls {
        display: flex;
        gap: 8px;
      }
      
      .btn-sync-now, .btn-sync-settings {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 6px 10px;
        color: #ffffff;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }
      
      .btn-sync-now:hover, .btn-sync-settings:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }
      
      .btn-sync-now:active, .btn-sync-settings:active {
        transform: translateY(0);
      }
      
      .btn-sync-now.syncing {
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .status-badge {
        background: #10b981;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .status-badge.error { background: #ef4444; }
      .status-badge.syncing { background: #f59e0b; }
      .status-badge.unknown { background: #6b7280; }
      
      .sync-status-details {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;
      }
      
      .status-item {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
      }
      
      .status-label {
        color: #374151;
        font-weight: 500;
      }
      
      .status-value {
        color: #1f2937;
        font-weight: 600;
      }
      
      .sync-progress {
        margin-top: 12px;
      }
      
      .progress-bar {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        height: 8px;
        overflow: hidden;
        margin-bottom: 6px;
      }
      
      .progress-fill {
        background: linear-gradient(90deg, #10b981, #06b6d4);
        height: 100%;
        width: 0%;
        border-radius: 8px;
        transition: width 0.3s ease;
      }
      
      .progress-text {
        text-align: center;
        font-size: 11px;
        color: #6b7280;
      }
      
      .sync-error {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 8px;
        padding: 8px;
        margin-top: 8px;
      }
      
      .error-message {
        flex: 1;
        font-size: 12px;
        color: #ff6b6b;
      }
      
      .btn-retry {
        background: #ef4444;
        color: white;
        border: none;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 11px;
        cursor: pointer;
      }
      
      .sync-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .modal-content {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        color: white;
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .modal-header h3 {
        margin: 0;
        font-size: 18px;
      }
      
      .btn-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
      }
      
      .btn-close:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .modal-body {
        padding: 20px;
      }
      
      .setting-section {
        margin-bottom: 24px;
      }
      
      .setting-section h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        color: #ffffff;
      }
      
      .setting-item {
        margin: 12px 0;
      }
      
      .setting-item label {
        display: block;
        margin-bottom: 6px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
      }
      
      .sync-select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 14px;
      }
      
      .sync-select option {
        background: #333;
        color: white;
      }
      
      .toggle-switch {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 12px 0;
        cursor: pointer;
      }
      
      .toggle-slider {
        position: relative;
        width: 50px;
        height: 24px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 24px;
        transition: all 0.2s;
      }
      
      .toggle-slider::before {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        transition: all 0.2s;
      }
      
      .toggle-switch input:checked + .toggle-slider {
        background: #10b981;
      }
      
      .toggle-switch input:checked + .toggle-slider::before {
        transform: translateX(26px);
      }
      
      .toggle-switch input {
        display: none;
      }
      
      .toggle-label {
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
      }
      
      .modal-footer {
        padding: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        gap: 12px;
      }
      
      .btn-primary, .btn-secondary {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .btn-primary {
        background: #10b981;
        color: white;
        flex: 1;
      }
      
      .btn-primary:hover {
        background: #059669;
        transform: translateY(-1px);
      }
      
      .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      
      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    `;
    
    document.head.appendChild(style);
  }
  
  bindEvents() {
    // Sync now button
    document.getElementById('sync-now-btn')?.addEventListener('click', () => {
      this.performManualSync();
    });
    
    // Settings button
    document.getElementById('sync-settings-btn')?.addEventListener('click', () => {
      this.openSettings();
    });
    
    // Retry button
    document.getElementById('retry-sync-btn')?.addEventListener('click', () => {
      this.performManualSync();
    });
    
    // Settings modal events
    document.getElementById('close-settings-btn')?.addEventListener('click', () => {
      this.closeSettings();
    });
    
    document.getElementById('save-settings-btn')?.addEventListener('click', () => {
      this.saveSettings();
    });
    
    document.getElementById('reset-sync-btn')?.addEventListener('click', () => {
      this.resetSync();
    });
    
    // Close modal on background click
    document.getElementById('sync-settings-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'sync-settings-modal') {
        this.closeSettings();
      }
    });
    
    // Cloud sync event listeners
    if (this.cloudSync) {
      this.cloudSync.on('syncComplete', (data) => {
        this.onSyncComplete(data);
      });
      
      this.cloudSync.on('syncError', (data) => {
        this.onSyncError(data);
      });
    }
  }
  
  async performManualSync() {
    if (!this.cloudSync) {
      this.showError('Cloud sync not available');
      return;
    }
    
    this.showProgress('Starting sync...');
    
    try {
      const result = await this.cloudSync.forceSync();
      
      if (result.success) {
        this.showSuccess(`Sync completed! ${result.wordsCount} words synchronized.`);
      } else {
        this.showError(result.message);
      }
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.hideProgress();
    }
  }
  
  async openSettings() {
    const modal = document.getElementById('sync-settings-modal');
    if (!modal) return;
    
    // Load current settings
    await this.loadSettingsValues();
    
    modal.style.display = 'flex';
  }
  
  closeSettings() {
    const modal = document.getElementById('sync-settings-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
  
  async loadSettingsValues() {
    if (!this.cloudSync) return;
    
    const status = await this.cloudSync.getStatus();
    
    // Load toggle states
    document.getElementById('auto-sync-toggle').checked = status.autoSyncEnabled;
    document.getElementById('encryption-toggle').checked = this.cloudSync.config.encryptionEnabled;
    document.getElementById('compression-toggle').checked = this.cloudSync.config.compressionEnabled;
    document.getElementById('sync-on-start-toggle').checked = this.cloudSync.config.syncOnExtensionStart;
    document.getElementById('sync-on-change-toggle').checked = this.cloudSync.config.syncOnDataChange;
    
    // Load select values
    document.getElementById('sync-interval').value = this.cloudSync.config.autoSyncInterval.toString();
    document.getElementById('conflict-strategy').value = this.cloudSync.config.conflictResolutionStrategy;
  }
  
  async saveSettings() {
    if (!this.cloudSync) return;
    
    try {
      // Get values from form
      const autoSyncEnabled = document.getElementById('auto-sync-toggle').checked;
      const syncInterval = parseInt(document.getElementById('sync-interval').value);
      const conflictStrategy = document.getElementById('conflict-strategy').value;
      const encryptionEnabled = document.getElementById('encryption-toggle').checked;
      const compressionEnabled = document.getElementById('compression-toggle').checked;
      const syncOnStart = document.getElementById('sync-on-start-toggle').checked;
      const syncOnChange = document.getElementById('sync-on-change-toggle').checked;
      
      // Update config
      this.cloudSync.config.autoSyncEnabled = autoSyncEnabled;
      this.cloudSync.config.autoSyncInterval = syncInterval;
      this.cloudSync.config.conflictResolutionStrategy = conflictStrategy;
      this.cloudSync.config.encryptionEnabled = encryptionEnabled;
      this.cloudSync.config.compressionEnabled = compressionEnabled;
      this.cloudSync.config.syncOnExtensionStart = syncOnStart;
      this.cloudSync.config.syncOnDataChange = syncOnChange;
      
      // Save to storage
      await this.cloudSync.saveSyncConfig();
      
      // Apply auto-sync setting
      if (autoSyncEnabled) {
        await this.cloudSync.enableAutoSync(syncInterval);
      } else {
        await this.cloudSync.disableAutoSync();
      }
      
      this.closeSettings();
      this.showSuccess('Settings saved successfully!');
      
    } catch (error) {
      this.showError('Failed to save settings: ' + error.message);
    }
  }
  
  async resetSync() {
    if (!this.cloudSync) return;
    
    const confirmed = confirm(
      'This will reset all sync data and settings. ' +
      'Your local vocabulary will not be affected. ' +
      'Are you sure you want to continue?'
    );
    
    if (confirmed) {
      try {
        await this.cloudSync.resetSync();
        this.closeSettings();
        this.showSuccess('Sync data reset successfully!');
        this.updateStatus();
      } catch (error) {
        this.showError('Failed to reset sync data: ' + error.message);
      }
    }
  }
  
  async updateStatus() {
    if (!this.cloudSync) {
      this.setStatusBadge('unknown', 'Unknown');
      return;
    }
    
    try {
      const status = await this.cloudSync.getStatus();
      
      // Update status badge
      if (status.syncInProgress) {
        this.setStatusBadge('syncing', 'Syncing');
      } else if (status.consecutiveFailures > 0) {
        this.setStatusBadge('error', 'Error');
      } else if (status.lastSyncSuccess) {
        this.setStatusBadge('success', 'Online');
      } else {
        this.setStatusBadge('unknown', 'Unknown');
      }
      
      // Update status details
      const lastSyncEl = document.getElementById('last-sync-time');
      if (lastSyncEl) {
        if (status.lastSyncTime) {
          const lastSync = new Date(status.lastSyncTime);
          const now = new Date();
          const diffMs = now - lastSync;
          const diffMins = Math.floor(diffMs / (1000 * 60));
          
          if (diffMins < 1) {
            lastSyncEl.textContent = 'Just now';
          } else if (diffMins < 60) {
            lastSyncEl.textContent = `${diffMins}m ago`;
          } else if (diffMins < 1440) {
            lastSyncEl.textContent = `${Math.floor(diffMins / 60)}h ago`;
          } else {
            lastSyncEl.textContent = `${Math.floor(diffMins / 1440)}d ago`;
          }
        } else {
          lastSyncEl.textContent = 'Never';
        }
      }
      
      const wordsCountEl = document.getElementById('synced-words-count');
      if (wordsCountEl) {
        wordsCountEl.textContent = status.wordsCount.toString();
      }
      
      const autoSyncEl = document.getElementById('auto-sync-status');
      if (autoSyncEl) {
        autoSyncEl.textContent = status.autoSyncEnabled ? 'On' : 'Off';
      }
      
      // Update sync button state
      const syncBtn = document.getElementById('sync-now-btn');
      if (syncBtn) {
        if (status.syncInProgress) {
          syncBtn.classList.add('syncing');
          syncBtn.disabled = true;
        } else {
          syncBtn.classList.remove('syncing');
          syncBtn.disabled = false;
        }
      }
      
    } catch (error) {
      console.error('Failed to update sync status:', error);
      this.setStatusBadge('error', 'Error');
    }
  }
  
  setStatusBadge(type, text) {
    const badge = document.getElementById('sync-status-badge');
    if (badge) {
      badge.className = `status-badge ${type}`;
      badge.textContent = text;
    }
  }
  
  showProgress(message) {
    const progressEl = document.getElementById('sync-progress');
    const errorEl = document.getElementById('sync-error');
    const textEl = document.getElementById('progress-text');
    
    if (progressEl) progressEl.style.display = 'block';
    if (errorEl) errorEl.style.display = 'none';
    if (textEl) textEl.textContent = message;
    
    this.animateProgress();
  }
  
  hideProgress() {
    const progressEl = document.getElementById('sync-progress');
    if (progressEl) {
      progressEl.style.display = 'none';
    }
  }
  
  animateProgress() {
    const fillEl = document.getElementById('progress-fill');
    if (!fillEl) return;
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 90) {
        progress = 90;
        clearInterval(interval);
      }
      fillEl.style.width = progress + '%';
    }, 200);
    
    // Store interval for cleanup
    this.progressInterval = interval;
  }
  
  showError(message) {
    const errorEl = document.getElementById('sync-error');
    const messageEl = document.getElementById('sync-error-message');
    const progressEl = document.getElementById('sync-progress');
    
    if (errorEl) errorEl.style.display = 'flex';
    if (messageEl) messageEl.textContent = message;
    if (progressEl) progressEl.style.display = 'none';
    
    // Clear progress animation
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
  
  showSuccess(message) {
    // Create temporary success message
    const container = document.querySelector('.cloud-sync-widget');
    if (!container) return;
    
    const successEl = document.createElement('div');
    successEl.className = 'sync-success';
    successEl.style.cssText = `
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.5);
      color: #10b981;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    successEl.innerHTML = `<span>✅</span><span>${message}</span>`;
    
    container.appendChild(successEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (successEl.parentNode) {
        successEl.parentNode.removeChild(successEl);
      }
    }, 3000);
  }
  
  onSyncComplete(data) {
    this.hideProgress();
    this.updateStatus();
    
    const errorEl = document.getElementById('sync-error');
    if (errorEl) errorEl.style.display = 'none';
    
    if (data.trigger !== 'auto') { // Don't show message for auto-sync
      this.showSuccess(`Sync completed! ${data.wordsCount} words synchronized.`);
    }
  }
  
  onSyncError(data) {
    this.hideProgress();
    this.updateStatus();
    this.showError(data.error);
  }
  
  startStatusUpdates() {
    // Update status immediately
    this.updateStatus();
    
    // Set up periodic updates
    this.statusUpdateInterval = setInterval(() => {
      this.updateStatus();
    }, 30000); // Update every 30 seconds
  }
  
  stopStatusUpdates() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }
  }
  
  destroy() {
    this.stopStatusUpdates();
    
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    
    // Remove event listeners
    if (this.cloudSync) {
      this.cloudSync.off('syncComplete', this.onSyncComplete);
      this.cloudSync.off('syncError', this.onSyncError);
    }
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.CloudSyncUI = CloudSyncUI;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CloudSyncUI;
}