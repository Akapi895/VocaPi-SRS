// Service Worker for VocaPi extension
import { VocabWord, GamificationData, AnalyticsData, Settings } from '@/types';

// Initialize service worker
chrome.runtime.onInstalled.addListener(async () => {
  console.log('VocaPi extension installed');
  
  // Create context menu
  chrome.contextMenus.create({
    id: 'add-to-dictionary',
    title: 'Add to Dictionary',
    contexts: ['selection']
  });
  
  // Set up alarms for daily reminders
  chrome.alarms.create('daily-reminder', {
    delayInMinutes: 1,
    periodInMinutes: 24 * 60 // 24 hours
  });
  
  // Inject content script into all existing tabs
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['src/content/index.ts']
          });
        } catch (error) {
          console.log(`Failed to inject content script into tab ${tab.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to inject content scripts:', error);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'add-to-dictionary' && info.selectionText) {
    // Send message to content script to show add modal
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_ADD_MODAL',
          data: { word: info.selectionText }
        });
      } catch (error) {
        console.error('Failed to send message to content script:', error);
      }
    }
  }
});

// Handle alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily-reminder') {
    await checkDailyReminder();
  }
});

// Check daily reminder
async function checkDailyReminder() {
  try {
    const result = await chrome.storage.local.get(['settings', 'vocabWords']);
    const settings = result.settings as Settings;
    const words = result.vocabWords as VocabWord[];
    
    if (!settings?.reviewReminders || !words) return;
    
    // Check if there are words due for review
    const now = Date.now();
    const dueWords = words.filter(word => word.nextReview <= now);
    
    if (dueWords.length > 0) {
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon48.png',
        title: 'VocaPi - Review Time!',
        message: `You have ${dueWords.length} words due for review. Click to start your review session.`
      });
    }
  } catch (error) {
    console.error('Failed to check daily reminder:', error);
  }
}

// Handle notifications
chrome.notifications.onClicked.addListener(() => {
  // Open popup when notification is clicked
  chrome.action.openPopup();
});

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'GET_DATA':
      handleGetData(sendResponse);
      break;
      
    case 'SAVE_WORD':
      handleSaveWord(message.data, sendResponse);
      break;
      
    case 'UPDATE_WORD':
      handleUpdateWord(message.data, sendResponse);
      break;
      
    case 'DELETE_WORD':
      handleDeleteWord(message.data, sendResponse);
      break;
      
    case 'START_REVIEW':
      handleStartReview(sendResponse);
      break;
      
    case 'UPDATE_ANALYTICS':
      handleUpdateAnalytics(message.data, sendResponse);
      break;
      
    case 'UPDATE_GAMIFICATION':
      handleUpdateGamification(message.data, sendResponse);
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
  
  return true; // Keep message channel open for async response
});

// Handle get data request
async function handleGetData(sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.local.get([
      'vocabWords',
      'gamification',
      'analytics',
      'settings',
      'dailyStats',
      'reviewSessions'
    ]);
    
    sendResponse({ success: true, data: result });
  } catch (error) {
    console.error('Failed to get data:', error);
    sendResponse({ error: 'Failed to get data' });
  }
}

// Handle save word request
async function handleSaveWord(wordData: VocabWord, sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.local.get(['vocabWords']);
    const existingWords = result.vocabWords || [];
    
    // Check if word with same meaning already exists
    const existingWord = existingWords.find((w: VocabWord) => 
      w.word.toLowerCase() === wordData.word.toLowerCase() &&
      w.meaning.toLowerCase() === wordData.meaning.toLowerCase()
    );
    
    if (existingWord) {
      sendResponse({ error: 'Word with this meaning already exists' });
      return;
    }
    
    // Add new word
    const newWord: VocabWord = {
      ...wordData,
      id: `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    existingWords.push(newWord);
    await chrome.storage.local.set({ vocabWords: existingWords });
    
    // Update analytics
    await updateAnalyticsAfterWordAdd();
    
    sendResponse({ success: true, word: newWord });
  } catch (error) {
    console.error('Failed to save word:', error);
    sendResponse({ error: 'Failed to save word' });
  }
}

