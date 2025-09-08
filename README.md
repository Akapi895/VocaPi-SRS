# VocaPi - Vocabulary SRS Extension

A comprehensive Chrome extension for learning vocabulary using Spaced Repetition System (SRS) with advanced analytics, gamification, and persistent data storage.

## Features

### Core Learning

- **Spaced Repetition System (SRS)**: Advanced algorithm for optimal learning intervals
- **Word Management**: Add, edit, and organize vocabulary with meanings, examples, and phonetic data
- **Review System**: Interactive review sessions with quality tracking
- **Context Menu Integration**: Right-click on selected text to add words instantly
- **Floating Button**: Quick word addition when text is selected

### Analytics & Insights

- **Learning Analytics**: Comprehensive dashboard with progress tracking
- **Streak System**: Daily study streaks with smart calculation
- **Performance Metrics**: Accuracy, time spent, and learning patterns
- **Weekly Progress**: Visual charts showing learning activity
- **Difficult Words**: Identify words that need more practice
- **Best Study Time**: Discover your most productive learning hours

### Gamification

- **XP System**: Earn experience points for learning activities
- **Achievements**: Unlock badges for various milestones
- **Level Progression**: Level up based on your learning progress
- **Daily Challenges**: Motivating daily learning goals

### Data Management

- **Import/Export**: Backup and restore vocabulary data
- **Data Migration**: Automatic migration from old storage systems
- **Cross-Device Sync**: Synchronize data across devices
- **Persistent Storage**: Data remains safe across browser sessions

## Technical Details

### Storage System

- **Chrome Storage API**: Primary storage for vocabulary words, gamification data, and analytics
- **Automatic Migration**: Seamlessly migrates data between storage systems
- **Persistent**: Data remains safe across browser sessions and updates
- **Cross-Platform**: Compatible with Chrome, Edge, and other Chromium-based browsers

### Architecture

- **Modular Design**: Organized feature-based architecture
- **Service Worker**: Background processing and data management
- **Content Scripts**: Page integration and word selection
- **Popup Interface**: Main extension interface with analytics dashboard
- **Options Page**: Advanced settings and data management
- **Analytics Engine**: Real-time learning progress tracking

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your toolbar

## Usage

### Adding Words

1. **Context Menu**: Right-click on selected text → "Add to Dictionary"
2. **Floating Button**: Select text → Click the "+" button that appears
3. **Manual Entry**: Open extension popup → Click "Add Word"
4. **Fill Details**: Add meaning, example, phonetic, and audio URL
5. **Save**: Click "Save to Dictionary"

### Learning & Review

- **Start Review**: Click "Start Review" in the popup
- **Quality Rating**: Rate your performance (1-5) after each word
- **SRS Algorithm**: Words are scheduled based on your performance
- **Review Sessions**: Complete daily reviews to maintain streaks

### Analytics Dashboard

- **Overview Stats**: Total words, current streak, time spent, accuracy
- **Weekly Progress**: Visual charts of your learning activity
- **Learning Patterns**: Best study time, most active day, session length
- **Difficult Words**: Words that need more practice
- **Quality Distribution**: How well you're mastering words

### Data Management

- **Import Data**: Upload backup files to restore vocabulary
- **Export Data**: Download your data for backup
- **Options Page**: Access advanced settings and data management
- **Reset Data**: Clear all data if needed

## File Structure

```
src/
├── core/                    # Core functionality
│   ├── api.js              # API communication
│   ├── contentScript.js    # Content script integration
│   ├── date.js             # Date utilities
│   ├── env-config.js       # Environment configuration
│   ├── id.js               # ID generation
│   ├── logger.js           # Logging system
│   ├── migration.js        # Data migration
│   ├── serviceWorker.js    # Background service worker
│   ├── storage.js          # Storage operations
│   ├── text.js             # Text processing
│   └── utils.js            # Utility functions
├── content/
│   └── index.js            # Content script
├── features/               # Feature modules
│   ├── analytics/          # Analytics system
│   │   ├── core/          # Analytics core
│   │   └── dashboard/     # Dashboard components
│   ├── gamification/      # Gamification system
│   ├── review/            # Review system
│   └── srs/               # Spaced Repetition System
├── managers/              # Manager modules
│   ├── accessibility-manager.js
│   ├── i18n-manager.js
│   ├── keyboard-shortcuts.js
│   └── theme-manager.js
└── ui/                    # User interface
    ├── css/               # Stylesheets
    ├── html/              # HTML files
    └── js/                # JavaScript files
```

## Data Persistence

### Storage Schema

- **vocabWords**: Vocabulary entries with SRS data and metadata
- **gamification**: User progress, achievements, and XP system
- **analytics**: Learning statistics, streaks, and performance metrics
- **settings**: Extension configuration and preferences
- **dailyStats**: Daily learning activity and progress tracking

### Data Management

- **Automatic Backup**: Data is automatically saved after each action
- **Import/Export**: Full data backup and restore functionality
- **Migration Support**: Seamless data migration between versions
- **Cross-Device Sync**: Synchronize data across multiple devices

## Browser Compatibility

- **Chrome**: Full support (primary target)
- **Edge**: Full support (Chromium-based)
- **Firefox**: Limited support (may require manifest adjustments)
- **Safari**: Limited support (may require manifest adjustments)

### Requirements

- **Chrome**: Version 88+ (Manifest V3 support)
- **Edge**: Version 88+ (Chromium-based)
- **Storage**: Chrome Storage API support
- **Permissions**: Active tab, storage, and context menus

## Development

### Local Development

1. Make changes to source files
2. Reload extension in Chrome
3. Test functionality
4. Check console for any errors

### Debugging

- Use Chrome DevTools for extension debugging
- Check service worker logs in `chrome://extensions/`

## Troubleshooting

### Common Issues

- **Data not persisting**: Check Chrome Storage permissions
- **Import/Export failures**: Verify file format and permissions
- **Analytics not updating**: Refresh the extension or restart browser
- **Review not working**: Check if words are properly loaded
- **Streak calculation errors**: Ensure daily stats are being recorded

### Reset Extension

1. Go to `chrome://extensions/`
2. Find VocaPi extension
3. Click "Remove"
4. Reinstall extension
5. Import your backup data if available

### Debug Mode

- Open Chrome DevTools (F12)
- Go to Console tab
- Check for any error messages
- Use `chrome.storage.local.get()` to inspect data

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:

- Check the troubleshooting section
- Review console logs for errors
- Create an issue on GitHub

---

## Key Features Summary

- 🎯 **Smart Learning**: Advanced SRS algorithm for optimal retention
- 📊 **Analytics Dashboard**: Comprehensive learning insights and progress tracking
- 🎮 **Gamification**: XP system, achievements, and daily challenges
- 📱 **Easy Integration**: Context menu and floating button for quick word addition
- 💾 **Data Safety**: Persistent storage with import/export functionality
- 🔄 **Cross-Device Sync**: Access your vocabulary anywhere

**Note**: This extension uses Chrome Storage API for persistent storage, ensuring your vocabulary data remains safe across browser sessions and updates.
