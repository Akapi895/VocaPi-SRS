# VocaPi - Vocabulary SRS Extension

A comprehensive Chrome extension for learning vocabulary using Spaced Repetition System (SRS) with advanced analytics, gamification, customizable study experience, and persistent data storage.

## Features

### Core Learning

- **Spaced Repetition System (SRS)**: Advanced customizable algorithm for optimal learning intervals
- **Word Management**: Add, edit, and organize vocabulary with meanings, examples, and phonetic data
- **Interactive Review System**: Comprehensive review sessions with quality tracking and retry mechanism
- **Smart Audio Integration**: Pronunciation playback with customizable speech settings
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

### Customization & Personalization

- **Study Customization Hub**: Comprehensive 6-tab settings interface
- **SRS Algorithm Tuning**: Fine-tune ease factor, intervals, and difficulty parameters
- **Theme Studio**: Customize colors, fonts, and visual appearance with real-time preview
- **Accessibility Options**: Font scaling, high contrast mode, reduced motion settings
- **Audio Settings**: Voice selection, speech rate, volume, and sound effects control
- **Study Preferences**: Session length, break reminders, progress display, hint availability

### Data Management

- **Import/Export**: Backup and restore vocabulary data with complete settings
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

- **Modern React + TypeScript**: Built with React 18, TypeScript, and Vite for optimal performance
- **Modular Hook System**: Custom hooks for settings management and real-time synchronization
- **Service Worker**: Background processing and data management
- **Content Scripts**: Page integration and word selection
- **Popup Interface**: Main extension interface with analytics dashboard
- **Study Customization Hub**: Advanced 6-tab settings interface with real-time preview
- **Analytics Engine**: Real-time learning progress tracking
- **Tailwind CSS**: Modern responsive design with dark mode support

## Installation

### Development Setup

1. **Clone and Setup**:

   ```bash
   git clone https://github.com/yourusername/vocab-srs-extension.git
   cd vocab-srs-extension
   npm install
   ```

2. **Build Extension**:

   ```bash
   npm run dev     # Watch mode for development
   npm run build   # Production build
   ```

3. **Load in Browser**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Initial Configuration

4. **Extension Setup**:
   - Click the extension icon in your toolbar
   - Access Options page for Study Customization Hub
   - Configure audio, display, and study behavior settings
   - Customize review intervals and quality parameters

## Usage

### Adding Words

1. **Context Menu**: Right-click on selected text → "Add to Dictionary"
2. **Floating Button**: Select text → Click the "+" button that appears
3. **Manual Entry**: Open extension popup → Click "Add Word"
4. **Fill Details**: Add meaning, example, phonetic, and audio URL
5. **Save**: Click "Save to Dictionary"

### Learning & Review

- **Start Review**: Click "Start Review" in the popup to begin spaced repetition learning
- **Interactive Learning**: Multi-step review process with input validation and anti-cheat measures
- **Smart Quality Rating**: Intelligent auto-rating based on performance with manual override option
- **Adaptive Retry System**: Configurable retry mechanism for difficult words with audio feedback
- **Enhanced Audio Experience**:
  - Automatic pronunciation playback (configurable)
  - Customizable voice selection, speech rate, and volume
  - Audio feedback with beep sounds for correct/incorrect answers
- **Progress Tracking**: Real-time progress indicators with customizable display options
- **Hint System**: Optional hints to aid learning (can be enabled/disabled)
- **Quality-Based Scheduling**: Dynamic interval adjustment based on recall quality (1-5 scale)
- **Smart Hints**: Context-aware hints with example sentences (can be disabled)
- **SRS Algorithm**: Words are scheduled based on your performance with customizable parameters
- **Review Sessions**: Complete daily reviews to maintain streaks

### Analytics Dashboard

- **Overview Stats**: Total words, current streak, time spent, accuracy
- **Weekly Progress**: Visual charts of your learning activity
- **Learning Patterns**: Best study time, most active day, session length
- **Difficult Words**: Words that need more practice
- **Quality Distribution**: How well you're mastering words

### Study Customization

- **SRS Algorithm Settings**: Adjust ease factor, intervals, difficulty penalties
- **Theme Customization**: Real-time color and font customization with instant preview
- **Accessibility**: Font scaling, high contrast, reduced motion, keyboard navigation
- **Audio Preferences**: Voice selection, speech rate (0.5x-2.0x), volume control
- **Study Session Settings**: Session length, break reminders, progress display
- **Individual Tab Reset**: Reset specific setting categories to defaults

