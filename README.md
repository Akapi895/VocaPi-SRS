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

### 🚀 **Seamless Integration**

- **One-Click Addition**: Highlight any word → Right-click → Add to dictionary
- **Context Menu**: Quick access từ any webpage
- **Omnibox Commands**: Type `vocab search term` in address bar
- **Review Sessions**: Dedicated fullscreen review window

### 🎨 **Modern Interface**

- **Glassmorphism Design**: Beautiful gradient backgrounds with blur effects
- **Responsive Layout**: Works perfectly on any screen size
- **Accessibility First**: Keyboard navigation + screen reader support
- **Keyboard Shortcuts**: Full navigation without mouse (Alt+V, Alt+R, etc.)

### ⚡ **Performance Optimized**

- **Smart Caching**: LRU cache với TTL for instant lookups
- **Lazy Loading**: Efficient memory usage for large vocabularies
- **Background Sync**: Auto-backup với exponential backoff
- **Performance Dashboard**: Real-time metrics monitoring

---

## 🚀 Quick Start

### Installation

1. Download hoặc clone repository này
2. Mở Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → Select folder `vocab-srs-extension`
5. Extension icon xuất hiện trong toolbar!

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

- **Cache Settings**: Configurable TTL và size limits
- **Memory Management**: Automatic cleanup routines
- **Background Sync**: Smart retry logic với exponential backoff

### **Integration Capabilities**

- **Export Formats**: JSON, CSV, Anki, Notion
- **Website Integration**: Netflix, YouTube (coming soon)
- **Cloud Sync**: Framework ready for implementation

---

**Made with ❤️ for language learners worldwide**

## 🗺️ Development Roadmap

This project is actively developed with exciting features planned! Check out our [detailed roadmap](ROADMAP.md) for upcoming features:

- 📊 **Analytics Dashboard** - Learning insights and progress tracking
- 🌐 **Cloud Sync** - Multi-device synchronization via Google Drive
- 🎮 **Gamification** - XP system, achievements, and challenges
- 🤖 **AI Integration** - GPT-powered personalized learning
- 📱 **Mobile PWA** - Responsive mobile experience
- 🔗 **Platform Integrations** - Netflix, YouTube, and more

[⭐ Star this repo](https://github.com/Akapi895/vocab-srs) | [🍴 Fork](https://github.com/Akapi895/vocab-srs/fork) | [📥 Download](https://github.com/Akapi895/vocab-srs/archive/main.zip) | [🗺️ View Roadmap](ROADMAP.md)