// Handle update word request
async function handleUpdateWord(updateData: { id: string; updates: Partial<VocabWord> }, sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.local.get(['vocabWords']);
    const words = result.vocabWords || [];
    
    const wordIndex = words.findIndex((w: VocabWord) => w.id === updateData.id);
    if (wordIndex === -1) {
      sendResponse({ error: 'Word not found' });
      return;
    }
    
    // Update word
    words[wordIndex] = {
      ...words[wordIndex],
      ...updateData.updates,
      updatedAt: Date.now()
    };
    
    await chrome.storage.local.set({ vocabWords: words });
    sendResponse({ success: true, word: words[wordIndex] });
  } catch (error) {
    console.error('Failed to update word:', error);
    sendResponse({ error: 'Failed to update word' });
  }
}

// Handle delete word request
async function handleDeleteWord(wordId: string, sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.local.get(['vocabWords']);
    const words = result.vocabWords || [];
    
    const filteredWords = words.filter((w: VocabWord) => w.id !== wordId);
    await chrome.storage.local.set({ vocabWords: filteredWords });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Failed to delete word:', error);
    sendResponse({ error: 'Failed to delete word' });
  }
}

// Handle start review request
async function handleStartReview(sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.local.get(['vocabWords']);
    const words = result.vocabWords || [];
    
    const now = Date.now();
    const dueWords = words.filter((word: VocabWord) => word.nextReview <= now);
    
    sendResponse({ success: true, dueWords });
  } catch (error) {
    console.error('Failed to start review:', error);
    sendResponse({ error: 'Failed to start review' });
  }
}

// Handle update analytics request
async function handleUpdateAnalytics(analyticsData: Partial<AnalyticsData>, sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.local.get(['analytics']);
    const existingAnalytics = result.analytics || {};
    
    const updatedAnalytics = {
      ...existingAnalytics,
      ...analyticsData
    };
    
    await chrome.storage.local.set({ analytics: updatedAnalytics });
    sendResponse({ success: true, analytics: updatedAnalytics });
  } catch (error) {
    console.error('Failed to update analytics:', error);
    sendResponse({ error: 'Failed to update analytics' });
  }
}

// Handle update gamification request
async function handleUpdateGamification(gamificationData: Partial<GamificationData>, sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.local.get(['gamification']);
    const existingGamification = result.gamification || {};
    
    const updatedGamification = {
      ...existingGamification,
      ...gamificationData
    };
    
    await chrome.storage.local.set({ gamification: updatedGamification });
    sendResponse({ success: true, gamification: updatedGamification });
  } catch (error) {
    console.error('Failed to update gamification:', error);
    sendResponse({ error: 'Failed to update gamification' });
  }
}

// Update analytics after adding a word
async function updateAnalyticsAfterWordAdd() {
  try {
    const result = await chrome.storage.local.get(['analytics', 'vocabWords']);
    const analytics = result.analytics || {};
    const words = result.vocabWords || [];
    
    const updatedAnalytics = {
      ...analytics,
      totalWords: words.length,
      newWords: words.filter((w: VocabWord) => w.repetitions === 0).length,
      learnedWords: words.filter((w: VocabWord) => w.repetitions >= 5).length,
      reviewWords: words.filter((w: VocabWord) => w.repetitions > 0 && w.repetitions < 5).length
    };
    
    await chrome.storage.local.set({ analytics: updatedAnalytics });
  } catch (error) {
    console.error('Failed to update analytics after word add:', error);
  }
}

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    // Handle storage changes if needed
    console.log('Storage changed:', changes);
  }
});

// Handle new tab creation
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && 
      !tab.url.startsWith('chrome://') && 
      !tab.url.startsWith('chrome-extension://') &&
      !tab.url.startsWith('moz-extension://')) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content/index.js']
      });
    } catch (error) {
      console.log(`Failed to inject content script into new tab ${tabId}:`, error);
    }
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('VocaPi extension started');
});

// Handle extension suspend
chrome.runtime.onSuspend.addListener(() => {
  console.log('VocaPi extension suspended');
});
