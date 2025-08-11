# Vocab SRS - Spaced Repetition Vocabulary Learning Extension

A Chrome Extension (Manifest V3) that helps you learn English vocabulary using spaced repetition. Simply highlight words on any webpage to add them to your personal dictionary, then review them using the scientifically-proven SM-2 algorithm.

## ✨ Features

- **Easy Word Addition**: Highlight any English word on any webpage and add it to your dictionary
- **Automatic Pronunciation**: Fetches phonetic transcription and audio from free dictionary API
- **Spaced Repetition**: Uses SM-2 algorithm for optimal review intervals
- **Context Menu & Floating Button**: Multiple ways to add words
- **Offline Review**: Review saved words even without internet
- **Data Export/Import**: Backup and restore your vocabulary
- **Privacy First**: No user tracking, data stays local

## 🚀 How to Install

### Method 1: Load as Unpacked Extension (Development)

1. **Download the Extension**:

   - Download all files to a folder (e.g., `vocab-srs-extension/`)
   - Or clone this repository

2. **Create Icon Files** (Required):

   ```bash
   # You need to create actual PNG icon files:
   # assets/icon48.png (48x48 pixels)
   # assets/icon128.png (128x128 pixels)
   # Use any icon generator or design tool
   ```

3. **Open Chrome Extensions**:

   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)

4. **Load Extension**:
   - Click "Load unpacked"
   - Select the `vocab-srs-extension` folder
   - Extension should appear in your toolbar

### Method 2: Package as ZIP (Distribution)

1. Create icon files in `assets/` folder
2. ZIP the entire extension folder
3. Share the ZIP file with others to install via "Load unpacked"

## 📖 How to Use

### Adding Words

1. **Text Selection Method**:

   - Highlight any single English word on any webpage
   - Click the floating "Add to Dictionary" button that appears
   - Or right-click and select "Add '[word]' to My Dictionary"

2. **Add Word Modal**:
   - Enter Vietnamese meaning (required)
   - Add example sentence (optional)
   - Click "Fetch Pronunciation" to get phonetic and audio
   - Click "Save Word" to add to your dictionary

### Reviewing Words

1. **Open Extension Popup**:

   - Click the extension icon in Chrome toolbar
   - See statistics: Total words and words due for review

2. **Start Review Session**:

   - Click "Start Review" if you have due words
   - Opens a full-screen review window for better focus
   - See Vietnamese meaning first (reverse learning mode)
   - Click "Hint" to see example sentence (if needed)
   - Type the English word and click "Check Answer"
   - Audio automatically plays after checking answer
   - Rate difficulty based on your performance:
     - **Auto-selected for you**:
       - **Skip**: Automatically selects "Blackout (0)"
       - **Wrong Answer**: Automatically selects "Incorrect (1)"
       - **Used Hint + Correct**: Automatically selects "Hard (2)"
     - **Choose yourself (Correct without hint)**:
       - 3: Correct (right answer with some effort)
       - 4: Easy (correct with ease)
       - 5: Perfect (immediate recall)

3. **Algorithm Automatically**:
   - Schedules next review based on your rating
   - Easy words appear less frequently
   - Difficult words appear more often
   - Failed words (0-2 rating) reset and appear tomorrow

### Managing Data

1. **View All Words**: See all saved words with search functionality
2. **Export Data**: Backup your vocabulary as JSON file
3. **Import Data**: Restore from previously exported file
4. **Options Page**: Configure settings and manage data

## 🧪 Testing

### Test the SRS Algorithm

Run the included test script to verify SM-2 algorithm:

```bash
node srs_test.js
```

This will run various test cases and show how the spaced repetition intervals work.

### Manual Testing Checklist

1. **Word Addition**:

   - [ ] Highlight single word → floating button appears
   - [ ] Highlight multiple words → no button (should show error)
   - [ ] Right-click word → context menu appears
   - [ ] Modal opens with word pre-filled
   - [ ] Fetch pronunciation works for common words
   - [ ] Can save word with meaning only
   - [ ] Duplicate words are rejected

2. **Review System**:

   - [ ] Popup shows correct word count
   - [ ] Due words count updates correctly
   - [ ] Review session shows cards properly
   - [ ] Audio playback works (if available)
   - [ ] Quality ratings (0-5) update next review date
   - [ ] Review completion shows statistics

