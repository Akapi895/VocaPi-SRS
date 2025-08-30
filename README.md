# VocaPi - Vocabulary SRS Extension

A Chrome extension for learning vocabulary using Spaced Repetition System (SRS) with persistent data storage using IndexedDB.

## Features

- **Persistent Data Storage**: Uses IndexedDB to store vocabulary data locally, ensuring data persists across browser sessions
- **Spaced Repetition**: Implements SRS algorithm for optimal learning intervals
- **Context Menu Integration**: Right-click on selected text to add words to dictionary
- **Floating Button**: Appears when text is selected for quick word addition
- **Import/Export**: Backup and restore vocabulary data
- **Analytics Dashboard**: Track learning progress and statistics
- **Gamification**: Level system, XP, and study streaks

## Technical Details

### Storage System

- **IndexedDB**: Primary storage for vocabulary words, gamification data, and analytics
- **Automatic Migration**: Automatically migrates existing Chrome Storage data to IndexedDB
- **Persistent**: Data remains even after browser restart (unless manually cleared)

### Architecture

- **Traditional JavaScript**: No ES modules, compatible with all browsers
- **Service Worker**: Background processing and message handling
- **Content Scripts**: Page integration and word selection
- **Popup Interface**: Main extension interface

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your toolbar

## Usage

### Adding Words

1. Select text on any webpage
2. Click the floating "+ Add to Dictionary" button
3. Fill in the meaning and optional example
4. Click "Save to Dictionary"

### Managing Vocabulary

- Click the extension icon to open the popup
- View all words, start reviews, and access analytics
- Use the context menu (right-click on selected text)

### Data Migration

- The extension automatically migrates existing Chrome Storage data to IndexedDB
- No manual intervention required
- Migration status is tracked and stored

## File Structure

```
src/
├── core/
│   ├── indexeddb.js      # IndexedDB manager
│   ├── storage.js        # Storage operations
│   ├── utils.js          # Utility functions
│   ├── migration.js      # Data migration
│   └── serviceWorker.js  # Background service worker
├── content/
│   └── index.js         # Content script
├── ui/
│   ├── html/            # HTML files
│   ├── css/             # Stylesheets
│   └── js/              # JavaScript files
└── features/            # Feature modules
```

## Data Persistence

### IndexedDB Schema

- **vocabWords**: Vocabulary entries with SRS data
- **gamification**: User progress and achievements
- **analytics**: Learning statistics and metrics
- **settings**: Extension configuration

### Migration Process

1. Extension checks for existing Chrome Storage data
2. Automatically migrates to IndexedDB
3. Preserves all existing vocabulary and settings
4. Marks migration as completed

## Browser Compatibility

- **Chrome**: Full support (primary target)
- **Edge**: Full support (Chromium-based)
- **Firefox**: Limited support (may require adjustments)
- **Safari**: Limited support (may require adjustments)

## Development

### Local Development

1. Make changes to source files
2. Reload extension in Chrome
3. Test functionality
4. Check console for any errors

### Debugging

- Use Chrome DevTools for extension debugging
- Check service worker logs in `chrome://extensions/`
- Monitor IndexedDB in Application tab

## Troubleshooting

### Common Issues

- **Data not persisting**: Check IndexedDB permissions
- **Migration failures**: Clear extension data and reinstall
- **Script loading errors**: Verify file paths in manifest.json

### Reset Extension

1. Go to `chrome://extensions/`
2. Find VocaPi extension
3. Click "Remove"
4. Reinstall extension

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

**Note**: This extension uses IndexedDB for persistent storage, ensuring your vocabulary data remains safe across browser sessions and updates.
