// Integration Features Module
class IntegrationManager {
  constructor() {
    this.integrations = new Map();
    this.contextMenuId = null;
    this.omniboxKeyword = 'vocab';
    this.supportedSites = [
      'netflix.com',
      'youtube.com',
      'reddit.com',
      'medium.com',
      'wikipedia.org'
    ];
    
    this.initializeIntegrations();
  }

  async initializeIntegrations() {
    await this.setupContextMenu();
    await this.setupOmnibox();
    await this.setupWebsiteIntegrations();
    await this.setupExportIntegrations();
  }

  /**
   * Context Menu Integration
   */
  async setupContextMenu() {
    if (!chrome.contextMenus) return;

    try {
      // Remove existing context menu first to avoid duplicates
      if (this.contextMenuId) {
        try {
          chrome.contextMenus.remove(this.contextMenuId);
        } catch (error) {
          console.log('Context menu removal failed (expected if not exists):', error);
        }
      }

      // Clear all context menus to prevent duplicates
      chrome.contextMenus.removeAll(() => {
        // Create new context menu for selected text
        this.contextMenuId = chrome.contextMenus.create({
          id: 'vocab-add-word',
          title: 'Add "%s" to Vocabulary',
          contexts: ['selection'],
          documentUrlPatterns: ['http://*/*', 'https://*/*']
        });

        console.log('Context menu created with ID:', this.contextMenuId);
      });

      // Handle context menu clicks (only set up once)
      if (!this.contextMenuListener) {
        this.contextMenuListener = async (info, tab) => {
          if (info.menuItemId === 'vocab-add-word') {
            const selectedText = info.selectionText.trim();
            await this.addWordFromContext(selectedText, tab.url);
          }
        };
        
        chrome.contextMenus.onClicked.addListener(this.contextMenuListener);
      }
      
    } catch (error) {
      console.error('Error setting up context menu:', error);
    }
  }

  async addWordFromContext(word, sourceUrl) {
    try {
      // Clean and validate the word
      const cleanWord = this.cleanSelectedText(word);
      if (!cleanWord) return;

      // Get definition and context
      const wordData = await window.VocabAPI.WordLookup.lookupWord(cleanWord);
      
      // Add source context
      wordData.source = {
        url: sourceUrl,
        domain: new URL(sourceUrl).hostname,
        addedAt: Date.now(),
        context: 'context_menu'
      };

      // Save the word
      await window.VocabUtils.VocabStorage.addWord(wordData);

      // Show notification
      this.showNotification('Word Added', `"${cleanWord}" has been added to your vocabulary!`);

    } catch (error) {
      console.error('Error adding word from context:', error);
      this.showNotification('Error', 'Failed to add word to vocabulary');
    }
  }

  cleanSelectedText(text) {
    // Enhanced cleaning for both words and phrases
    const cleaned = text.replace(/[^\w\s''\-,.\(\)!?]/g, '').trim();
    
    // Validate reasonable length and word count
    const words = cleaned.split(/\s+/);
    if (words.length > 10) return null; // Max 10 words for phrases
    if (cleaned.length > 200) return null; // Max 200 characters
    
    // Normalize whitespace
    return words.join(' ').toLowerCase();
  }

