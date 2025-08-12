# 📚 Vocab SRS - Advanced Spaced Repetition Vocabulary Extension

> Transform any webpage into your personal English vocabulary learning lab with enterprise-grade features!

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-brightgreen.svg)](https://chrome.google.com/webstore/)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Akapi895/vocab-srs)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ Features

### 🎯 **Smart Learning System**

- **Advanced SRS Algorithm**: Enhanced SM-2+ with adaptive learning curves
- **Audio Integration**: TTS + Dictionary pronunciation with auto-play
- **Quality Ratings**: 6-level difficulty assessment (0-5)
- **Progress Tracking**: Real-time statistics and learning insights
- **🎮 Gamification**: XP system, achievements, daily challenges, and level progression
- **☁️ Cloud Sync**: Secure backup and multi-device synchronization

### 🚀 **Seamless Integration**

- **One-Click Addition**: Highlight any word → Right-click → Add to dictionary
- **Context Menu**: Quick access from any webpage
- **Omnibox Commands**: Type `vocab search term` in address bar
- **Review Sessions**: Dedicated fullscreen review window
- **📊 Analytics Dashboard**: Comprehensive learning insights and progress tracking

### 🎨 **Modern Interface**

- **Glassmorphism Design**: Beautiful gradient backgrounds with blur effects
- **Responsive Layout**: Works perfectly on any screen size
- **Accessibility First**: Keyboard navigation + screen reader support
- **Keyboard Shortcuts**: Full navigation without mouse (Alt+V, Alt+R, etc.)

### ⚡ **Performance Optimized**

- **Smart Caching**: LRU cache with TTL for instant lookups
- **Lazy Loading**: Efficient memory usage for large vocabularies
- **Background Sync**: Auto-backup with exponential backoff retry
- **Performance Dashboard**: Real-time metrics monitoring
- **Cloud Sync**: Automatic data backup and conflict resolution

---

## 🚀 Quick Start

### Installation

1. Download or clone this repository
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → Select folder `vocab-srs-extension`
5. Extension icon appears in toolbar!

### Basic Usage

1. **Add Words**: Highlight any English word → Right-click → "Add to Dictionary"
2. **Review**: Click extension icon → "Start Review"
3. **Rate Knowledge**: After each word, rate difficulty 0-5
4. **Track Progress**: View statistics in extension popup

---

## ⌨️ Keyboard Shortcuts

### Global Shortcuts

- **Alt + V**: Toggle extension popup
- **Alt + R**: Start review session
- **Alt + A**: Add selected text to dictionary
- **Alt + H**: Show keyboard shortcuts help

### Review Shortcuts

- **Enter**: Submit answer
- **Space**: Play audio pronunciation
- **H**: Show hint (audio only)
- **S**: Skip current word
- **0-5**: Select quality rating (0=Blackout, 5=Perfect)
- **Escape**: Close modal/return to main

---

## 🎛️ Advanced Features

### **SRS Algorithm Options**

```javascript
// Basic SM-2 Algorithm (stable)
useAdvanced: false;

// Enhanced SM-2+ with adaptive learning (recommended)
useAdvanced: true;
```

### **Performance Optimization**

- **Cache Settings**: Configurable TTL and size limits
- **Memory Management**: Automatic cleanup routines
- **Background Sync**: Smart retry logic with exponential backoff

### **Integration Capabilities**

- **Export Formats**: JSON, CSV, Anki, Notion
- **Website Integration**: Netflix, YouTube (coming soon)
- **Cloud Sync**: Framework ready for implementation

---

## 🗺️ Development Status

This project has been actively developed with the following features **completed**:

- ✅ **Advanced SRS Algorithm** - SM-2+ implementation with adaptive learning
- ✅ **Gamification System** - XP, achievements, daily challenges, levels
- ✅ **Analytics Dashboard** - Comprehensive learning insights and progress tracking
- ✅ **Performance Optimization** - Smart caching, lazy loading, memory management
- ✅ **Modern UI/UX** - Glassmorphism design with responsive layout
- ✅ **Audio Integration** - TTS and pronunciation with fallback systems
- ✅ **Context Menu Integration** - Right-click to add words from any webpage
- ✅ **Cloud Sync & Backup** - Firebase-based data synchronization with encryption

**Future roadmap** (planned features):

- 🤖 **AI Integration** - GPT-powered personalized learning suggestions
- 📱 **Mobile PWA** - Progressive web app for mobile devices
- 🔗 **Platform Integrations** - Netflix, YouTube, and social media platforms

---

## ☁️ Cloud Sync Setup

To enable cloud synchronization, you'll need to set up Firebase:

1. **Follow the setup guide**: See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed instructions
2. **Update configuration**: Replace Firebase config in `src/cloud-sync.js`
3. **Enable auto-sync**: Use the Cloud Sync widget in the extension popup

### Cloud Sync Features:

- **Automatic Backup**: Your vocabulary is safely stored in the cloud
- **Multi-device Sync**: Access your words from any device
- **Conflict Resolution**: Smart merging when data conflicts occur
- **Encryption**: All data is encrypted before upload
- **Offline Support**: Works offline, syncs when connection returns

---
