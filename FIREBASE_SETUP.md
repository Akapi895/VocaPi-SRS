# 🔥 Firebase Setup Guide for Vocab SRS Cloud Sync

## 📋 Overview

This guide will help you set up Firebase to enable cloud synchronization for the Vocab SRS extension.

## 🚀 Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `vocab-srs-sync`
4. Enable Google Analytics (optional)
5. Create project

## 🔧 Step 2: Enable Required Services

### Firestore Database
1. Navigate to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select your preferred location
5. Click "Done"

### Authentication (Optional - for future user accounts)
1. Navigate to **Authentication**
2. Click "Get started"
3. Enable "Anonymous" authentication
4. Save changes

### Storage (Optional - for future file attachments)
1. Navigate to **Storage**
2. Click "Get started"
3. Choose security rules mode
4. Select storage location
5. Click "Done"

## ⚙️ Step 3: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → Web (</>) icon
4. Register app name: `vocab-srs-extension`
5. Copy the Firebase config object

## 🔐 Step 4: Update Extension Code

Replace the configuration in `src/cloud-sync.js`:

```javascript
// Firebase configuration (replace with your config)
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "vocab-srs-sync.firebaseapp.com",
  projectId: "vocab-srs-sync",
  storageBucket: "vocab-srs-sync.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 📝 Step 5: Set Up Firestore Security Rules

Go to Firestore → Rules and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users only
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // For anonymous users (temporary solution)
    match /anonymous_users/{userId} {
      allow read, write: if true; // Allow all for demo
    }
  }
}
```

## 🌐 Step 6: Add Firebase SDK (Production)

For production deployment, you'll need to include Firebase SDK:

### Option A: CDN (Recommended for extensions)
Add to your HTML files:

```html
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-auth-compat.js"></script>
```

### Option B: Bundle (Advanced)
```bash
npm install firebase
```

Then import in your modules:
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
```

## 🔒 Step 7: Security Considerations

### Data Encryption
- The current implementation includes basic encryption
- For production, consider using Web Crypto API:

```javascript
async function encryptData(data, key) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(JSON.stringify(data));
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encodedData
  );
  
  return {
    data: Array.from(new Uint8Array(encryptedData)),
    iv: Array.from(iv)
  };
}
```

### API Key Security
- Never commit API keys to public repositories
- Use environment variables for sensitive data
- Consider using Firebase App Check for additional security

## 🧪 Step 8: Testing the Setup

1. Load the extension with updated configuration
2. Open popup and check Cloud Sync widget
3. Try manual sync to test connection
4. Check Firestore console for data uploads

## 📊 Step 9: Firestore Data Structure

The extension will create this structure:

```
/users/{userId}
  - timestamp: number
  - version: string
  - data: {
    words: Array<Word>
    analytics: Object
    gamification: Object
  }
  - compressed: boolean
  - encrypted: boolean
  - checksum: string
```

## 🔄 Step 10: Backup Strategy

### Multiple Backup Versions
Enable versioned backups in Firestore rules:

```javascript
match /users/{userId}/backups/{backupId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### Automatic Cleanup
Set up Cloud Functions to clean old backups:

```javascript
exports.cleanupOldBackups = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
    // Delete backups older than 30 days
  });
```

## 🚨 Common Issues & Solutions

### 1. CORS Errors
- Ensure your domain is added to Firebase authorized domains
- Check browser console for specific CORS messages

### 2. Permission Denied
- Verify Firestore security rules
- Ensure user is properly authenticated

### 3. Quota Exceeded
- Monitor Firebase usage in console
- Implement data compression and deduplication

### 4. Network Failures
- Extension includes automatic retry with exponential backoff
- Check network connectivity and Firebase status

## 📈 Production Optimization

### 1. Data Compression
```javascript
// Use LZ-string for better compression
import LZString from 'lz-string';

const compressed = LZString.compress(JSON.stringify(data));
```

### 2. Batch Operations
```javascript
// Use Firestore batch writes for better performance
const batch = db.batch();
batch.set(userRef, userData);
batch.set(backupRef, backupData);
await batch.commit();
```

### 3. Offline Support
```javascript
// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a a time.
    } else if (err.code == 'unimplemented') {
      // Browser doesn't support persistence
    }
  });
```

## 🎯 Next Steps

1. **Setup Firebase project** following this guide
2. **Update configuration** in the extension code
3. **Test sync functionality** with your Firebase instance
4. **Configure security rules** for production
5. **Monitor usage and performance** in Firebase console

## 📞 Support

For issues with Firebase setup:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Support](https://firebase.google.com/support)

---

**Note**: The current implementation includes simulation code for development. Replace the simulated Firebase calls with actual Firebase SDK calls for production use.