  /**
   * Omnibox Integration
   */
  async setupOmnibox() {
    if (!chrome.omnibox) return;

    chrome.omnibox.setDefaultSuggestion({
      description: 'Search vocabulary or add new words - try "define [word]" or "add [word]"'
    });

    chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
      const suggestions = await this.generateOmniboxSuggestions(text);
      suggest(suggestions);
    });

    chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
      await this.handleOmniboxCommand(text);
    });
  }

  async generateOmniboxSuggestions(text) {
    const suggestions = [];
    const trimmedText = text.trim().toLowerCase();

    if (trimmedText.length < 2) {
      return [{
        content: 'help',
        description: 'Commands: define [word], add [word], stats, review'
      }];
    }

    // Command suggestions
    if (trimmedText.startsWith('define ')) {
      const word = trimmedText.replace('define ', '');
      if (word) {
        suggestions.push({
          content: `define ${word}`,
          description: `Define "${word}"`
        });
      }
    } else if (trimmedText.startsWith('add ')) {
      const word = trimmedText.replace('add ', '');
      if (word) {
        suggestions.push({
          content: `add ${word}`,
          description: `Add "${word}" to vocabulary`
        });
      }
    } else {
      // Search existing vocabulary
      const existingWords = await window.VocabUtils.VocabStorage.searchWords(trimmedText);
      existingWords.slice(0, 5).forEach(word => {
        suggestions.push({
          content: `review ${word.word}`,
          description: `${word.word} - ${word.meaning}`
        });
      });

      // Add common commands
      ['define', 'add', 'stats', 'review'].forEach(cmd => {
        if (cmd.startsWith(trimmedText)) {
          suggestions.push({
            content: `${cmd} `,
            description: `${cmd.charAt(0).toUpperCase() + cmd.slice(1)} command`
          });
        }
      });
    }

    return suggestions;
  }

  async handleOmniboxCommand(text) {
    const [command, ...args] = text.trim().toLowerCase().split(' ');
    const word = args.join(' ');

    switch (command) {
      case 'define':
        if (word) {
          await this.defineWord(word);
        }
        break;
      case 'add':
        if (word) {
          await this.addWordViaOmnibox(word);
        }
        break;
      case 'stats':
        await this.showStats();
        break;
      case 'review':
        if (word) {
          await this.reviewSpecificWord(word);
        } else {
          await this.startReview();
        }
        break;
      default:
        await this.defineWord(text); // Default to definition
    }
  }

  /**
   * Website-Specific Integrations
   */
  async setupWebsiteIntegrations() {
    try {
      // Netflix subtitle capture
      this.integrations.set('netflix', new NetflixIntegration());
      
      // YouTube caption extraction
      this.integrations.set('youtube', new YouTubeIntegration());
      
      // Medium article vocabulary - only create if class exists
      if (typeof MediumIntegration !== 'undefined') {
        this.integrations.set('medium', new MediumIntegration());
      } else {
        console.warn('MediumIntegration class not found - skipping');
      }
      
      // Reddit post vocabulary - only create if class exists
      if (typeof RedditIntegration !== 'undefined') {
        this.integrations.set('reddit', new RedditIntegration());
      } else {
        console.warn('RedditIntegration class not found - skipping');
      }
      
      console.log('Website integrations initialized:', Array.from(this.integrations.keys()));
    } catch (error) {
      console.error('Error setting up website integrations:', error);
    }
  }

  /**
   * Export/Import Integrations
   */
  async setupExportIntegrations() {
    this.exportFormats = {
      anki: new AnkiExporter(),
      csv: new CSVExporter(),
      notion: new NotionExporter(),
      obsidian: new ObsidianExporter(),
      quizlet: new QuizletExporter()
    };
  }

  async exportToFormat(format, words, options = {}) {
    const exporter = this.exportFormats[format];
    if (!exporter) {
      throw new Error(`Unsupported export format: ${format}`);
    }

    return await exporter.export(words, options);
  }

  async importFromFormat(format, data, options = {}) {
    const exporter = this.exportFormats[format];
    if (!exporter || !exporter.import) {
      throw new Error(`Import not supported for format: ${format}`);
    }

    return await exporter.import(data, options);
  }

  /**
   * Cloud Sync Integration
   */
  async setupCloudSync(provider = 'google') {
    switch (provider) {
      case 'google':
        return new GoogleDriveSync();
      case 'dropbox':
        return new DropboxSync();
      case 'onedrive':
        return new OneDriveSync();
      default:
        throw new Error(`Unsupported cloud provider: ${provider}`);
    }
  }

  /**
   * Utility Methods
   */
  async defineWord(word) {
    try {
      const definition = await window.VocabAPI.WordLookup.lookupWord(word);
      this.showNotification(`Definition: ${word}`, definition.meaning);
    } catch (error) {
      this.showNotification('Error', `Could not find definition for "${word}"`);
    }
  }

  async addWordViaOmnibox(word) {
    try {
      await this.addWordFromContext(word, 'omnibox');
      this.showNotification('Success', `"${word}" added to vocabulary`);
    } catch (error) {
      this.showNotification('Error', `Failed to add "${word}"`);
    }
  }

  async showStats() {
    const stats = await window.VocabUtils.VocabStorage.getStats();
    this.showNotification('Vocabulary Stats', 
      `Total: ${stats.total} | Due: ${stats.due} | Accuracy: ${stats.accuracy}%`
    );
  }

  async startReview() {
    chrome.runtime.sendMessage({ action: 'openReviewWindow' });
  }

  showNotification(title, message) {
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title,
        message
      });
    }
  }
}

