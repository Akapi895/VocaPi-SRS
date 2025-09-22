import { VocabWord } from '@/types';

// ===============================
// Word Filtering & Search Utilities
// ===============================

/**
 * Get words that are due for review
 * @param words Array of vocabulary words
 * @param currentTime Current timestamp (defaults to now)
 * @returns Words due for review
 */
export const getDueWords = (words: VocabWord[], currentTime: number = Date.now()): VocabWord[] => {
  return words.filter(word => word.nextReview <= currentTime);
};

/**
 * Filter words based on search term (word, meaning, example)
 * @param words Array of vocabulary words
 * @param searchTerm Search query
 * @returns Filtered words array
 */
export const getFilteredWords = (words: VocabWord[], searchTerm: string): VocabWord[] => {
  if (!searchTerm.trim()) return words;
  
  const term = searchTerm.toLowerCase();
  return words.filter(word => 
    word.word.toLowerCase().includes(term) || 
    word.meaning.toLowerCase().includes(term) ||
    (word.example && word.example.toLowerCase().includes(term))
  );
};

/**
 * Search words by multiple criteria with ranking
 * @param words Array of vocabulary words
 * @param searchTerm Search query
 * @returns Ranked search results
 */
export const searchWordsWithRanking = (words: VocabWord[], searchTerm: string): VocabWord[] => {
  if (!searchTerm.trim()) return words;
  
  const term = searchTerm.toLowerCase();
  const results = words.map(word => {
    let score = 0;
    
    // Exact word match has highest priority
    if (word.word.toLowerCase() === term) score += 100;
    else if (word.word.toLowerCase().startsWith(term)) score += 50;
    else if (word.word.toLowerCase().includes(term)) score += 20;
    
    // Meaning match
    if (word.meaning.toLowerCase().includes(term)) score += 10;
    
    // Example match (lower priority)
    if (word.example && word.example.toLowerCase().includes(term)) score += 5;
    
    return { word, score };
  })
  .filter(result => result.score > 0)
  .sort((a, b) => b.score - a.score)
  .map(result => result.word);
  
  return results;
};

// ===============================
// Audio & Pronunciation Utilities
// ===============================

/**
 * Play word pronunciation with multiple fallback strategies
 * @param word Word to pronounce
 * @param vocabWords Array to find pronunciation URL
 * @returns Promise that resolves when audio starts playing
 */
export const playWordPronunciation = async (word: string, vocabWords: VocabWord[]): Promise<void> => {
  try {
    // Find word data
    const wordData = vocabWords.find(w => w.word.toLowerCase() === word.toLowerCase());
    const anyWordData = wordData as any;
    const pronunUrl: string | undefined = 
      anyWordData?.pronunUrl || anyWordData?.audioUrl || anyWordData?.audio || undefined;

    // Try to play from URL first
    if (pronunUrl && pronunUrl.trim() !== '') {
      const success = await playAudioFromUrl(pronunUrl);
      if (success) return;
    }
  } catch (error) {
    console.log('Audio processing error, falling back to TTS:', error);
  }

  // Fallback to TTS
  await playTextToSpeech(word);
};

/**
 * Play audio from URL with timeout and error handling
 * @param audioUrl Audio URL to play
 * @param timeout Timeout in milliseconds (default 8000)
 * @returns Promise<boolean> indicating success
 */
export const playAudioFromUrl = async (audioUrl: string, timeout: number = 8000): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(audioUrl, { 
      signal: controller.signal,
      method: 'GET'
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      try {
        const audio = new Audio(objectUrl);
        await audio.play();
        audio.onended = () => URL.revokeObjectURL(objectUrl);
        return true;
      } catch (playError) {
        URL.revokeObjectURL(objectUrl);
        console.log('Audio playback failed:', playError);
        return false;
      }
    }
    return false;
  } catch (fetchError) {
    console.log('Audio fetch failed:', fetchError);
    return false;
  }
};

/**
 * Play text-to-speech using Web Speech API
 * @param text Text to speak
 * @param options TTS options
 * @returns Promise that resolves when TTS starts
 */
export const playTextToSpeech = async (
  text: string, 
  options: { lang?: string; rate?: number; volume?: number } = {}
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    try {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang || 'en-US';
      utterance.rate = options.rate || 0.85;
      utterance.volume = options.volume || 0.8;
      
      utterance.onstart = () => resolve();
      utterance.onerror = (event) => reject(new Error(`TTS error: ${event.error}`));
      
      window.speechSynthesis.speak(utterance);
    } catch (ttsError) {
      reject(new Error(`Text-to-speech failed: ${ttsError}`));
    }
  });
};

// ===============================
// Data Import/Export Utilities
// ===============================

export interface ExportData {
  vocabWords: VocabWord[];
  gamification: any;
  analytics: any;
  settings: any;
  exportDate: string;
  version: string;
}

/**
 * Create export data object
 * @param data Current application data
 * @returns Structured export data
 */
