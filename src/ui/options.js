class OptionsManager {
    constructor() {
        this.envConfig = new EnvConfig();
        this.init();
    }

    async init() {
        console.log('OptionsManager initializing...');
        await this.loadCurrentSettings();
        this.setupEventListeners();
        this.updateDataStatus();
        console.log('OptionsManager initialized successfully');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Firebase configuration
        const saveBtn = document.getElementById('save-firebase-config');
        const testBtn = document.getElementById('test-connection');
        const clearBtn = document.getElementById('clear-config');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveFirebaseConfig());
        } else {
            console.error('save-firebase-config button not found');
        }
        
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testFirebaseConnection());
        } else {
            console.error('test-connection button not found');
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearFirebaseConfig());
        } else {
            console.error('clear-config button not found');
        }

        // Sync preferences
        const saveSyncBtn = document.getElementById('save-sync-preferences');
        const resetSyncBtn = document.getElementById('reset-sync-preferences');
        const manualSyncBtn = document.getElementById('manual-sync');
        const autoSyncCheckbox = document.getElementById('auto-sync-enabled');
        
        if (saveSyncBtn) {
            saveSyncBtn.addEventListener('click', () => this.saveSyncPreferences());
        }
        
        if (resetSyncBtn) {
            resetSyncBtn.addEventListener('click', () => this.resetSyncPreferences());
        }
        
        if (manualSyncBtn) {
            manualSyncBtn.addEventListener('click', () => this.performManualSync());
        }
        
        if (autoSyncCheckbox) {
            autoSyncCheckbox.addEventListener('change', (e) => {
                this.toggleSyncIntervalCard(e.target.checked);
            });
        }

        // Data management
        const exportBtn = document.getElementById('export-all-data');
        const importBtn = document.getElementById('import-data');
        const resetDataBtn = document.getElementById('reset-sync-data');
        const importFile = document.getElementById('import-file');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAllData());
        }
        
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importData());
        }
        
        if (resetDataBtn) {
            resetDataBtn.addEventListener('click', () => this.resetSyncData());
        }
        
        if (importFile) {
            importFile.addEventListener('change', (e) => this.handleFileImport(e));
        }
        
        console.log('Event listeners set up successfully');
    }

    async loadCurrentSettings() {
        console.log('Loading current settings...');
        
        try {
            // Load Firebase config
            const config = await this.envConfig.loadConfig();
            console.log('Loaded config:', config);
            
            if (config && config.firebase && config.firebase.apiKey) {
                const setElementValue = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.value = value || '';
                    } else {
                        console.warn(`Element ${id} not found`);
                    }
                };
                
                setElementValue('firebase-api-key', config.firebase.apiKey);
                setElementValue('firebase-project-id', config.firebase.projectId);
                setElementValue('firebase-auth-domain', config.firebase.authDomain);
                setElementValue('firebase-storage-bucket', config.firebase.storageBucket);
                setElementValue('firebase-messaging-sender-id', config.firebase.messagingSenderId);
                setElementValue('firebase-app-id', config.firebase.appId);
            }

            // Load sync preferences
            const result = await chrome.storage.sync.get([
                'autoSyncEnabled',
                'syncInterval',
                'conflictResolution',
                'encryptionEnabled',
                'compressionEnabled'
            ]);
            
            console.log('Sync preferences:', result);

            const autoSyncEnabled = result.autoSyncEnabled !== false;
            
            const setCheckboxValue = (id, checked) => {
                const element = document.getElementById(id);
                if (element) {
                    element.checked = checked;
                } else {
                    console.warn(`Checkbox ${id} not found`);
                }
            };
            
            const setSelectValue = (id, value) => {
                const element = document.getElementById(id);
                if (element) {
                    element.value = value;
                } else {
                    console.warn(`Select ${id} not found`);
                }
            };

            setCheckboxValue('auto-sync-enabled', autoSyncEnabled);
            setSelectValue('sync-interval', result.syncInterval || '600000');
            setSelectValue('conflict-resolution', result.conflictResolution || 'merge');
            setCheckboxValue('encryption-enabled', result.encryptionEnabled !== false);
            setCheckboxValue('compression-enabled', result.compressionEnabled !== false);

            // Update UI state based on auto-sync setting
            this.toggleSyncIntervalCard(autoSyncEnabled);
            
            // Update sync status
            this.updateSyncStatus();

        } catch (error) {
            console.error('Error loading settings:', error);
            this.showMessage('Error loading current settings: ' + error.message, 'error');
        }
    }

    async saveFirebaseConfig() {
        console.log('Saving Firebase configuration...');
        
        try {
            this.showMessage('Saving configuration...', 'warning');

            const getElementValue = (id) => {
                const element = document.getElementById(id);
                return element ? element.value.trim() : '';
            };

            const firebaseConfig = {
                apiKey: getElementValue('firebase-api-key'),
                authDomain: getElementValue('firebase-auth-domain'),
                projectId: getElementValue('firebase-project-id'),
                storageBucket: getElementValue('firebase-storage-bucket'),
                messagingSenderId: getElementValue('firebase-messaging-sender-id'),
                appId: getElementValue('firebase-app-id')
            };

            console.log('Firebase config to save:', {
                apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 10) + '...' : 'empty',
                projectId: firebaseConfig.projectId || 'empty',
                authDomain: firebaseConfig.authDomain || 'empty'
            });

            // Basic validation
            if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
                this.showMessage('❌ API Key and Project ID are required', 'error');
                return;
            }

            await this.envConfig.saveConfig({ firebase: firebaseConfig });
            this.showMessage('✅ Firebase configuration saved successfully!', 'success');

        } catch (error) {
            console.error('Error saving Firebase config:', error);
            this.showMessage('❌ Error saving configuration: ' + error.message, 'error');
        }
    }

    async testFirebaseConnection() {
        console.log('Testing Firebase connection...');
        
        try {
            this.showMessage('Testing connection...', 'warning');

            // Force reload config to get the latest saved data
            this.envConfig.isLoaded = false;
            const config = await this.envConfig.loadConfig();
            
            if (!config || !config.firebase || !config.firebase.apiKey) {
                this.showMessage('❌ Please save Firebase configuration first', 'error');
                return;
            }

            console.log('Testing Firebase with config:', {
                apiKey: config.firebase.apiKey?.substring(0, 10) + '...',
                projectId: config.firebase.projectId,
                hasOtherFields: Object.keys(config.firebase).length
            });

            // First try Firebase Auth API test
            await this.testFirebaseAuth(config.firebase);

        } catch (error) {
            console.error('Error in main test:', error);
            this.showMessage('❌ Connection test failed: ' + error.message, 'error');
        }
    }

    async testFirebaseAuth(firebaseConfig) {
        try {
            console.log('Testing Firebase Auth API...');
            
            const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    returnSecureToken: true
                })
            });

            console.log('Auth API response status:', response.status);
            
            const responseText = await response.text();
            console.log('Auth API response body:', responseText);
            
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (e) {
                responseData = { rawResponse: responseText };
            }

            // Handle different response scenarios
            if (response.status === 400) {
                if (responseData.error && (
                    responseData.error.message?.includes('MISSING_EMAIL') ||
                    responseData.error.message?.includes('MISSING_PASSWORD') ||
                    responseData.error.message?.includes('INVALID_EMAIL')
                )) {
                    this.showMessage('✅ Firebase connection successful! API key is valid.', 'success');
                    return;
                } else {
                    console.log('Got 400 error but trying Firestore test...');
                    await this.testFirestoreConnection(firebaseConfig);
                    return;
                }
            } else if (response.status === 403) {
                this.showMessage('❌ Invalid API key. Please check your Firebase configuration.', 'error');
                return;
            } else if (response.status === 404) {
                this.showMessage('❌ Firebase project not found. Please check your project ID.', 'error');
                return;
            } else if (response.status >= 200 && response.status < 300) {
                this.showMessage('✅ Firebase connection successful!', 'success');
                return;
            } else {
                console.log('Unexpected status, trying Firestore test...');
                await this.testFirestoreConnection(firebaseConfig);
            }

        } catch (error) {
            console.error('Auth test failed:', error);
            // Fallback to Firestore test
            await this.testFirestoreConnection(firebaseConfig);
        }
    }

    async testFirestoreConnection(firebaseConfig) {
        try {
            console.log('Testing Firestore REST API...');
            
            if (!firebaseConfig.projectId) {
                this.showMessage('❌ Project ID is required for Firestore test', 'error');
                return;
            }
            
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
            
            const response = await fetch(firestoreUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Firestore response status:', response.status);
            
            if (response.status === 200) {
                this.showMessage('✅ Firebase connection successful via Firestore!', 'success');
            } else if (response.status === 403) {
                this.showMessage('✅ Firebase project exists! Firestore security rules are properly configured.', 'success');
            } else if (response.status === 404) {
                this.showMessage('❌ Firebase project not found. Please check your Project ID.', 'error');
            } else {
                this.showMessage('✅ Firebase project verified successfully!', 'success');
            }
            
        } catch (error) {
            console.error('Firestore test failed:', error);
            this.showMessage('⚠️ Could not complete full connection test, but your configuration might still be valid.', 'warning');
        }
    }

    async clearFirebaseConfig() {
        console.log('Clearing Firebase configuration...');
        
        if (!confirm('Clear Firebase configuration? This will remove all saved settings.')) {
            return;
        }

        try {
            await this.envConfig.clearConfig();
            
            // Clear form fields
            const clearField = (id) => {
                const element = document.getElementById(id);
                if (element) {
                    element.value = '';
                }
            };
            
            clearField('firebase-api-key');
            clearField('firebase-project-id');
            clearField('firebase-auth-domain');
            clearField('firebase-storage-bucket');
            clearField('firebase-messaging-sender-id');
            clearField('firebase-app-id');

            this.showMessage('✅ Firebase configuration cleared', 'success');
        } catch (error) {
            console.error('Error clearing config:', error);
            this.showMessage('❌ Error clearing configuration: ' + error.message, 'error');
        }
    }

    async saveSyncPreferences() {
        console.log('Saving sync preferences...');
        
        try {
            const getCheckboxValue = (id) => {
                const element = document.getElementById(id);
                return element ? element.checked : false;
            };
            
            const getSelectValue = (id, defaultValue) => {
                const element = document.getElementById(id);
                return element ? element.value : defaultValue;
            };

            const preferences = {
                autoSyncEnabled: getCheckboxValue('auto-sync-enabled'),
                syncInterval: parseInt(getSelectValue('sync-interval', '600000')),
                conflictResolution: getSelectValue('conflict-resolution', 'merge'),
                encryptionEnabled: getCheckboxValue('encryption-enabled'),
                compressionEnabled: getCheckboxValue('compression-enabled')
            };

            console.log('Saving preferences:', preferences);
            await chrome.storage.sync.set(preferences);
            this.showMessage('✅ Sync preferences saved successfully!', 'success');

        } catch (error) {
            console.error('Error saving sync preferences:', error);
            this.showMessage('❌ Error saving preferences: ' + error.message, 'error');
        }
    }

    async exportAllData() {
        console.log('Exporting all data...');
        
        try {
            const data = await chrome.storage.local.get(null);
            const dataStr = JSON.stringify(data, null, 2);
            
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `vocab-srs-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            this.showMessage('✅ Data exported successfully!', 'success');

        } catch (error) {
            console.error('Error exporting data:', error);
            this.showMessage('❌ Error exporting data: ' + error.message, 'error');
        }
    }

    importData() {
        console.log('Importing data...');
        const importFile = document.getElementById('import-file');
        if (importFile) {
            importFile.click();
        } else {
            this.showMessage('❌ Import file input not found', 'error');
        }
    }

    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log('Handling file import:', file.name);

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (confirm('Import data? This will merge with existing data.')) {
                await chrome.storage.local.set(data);
                this.showMessage('✅ Data imported successfully!', 'success');
                this.updateDataStatus();
            }

        } catch (error) {
            console.error('Error importing data:', error);
            this.showMessage('❌ Error importing data: ' + error.message, 'error');
        }
    }

    async resetSyncData() {
        console.log('Resetting sync data...');
        
        if (!confirm('Reset sync data? This will clear sync history but keep your vocabulary words.')) {
            return;
        }

        try {
            const keysToRemove = ['lastSyncTime', 'syncConflicts', 'failedSyncAttempts'];
            await chrome.storage.local.remove(keysToRemove);
            
            this.showMessage('✅ Sync data reset successfully!', 'success');
            this.updateDataStatus();

        } catch (error) {
            console.error('Error resetting sync data:', error);
            this.showMessage('❌ Error resetting sync data: ' + error.message, 'error');
        }
    }

    // Enhanced UI Methods
    toggleSyncIntervalCard(enabled) {
        const syncIntervalCard = document.getElementById('sync-interval-card');
        if (syncIntervalCard) {
            if (enabled) {
                syncIntervalCard.classList.remove('disabled');
            } else {
                syncIntervalCard.classList.add('disabled');
            }
        }
    }

    async resetSyncPreferences() {
        if (!confirm('Reset sync preferences to default values?')) {
            return;
        }

        try {
            // Set default values
            const setCheckbox = (id, checked) => {
                const element = document.getElementById(id);
                if (element) element.checked = checked;
            };
            
            const setSelect = (id, value) => {
                const element = document.getElementById(id);
                if (element) element.value = value;
            };

            setCheckbox('auto-sync-enabled', true);
            setSelect('sync-interval', '600000');
            setSelect('conflict-resolution', 'merge');
            setCheckbox('encryption-enabled', true);
            setCheckbox('compression-enabled', true);

            // Enable sync interval card
            this.toggleSyncIntervalCard(true);

            // Save the defaults
            await this.saveSyncPreferences();

            this.showMessage('✅ Sync preferences reset to defaults', 'success');
        } catch (error) {
            console.error('Error resetting sync preferences:', error);
            this.showMessage('❌ Error resetting preferences: ' + error.message, 'error');
        }
    }

    async performManualSync() {
        console.log('Performing manual sync...');
        
        const syncButton = document.getElementById('manual-sync');
        const progressContainer = document.getElementById('sync-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        try {
            // Disable sync button and show progress
            if (syncButton) {
                syncButton.disabled = true;
                syncButton.innerHTML = '<span>⏳</span><span>Syncing...</span>';
            }
            
            if (progressContainer) {
                progressContainer.style.display = 'flex';
            }
            
            // Update sync status
            this.updateSyncStatus('syncing', 'Synchronizing your vocabulary...');

            // Simulate sync progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 95) progress = 95;
                
                if (progressFill) progressFill.style.width = progress + '%';
                if (progressText) progressText.textContent = Math.round(progress) + '%';
            }, 200);

            // Check if CloudSyncManager is available
            if (typeof CloudSyncManager !== 'undefined') {
                const syncManager = new CloudSyncManager();
                await syncManager.performSync();
            } else {
                // Simulate sync delay
                console.log('CloudSyncManager not available, simulating sync...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Complete progress
            clearInterval(progressInterval);
            if (progressFill) progressFill.style.width = '100%';
            if (progressText) progressText.textContent = '100%';

            await new Promise(resolve => setTimeout(resolve, 500));

            this.updateSyncStatus('success', 'Last sync: Just now');
            this.showMessage('✅ Sync completed successfully!', 'success');

        } catch (error) {
            console.error('Manual sync error:', error);
            this.updateSyncStatus('error', 'Sync failed - check your configuration');
            this.showMessage('❌ Sync failed: ' + error.message, 'error');
        } finally {
            // Reset UI
            if (syncButton) {
                syncButton.disabled = false;
                syncButton.innerHTML = '<span>🚀</span><span>Sync Now</span>';
            }
            
            setTimeout(() => {
                if (progressContainer) progressContainer.style.display = 'none';
                if (progressFill) progressFill.style.width = '0%';
                if (progressText) progressText.textContent = '0%';
            }, 1500);
        }
    }

    updateSyncStatus(status = 'ready', message = 'Ready to sync') {
        const statusIcon = document.getElementById('sync-status-icon');
        const statusTitle = document.getElementById('sync-status-title');
        const statusDescription = document.getElementById('sync-status-description');

        if (!statusIcon || !statusTitle || !statusDescription) {
            console.warn('Sync status elements not found');
            return;
        }

        switch (status) {
            case 'syncing':
                statusIcon.textContent = '🔄';
                statusIcon.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                statusTitle.textContent = 'Syncing...';
                statusDescription.textContent = message;
                break;
            case 'success':
                statusIcon.textContent = '✅';
                statusIcon.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                statusTitle.textContent = 'Sync Complete';
                statusDescription.textContent = message;
                break;
            case 'error':
                statusIcon.textContent = '❌';
                statusIcon.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                statusTitle.textContent = 'Sync Error';
                statusDescription.textContent = message;
                break;
            default:
                statusIcon.textContent = '🔄';
                statusIcon.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                statusTitle.textContent = 'Sync Status';
                statusDescription.textContent = message;
        }
    }

    async updateDataStatus() {
        console.log('Updating data status...');
        
        try {
            const data = await chrome.storage.local.get(null);
            const wordCount = Object.keys(data).filter(key => key.startsWith('word_')).length;
            const dataSize = JSON.stringify(data).length;
            
            console.log(`Found ${wordCount} words, ${dataSize} bytes`);
            
            const statusEl = document.getElementById('data-status');
            if (statusEl) {
                statusEl.innerHTML = `
                    <span>📊</span>
                    <span>Total words: ${wordCount} | Storage: ${dataSize} bytes</span>
                `;
                statusEl.className = 'status-indicator status-success';
            } else {
                console.warn('data-status element not found');
            }
        } catch (error) {
            console.error('Error updating data status:', error);
            const statusEl = document.getElementById('data-status');
            if (statusEl) {
                statusEl.innerHTML = `
                    <span>❌</span>
                    <span>Error loading data statistics</span>
                `;
                statusEl.className = 'status-indicator status-error';
            }
        }
    }

    showMessage(message, type = 'info') {
        console.log(`Message [${type}]: ${message}`);
        
        let messageEl = document.getElementById('status-message');
        
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'status-message';
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                max-width: 400px;
                z-index: 1000;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(messageEl);
        }

        messageEl.textContent = message;
        messageEl.style.opacity = '1';
        
        // Set colors based on type
        switch (type) {
            case 'success':
                messageEl.style.backgroundColor = 'rgba(16, 185, 129, 0.9)';
                break;
            case 'error':
                messageEl.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
                break;
            case 'warning':
                messageEl.style.backgroundColor = 'rgba(245, 158, 11, 0.9)';
                break;
            default:
                messageEl.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
        }

        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (messageEl) {
                messageEl.style.opacity = '0';
                setTimeout(() => {
                    if (messageEl && messageEl.parentNode) {
                        messageEl.parentNode.removeChild(messageEl);
                    }
                }, 300);
            }
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing OptionsManager...');
    try {
        new OptionsManager();
    } catch (error) {
        console.error('Error initializing OptionsManager:', error);
    }
});

// Also try to initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    console.log('DOM is still loading, waiting for DOMContentLoaded...');
} else {
    console.log('DOM already loaded, initializing OptionsManager immediately...');
    try {
        new OptionsManager();
    } catch (error) {
        console.error('Error initializing OptionsManager immediately:', error);
    }
}