### Data Management

- **Import Data**: Upload backup files to restore vocabulary with settings
- **Export Data**: Download your data including all customization settings
- **Study Customization Hub**: Advanced 6-tab interface for all settings
- **Real-time Sync**: Settings changes apply immediately across all components
- **Reset Options**: Individual tab reset or complete settings reset

## File Structure

```
src/
├── main.css                # Global Tailwind CSS styles
├── analytics/              # Analytics dashboard
│   ├── Analytics.tsx       # Main analytics component
│   ├── main.tsx           # Analytics entry point
│   └── utils.ts           # Analytics utilities
├── content/
│   └── index.ts           # Content script with word selection
├── hooks/                 # Custom React hooks
│   ├── useChromeStorage.ts     # Chrome storage management
│   ├── useChromeMessages.ts    # Chrome messaging
│   └── useCustomizationSettings.ts # Settings management hook
├── options/               # Study Customization Hub
│   ├── Options.tsx        # 6-tab settings interface
│   └── main.tsx          # Options entry point
├── popup/                 # Main extension interface
│   ├── Popup.tsx         # Popup with analytics dashboard
│   └── main.tsx          # Popup entry point
├── review/                # Advanced review system
│   ├── Review.tsx        # Interactive review component
│   ├── srs-algorithm.ts  # Customizable SRS algorithm
│   ├── utils.ts          # Review utilities
│   └── main.tsx          # Review entry point
├── service-worker/        # Background processing
│   └── index.ts          # Service worker
├── types/                 # TypeScript definitions
│   └── index.ts          # Global types
├── utils/                 # Utilities
│   └── theme.ts          # Theme management
├── gamification/          # Gamification system
│   ├── achievements/     # Achievement system
│   ├── levels/          # Level progression
│   └── rankings/        # User rankings
└── assets/               # Static assets
    └── icons/           # Extension icons
```

## Data Persistence

### Storage Schema

- **vocabWords**: Vocabulary entries with SRS data and metadata
- **gamification**: User progress, achievements, and XP system
- **analytics**: Learning statistics, streaks, and performance metrics
- **customizationSettings**: Complete user preferences including:
  - **srs**: Algorithm parameters (ease factor, intervals, penalties)
  - **theme**: Colors, fonts, dark mode, animations
  - **study**: Session length, hints, progress, retry settings
  - **accessibility**: Font scaling, high contrast, motion preferences
  - **audio**: Voice selection, speech rate, volume, sound effects
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
- **Permissions**: Active tab, storage, context menus, and audio (for speech synthesis)
- **Modern Browser Features**: Web Audio API for sound effects, Speech Synthesis API for pronunciation

## Development

### Local Development

1. **Development Workflow**:
   ```bash
   npm run dev    # Start development build with watch mode
   ```
2. **Extension Testing**:
   - Make changes to source files in `src/`
   - Reload extension in `chrome://extensions/`
   - Test functionality across all components (Popup, Options, Review)
   - Verify settings synchronization between tabs
3. **Quality Assurance**:
   - Test audio functionality and settings integration
   - Verify SRS algorithm behavior with different quality ratings
   - Check Study Customization Hub responsiveness
   - Validate import/export functionality

### Debugging

- **Chrome DevTools**: Use for React component debugging and console logs
- **Service Worker Logs**: Check in `chrome://extensions/` for background task debugging
- **Storage Inspection**: Monitor Chrome Storage in Application tab
- **Settings Debug**: Use Options page to verify real-time settings synchronization
- **Audio Debug**: Check Web Audio API and Speech Synthesis API in console
- **Performance**: Monitor component re-renders and settings update frequency

## Troubleshooting

### Common Issues

- **Data not persisting**: Check Chrome Storage permissions
- **Import/Export failures**: Verify file format and permissions
- **Analytics not updating**: Refresh the extension or restart browser
- **Review not working**: Check if words are properly loaded and settings are synchronized
- **Streak calculation errors**: Ensure daily stats are being recorded
- **Audio not playing**: Verify audio permissions and Speech Synthesis API availability
- **Settings not applying**: Check if real-time sync is working between Options and Review pages
- **Study Customization Hub not loading**: Ensure all required permissions are granted

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