export const createExportData = (data: any): ExportData => {
  return {
    vocabWords: data.vocabWords || [],
    gamification: data.gamification || {},
    analytics: data.analytics || {},
    settings: data.settings || {},
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
};

/**
 * Generate export filename with timestamp
 * @param prefix Filename prefix (default: 'vocab-srs-backup')
 * @returns Filename string
 */
export const generateExportFilename = (prefix: string = 'vocab-srs-backup'): string => {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${date}.json`;
};

/**
 * Download data as JSON file
 * @param data Data to export
 * @param filename Filename for download
 */
export const downloadJsonFile = (data: any, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

/**
 * Validate imported data structure
 * @param importData Parsed import data
 * @returns Validation result with details
 */
export const validateImportData = (importData: any): { isValid: boolean; error?: string; wordCount?: number } => {
  try {
    // Check basic structure
    if (!importData || typeof importData !== 'object') {
      return { isValid: false, error: 'Invalid file format. Must be a JSON object.' };
    }

    // Check for required fields
    if (!importData.vocabWords) {
      return { isValid: false, error: 'Missing vocabulary words data.' };
    }

    if (!Array.isArray(importData.vocabWords)) {
      return { isValid: false, error: 'Vocabulary words must be an array.' };
    }

    // Validate word structure
    for (const word of importData.vocabWords) {
      if (!word.id || !word.word || !word.meaning) {
        return { isValid: false, error: 'Invalid word data structure. Each word must have id, word, and meaning.' };
      }
    }

    return { 
      isValid: true, 
      wordCount: importData.vocabWords.length 
    };
  } catch (error) {
    return { isValid: false, error: 'Failed to parse file content.' };
  }
};

/**
 * Read file content as text
 * @param file File object
 * @returns Promise with file content
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Handle complete import process
 * @param file File to import
 * @param currentData Current application data
 * @returns Promise with import result
 */
export const processDataImport = async (
  file: File, 
  currentData: any
): Promise<{ success: boolean; data?: any; error?: string; wordCount?: number }> => {
  try {
    const text = await readFileAsText(file);
    const importData = JSON.parse(text);
    
    const validation = validateImportData(importData);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Merge imported data with current data
    const mergedData = {
      vocabWords: importData.vocabWords,
      gamification: importData.gamification || currentData?.gamification || {},
      analytics: importData.analytics || currentData?.analytics || {},
      settings: importData.settings || currentData?.settings || {}
    };

    return { 
      success: true, 
      data: mergedData, 
      wordCount: validation.wordCount 
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// ===============================
// Chrome API & Messaging Utilities
// ===============================

/**
 * Send message to all tabs to update content scripts
 * @param message Message object to send
 * @returns Promise with results from all tabs
 */
export const broadcastToAllTabs = async (message: any): Promise<void> => {
  try {
    const tabs = await chrome.tabs.query({});
    const promises = tabs.map(async (tab) => {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Ignore errors for tabs that don't have content script
          console.log(`Tab ${tab.id} doesn't have content script or failed to send message`);
        }
      }
    });
    
    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Failed to broadcast to tabs:', error);
    throw error;
  }
};

/**
 * Toggle word highlighting across all tabs
 * @param enabled Whether highlighting should be enabled
 * @returns Promise that resolves when all tabs are updated
 */
export const toggleWordHighlightingGlobally = async (enabled: boolean): Promise<void> => {
  const message = {
    type: 'TOGGLE_WORD_HIGHLIGHTING',
    data: { enabled }
  };
  
  await broadcastToAllTabs(message);
};

/**
 * Open Chrome extension page in new tab
 * @param page Page name (e.g., 'review.html', 'analytics.html')
 * @returns Promise that resolves when tab is created
 */
export const openExtensionPage = async (page: string): Promise<void> => {
  const url = chrome.runtime.getURL(page);
  await chrome.tabs.create({ url });
};

/**
 * Create file input element for file selection
 * @param accept File types to accept
 * @param multiple Whether to allow multiple files
 * @returns Promise with selected file(s)
 */
export const createFileInput = (
  accept: string = '.json', 
  multiple: boolean = false
): Promise<FileList | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      resolve(files);
    };
    input.click();
  });
};

// ===============================
// Statistics & Analytics Utilities
// ===============================

/**
 * Calculate learning statistics from data
 * @param data Application data
 * @returns Calculated statistics
 */
export const calculateLearningStats = (data: any) => {
  const totalWords = data?.vocabWords?.length || 0;
  const dueWords = getDueWords(data?.vocabWords || []);
  const level = data?.gamification?.level || 1;
  const xp = data?.gamification?.xp || 0;
  const streak = data?.gamification?.streak || 0;
  const accuracy = data?.analytics?.accuracy || 0;

  return {
    totalWords,
    dueWordsCount: dueWords.length,
    level,
    xp,
    streak,
    accuracy: Math.round(accuracy),
    // Additional calculated stats
    completionRate: totalWords > 0 ? Math.round(((totalWords - dueWords.length) / totalWords) * 100) : 0,
    hasDueWords: dueWords.length > 0
  };
};

/**
 * Format date for display in word list
 * @param timestamp Date timestamp
 * @param format Format type ('short' | 'long')
 * @returns Formatted date string
 */
export const formatDateForDisplay = (timestamp: number, format: 'short' | 'long' = 'short'): string => {
  const date = new Date(timestamp);
  
  if (format === 'long') {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return date.toLocaleDateString();
};

/**
 * Get review status color based on due date
 * @param nextReviewDate Next review timestamp
 * @returns Status color class
 */
export const getReviewStatusColor = (nextReviewDate: number): string => {
  const now = Date.now();
  const diff = nextReviewDate - now;
  const days = diff / (1000 * 60 * 60 * 24);
  
  if (days <= 0) return 'text-red-600'; // Overdue
  if (days <= 1) return 'text-orange-600'; // Due soon
  if (days <= 3) return 'text-yellow-600'; // Due within 3 days
  return 'text-green-600'; // Not due yet
};

// ===============================
// UI State Management Helpers
// ===============================

/**
 * Debounce function for search input
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Validate popup state and data integrity
 * @param data Application data
 * @returns Validation result
 */
export const validatePopupState = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data) {
    errors.push('No data available');
  } else {
    if (!data.vocabWords || !Array.isArray(data.vocabWords)) {
      errors.push('Invalid vocabulary words data');
    }
    
    if (!data.gamification) {
      errors.push('Missing gamification data');
    }
    
    if (!data.analytics) {
      errors.push('Missing analytics data');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};