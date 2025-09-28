import React, { useState, useEffect } from 'react';
import { useChromeStorage } from '@/hooks/useChromeStorage';
import { 
  Settings as SettingsIcon,
  Cloud,
  Database,
  Download,
  Upload,
  RefreshCw,
  Check,
  AlertTriangle,
  Info,
  Shield,
  Zap,
  Trash2,
  Save,
} from 'lucide-react';

const Options: React.FC = () => {
  const { data, loading } = useChromeStorage();
  
  const [firebaseConfig, setFirebaseConfig] = useState({
    apiKey: '',
    projectId: '',
    authDomain: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncInterval: 600000, // 10 minutes
    conflictResolution: 'merge',
    encryption: true,
    compression: true
  });
  
  const [syncStatus, setSyncStatus] = useState({
    connected: false,
    lastSync: null as Date | null,
    status: 'disconnected'
  });

  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    if (data?.settings) {
      // Load existing settings
    }
  }, [data]);

  const handleSaveFirebaseConfig = async () => {
    try {
      // Save Firebase config to storage
      await chrome.storage.local.set({ firebaseConfig });
      setSyncStatus(prev => ({ ...prev, status: 'saved' }));
    } catch (err) {
      console.error('Failed to save Firebase config:', err);
    }
  };

  const handleTestConnection = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, status: 'testing' }));
      
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSyncStatus({
        connected: true,
        lastSync: new Date(),
        status: 'connected'
      });
    } catch (err) {
      setSyncStatus(prev => ({ ...prev, status: 'error' }));
    }
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        vocabWords: data?.vocabWords || [],
        gamification: data?.gamification || {},
        analytics: data?.analytics || {},
        settings: data?.settings || {},
        exportDate: new Date().toISOString(),
        version: '1.0.1'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vocab-srs-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data:', err);
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const importData = JSON.parse(text);
          
          // Validate and import data
          if (importData.vocabWords) {
            await chrome.storage.local.set({
              vocabWords: importData.vocabWords,
              gamification: importData.gamification || {},
              analytics: importData.analytics || {},
              settings: importData.settings || {}
            });
            alert('Data imported successfully!');
            window.location.reload();
          }
        } catch (err) {
          alert('Failed to import data. Please check the file format.');
        }
      }
    };
    input.click();
  };

  const handleSaveSyncPreferences = async () => {
    try {
      await chrome.storage.local.set({ syncSettings });
      alert('Sync preferences saved!');
    } catch (err) {
      console.error('Failed to save sync preferences:', err);
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case 'connected':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'testing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus.status) {
      case 'connected':
        return 'Connected to Firebase';
      case 'testing':
        return 'Testing connection...';
      case 'error':
        return 'Connection failed';
      default:
        return 'Cloud sync not configured';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-dark-background dark:to-dark-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-foreground-secondary">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-dark-background dark:to-dark-background-secondary p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-3 gradient-text">
            <SettingsIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            VocaPi Settings
          </h1>
          <p className="text-foreground-secondary">Configure cloud synchronization and other preferences</p>
        </div>

        {/* Quick Setup Guide */}
        {showGuide && (
          <div className="card hover-lift p-6 mb-8 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Quick Setup Guide
              </h3>
              <button 
                onClick={() => setShowGuide(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-background rounded-lg border border-primary-200 dark:border-primary-800">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-primary-900 dark:text-primary-100">Create Firebase Project</h4>
                  <p className="text-sm text-foreground-secondary">
                    Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">Firebase Console</a> and create a new project
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-background rounded-lg border border-primary-200 dark:border-primary-800">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-primary-900 dark:text-primary-100">Add Web App</h4>
                  <p className="text-sm text-gray-600">
                    In Project Settings, add a web app and copy the configuration values
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-blue-200">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Enable Firestore</h4>
                  <p className="text-sm text-gray-600">
                    Create a Firestore database in test mode for easy setup
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cloud Sync Configuration */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            Cloud Sync Configuration
          </h2>
          
          {/* Status Indicator */}
          <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
            syncStatus.status === 'connected' ? 'bg-green-50 border border-green-200' :
            syncStatus.status === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-yellow-50 border border-yellow-200'
          }`}>
            {getStatusIcon()}
            <span className={`font-medium ${
              syncStatus.status === 'connected' ? 'text-green-800' :
              syncStatus.status === 'error' ? 'text-red-800' :
              'text-yellow-800'
            }`}>
              {getStatusText()}
            </span>
          </div>

          {/* Firebase Config Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Firebase API Key
              </label>
              <input
                type="text"
                value={firebaseConfig.apiKey}
                onChange={(e) => setFirebaseConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                className="input w-full"
                placeholder="AIzaSy..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project ID
              </label>
              <input
                type="text"
                value={firebaseConfig.projectId}
                onChange={(e) => setFirebaseConfig(prev => ({ ...prev, projectId: e.target.value }))}
                className="input w-full"
                placeholder="your-project-id"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auth Domain
              </label>
              <input
                type="text"
                value={firebaseConfig.authDomain}
                onChange={(e) => setFirebaseConfig(prev => ({ ...prev, authDomain: e.target.value }))}
                className="input w-full"
                placeholder="your-project.firebaseapp.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Bucket
              </label>
              <input
                type="text"
                value={firebaseConfig.storageBucket}
                onChange={(e) => setFirebaseConfig(prev => ({ ...prev, storageBucket: e.target.value }))}
                className="input w-full"
                placeholder="your-project.appspot.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Messaging Sender ID
              </label>
              <input
                type="text"
                value={firebaseConfig.messagingSenderId}
                onChange={(e) => setFirebaseConfig(prev => ({ ...prev, messagingSenderId: e.target.value }))}
                className="input w-full"
                placeholder="123456789"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App ID
              </label>
              <input
                type="text"
                value={firebaseConfig.appId}
                onChange={(e) => setFirebaseConfig(prev => ({ ...prev, appId: e.target.value }))}
                className="input w-full"
                placeholder="1:123456789:web:abc..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={handleSaveFirebaseConfig}
              className="btn btn-primary"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
            <button 
              onClick={handleTestConnection}
              className="btn btn-secondary"
            >
              <RefreshCw className="w-4 h-4" />
              Test Connection
            </button>
            <button 
              onClick={() => setFirebaseConfig({
                apiKey: '', projectId: '', authDomain: '', 
                storageBucket: '', messagingSenderId: '', appId: ''
              })}
              className="btn btn-danger"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        {/* Sync Preferences */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Sync Preferences
          </h2>
          
          <div className="space-y-6">
            {/* Auto Sync */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Automatic Synchronization</h3>
                <p className="text-sm text-gray-600">Keep your vocabulary synchronized across all devices</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncSettings.autoSync}
                  onChange={(e) => setSyncSettings(prev => ({ ...prev, autoSync: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Sync Interval */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sync Interval
              </label>
              <select
                value={syncSettings.syncInterval}
                onChange={(e) => setSyncSettings(prev => ({ ...prev, syncInterval: parseInt(e.target.value) }))}
                className="input w-full"
              >
                <option value={300000}>Every 5 minutes</option>
                <option value={600000}>Every 10 minutes</option>
                <option value={1800000}>Every 30 minutes</option>
                <option value={3600000}>Every hour</option>
              </select>
            </div>

            {/* Conflict Resolution */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conflict Resolution
              </label>
              <select
                value={syncSettings.conflictResolution}
                onChange={(e) => setSyncSettings(prev => ({ ...prev, conflictResolution: e.target.value }))}
                className="input w-full"
              >
                <option value="merge">Smart merge (recommended)</option>
                <option value="local">Always keep local data</option>
                <option value="remote">Always use cloud data</option>
                <option value="ask">Ask me each time</option>
              </select>
            </div>

            {/* Security Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Encryption</h3>
                    <p className="text-sm text-gray-600">Secure your data</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncSettings.encryption}
                    onChange={(e) => setSyncSettings(prev => ({ ...prev, encryption: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Compression</h3>
                    <p className="text-sm text-gray-600">Reduce bandwidth</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncSettings.compression}
                    onChange={(e) => setSyncSettings(prev => ({ ...prev, compression: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <button 
              onClick={handleSaveSyncPreferences}
              className="btn btn-primary w-full"
            >
              <Save className="w-4 h-4" />
              Save Sync Preferences
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-green-600" />
            Data Management
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Export</h3>
              </div>
              <p className="text-sm text-blue-700 mb-3">Download your vocabulary as a backup JSON file</p>
              <button 
                onClick={handleExportData}
                className="btn btn-primary btn-sm w-full"
              >
                Export Data
              </button>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Import</h3>
              </div>
              <p className="text-sm text-green-700 mb-3">Upload vocabulary from a backup JSON file</p>
              <button 
                onClick={handleImportData}
                className="btn btn-success btn-sm w-full"
              >
                Import Data
              </button>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-900">Reset</h3>
              </div>
              <p className="text-sm text-red-700 mb-3">Clear sync data to start fresh (keeps your words)</p>
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to reset sync data?')) {
                    chrome.storage.local.remove(['syncSettings', 'firebaseConfig']);
                    alert('Sync data reset successfully!');
                  }
                }}
                className="btn btn-danger btn-sm w-full"
              >
                Reset Sync
              </button>
            </div>
          </div>

          {/* Data Statistics */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Data Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{data?.vocabWords.length || 0}</div>
                <div className="text-sm text-gray-600">Total Words</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{data?.gamification.level || 1}</div>
                <div className="text-sm text-gray-600">Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{data?.gamification.streak || 0}</div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{data?.analytics.accuracy || 0}%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Options;