/**
 * Website-Specific Integration Classes
 */
class NetflixIntegration {
  constructor() {
    this.subtitleSelector = '.player-timedtext-text-container';
  }

  async extractSubtitles() {
    const subtitles = document.querySelectorAll(this.subtitleSelector);
    const words = [];
    
    subtitles.forEach(subtitle => {
      const text = subtitle.textContent;
      const extractedWords = this.extractWords(text);
      words.push(...extractedWords);
    });
    
    return words;
  }

  extractWords(text) {
    return text.match(/\b[a-zA-Z]{3,}\b/g) || [];
  }
}

class YouTubeIntegration {
  constructor() {
    this.captionSelector = '.ytp-caption-segment';
  }

  async extractCaptions() {
    // Similar to Netflix but for YouTube captions
    const captions = document.querySelectorAll(this.captionSelector);
    // Implementation details...
  }
}

class MediumIntegration {
  constructor() {
    this.articleSelector = '.pw-post-body-paragraph';
  }

  async extractArticleText() {
    const paragraphs = document.querySelectorAll(this.articleSelector);
    const words = [];
    
    paragraphs.forEach(p => {
      const text = p.textContent;
      const extractedWords = this.extractWords(text);
      words.push(...extractedWords);
    });
    
    return words;
  }

  extractWords(text) {
    return text.match(/\b[a-zA-Z]{3,}\b/g) || [];
  }
}

class RedditIntegration {
  constructor() {
    this.postSelector = '.usertext-body';
  }

  async extractPostContent() {
    const posts = document.querySelectorAll(this.postSelector);
    const words = [];
    
    posts.forEach(post => {
      const text = post.textContent;
      const extractedWords = this.extractWords(text);
      words.push(...extractedWords);
    });
    
    return words;
  }

  extractWords(text) {
    return text.match(/\b[a-zA-Z]{3,}\b/g) || [];
  }
}

/**
 * Export Format Classes
 */
class AnkiExporter {
  async export(words, options) {
    const ankiCards = words.map(word => ({
      front: word.meaning,
      back: `${word.word}${word.phonetic ? ` [${word.phonetic}]` : ''}${word.example ? `<br><br><i>${word.example}</i>` : ''}`,
      tags: [word.category || 'vocabulary', `difficulty:${word.difficulty || 'medium'}`]
    }));

    return {
      format: 'anki',
      data: ankiCards,
      filename: `vocabulary-${new Date().toISOString().split('T')[0]}.json`
    };
  }
}

class CSVExporter {
  async export(words, options) {
    const headers = ['Word', 'Meaning', 'Phonetic', 'Example', 'Category', 'Difficulty', 'Next Review'];
    const rows = words.map(word => [
      word.word,
      word.meaning,
      word.phonetic || '',
      word.example || '',
      word.category || '',
      word.difficulty || '',
      new Date(word.srs?.nextReview || Date.now()).toISOString()
    ]);

    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    return {
      format: 'csv',
      data: csv,
      filename: `vocabulary-${new Date().toISOString().split('T')[0]}.csv`
    };
  }
}

/**
 * Cloud Sync Classes
 */
class GoogleDriveSync {
  constructor() {
    this.clientId = 'your-google-client-id';
    this.apiKey = 'your-google-api-key';
    this.scope = 'https://www.googleapis.com/auth/drive.file';
  }

  async sync(data) {
    // Google Drive API integration
    // Implementation details...
  }
}

// Initialize integration manager
if (typeof window !== 'undefined') {
  window.IntegrationManager = IntegrationManager;
  window.integrationManager = new IntegrationManager();
}