3. **Data Management**:
   - [ ] Export creates valid JSON file
   - [ ] Import restores words correctly
   - [ ] Search in word list works
   - [ ] Delete word removes from storage
   - [ ] Clear all data removes everything

## 🔧 Technical Details

### Architecture

- **Manifest V3**: Uses service workers instead of background pages
- **Storage**: Chrome storage API with sync/local fallback
- **API**: dictionaryapi.dev for pronunciation (no API key needed)
- **Algorithm**: SM-2 spaced repetition system
- **UI**: Vanilla JavaScript, no external dependencies

### File Structure

```
vocab-srs-extension/
├── manifest.json                 # Extension manifest
├── src/
│   ├── serviceWorker.js         # Background script
│   ├── contentScript.js         # Content script for web pages
│   ├── utils.js                 # Utility functions and storage
│   ├── api.js                   # Dictionary API integration
│   ├── ui/
│   │   ├── addModal.js          # Word addition modal
│   │   ├── addModal.css         # Modal styles
│   │   ├── popup.html           # Extension popup
│   │   ├── popup.js             # Popup functionality
│   │   └── popup.css            # Popup styles
│   ├── options.html             # Options page
│   ├── options.js               # Options functionality
│   └── styles.css               # Global styles
├── assets/
│   ├── icon48.png               # Extension icon (48x48)
│   └── icon128.png              # Extension icon (128x128)
├── srs_test.js                  # Algorithm test script
└── README.md                    # This file
```

### Data Model

Each vocabulary word is stored as:

```javascript
{
  id: "uuid-v4",
  word: "example",
  meaning: "ví dụ",
  example: "This is an example sentence.",
  phonetic: "/ɪɡˈzæmpəl/",
  audioUrl: "https://...mp3",
  createdAt: "2025-08-11T12:00:00Z",
  srs: {
    easiness: 2.5,        // SM-2 easiness factor
    interval: 0,          // Days until next review
    repetitions: 0,       // Successful reviews count
    nextReview: "2025-08-11T12:00:00Z"
  }
}
```

### SM-2 Algorithm

- **Quality 0-2**: Failed review → reset to 1 day interval
- **Quality 3-5**: Successful review → increase interval
- **First success**: 1 day interval
- **Second success**: 6 days interval
- **Subsequent successes**: Previous interval × Easiness Factor
- **Easiness Factor**: Adjusted based on quality (1.3 minimum)

## 🛡️ Privacy & Security

- **No tracking**: Extension doesn't collect user analytics
- **Local storage**: All data stored in browser, not on servers
- **Minimal permissions**: Only requests necessary browser permissions
- **API calls**: Only sends selected word to dictionary API
- **No authentication**: No user accounts or personal info required

## 🔧 Development

### Prerequisites

- Google Chrome
- Basic knowledge of Chrome Extensions
- Node.js (for running tests)

### Setup

1. Clone repository
2. Create icon files in `assets/` folder
3. Load as unpacked extension in Chrome
4. Test functionality on various websites

### Contributing

1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit pull request

## 📝 License

MIT License - Feel free to use, modify, and distribute.

## 🆘 Troubleshooting

### Common Issues

1. **Icons not showing**: Create actual PNG files in `assets/` folder
2. **Words not saving**: Check browser storage permissions
3. **Audio not playing**: Verify internet connection and audio permissions
4. **Context menu not appearing**: Check extension permissions in Chrome settings
5. **Import/Export failing**: Ensure JSON file format is correct

### Debug Mode

1. Go to `chrome://extensions/`
2. Click "Details" on Vocab SRS extension
3. Click "Inspect views: popup" to debug popup
4. Check browser console for error messages

## 🚀 Future Enhancements

- [ ] Multiple languages support
- [ ] Custom review schedules
- [ ] Word categories/tags
- [ ] Progress statistics and charts
- [ ] Shared vocabulary lists
- [ ] Mobile app version
- [ ] Advanced pronunciation features

## 📞 Support

If you encounter issues:

1. Check this README for solutions
2. Run `node srs_test.js` to verify algorithm
3. Check Chrome DevTools console for errors
4. Verify all files are present and permissions granted

---

**Happy vocabulary learning! 📚✨**
