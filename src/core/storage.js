import { DateUtils } from "./date.js";

// Vocabulary storage operations
import { DateUtils } from "./date.js";
import { generateUUID } from "./id.js";
import { TextUtils } from "./text.js";

export const StorageManager = {
  async get(key) {
    if (typeof chrome === "undefined" || !chrome.storage) return undefined;
    try {
      const sync = await chrome.storage.sync.get(key);
      if (sync[key] !== undefined) return sync[key];
      const local = await chrome.storage.local.get(key);
      return local[key];
    } catch {
      try {
        const local = await chrome.storage.local.get(key);
        return local[key];
      } catch {
        return undefined;
      }
    }
  },
  async set(key, value) {
    if (typeof chrome === "undefined" || !chrome.storage) throw new Error("chrome.storage unavailable");
    try {
      await chrome.storage.sync.set({ [key]: value });
      return true;
    } catch {
      await chrome.storage.local.set({ [key]: value });
      return true;
    }
  },
  async remove(key) {
    if (!chrome?.storage) throw new Error("chrome.storage unavailable");
    try { await chrome.storage.sync.remove(key); } catch {}
    await chrome.storage.local.remove(key);
  },
  async clear() {
    if (!chrome?.storage) throw new Error("chrome.storage unavailable");
    try { await chrome.storage.sync.clear(); } catch {}
    await chrome.storage.local.clear();
  }
};

export const VocabStorage = {
  VOCAB_KEY: "vocab_words",

  async getAllWords() {
    const words = await StorageManager.get(this.VOCAB_KEY);
    return Array.isArray(words) ? words : [];
  },

  async addWord(wordData) {
    const words = await this.getAllWords();
    const normalizedInput = TextUtils.sanitizeText(wordData.word.toLowerCase());
    const exists = words.some(w => TextUtils.sanitizeText(w.word.toLowerCase()) === normalizedInput);
    if (exists) throw new Error(`"${wordData.word}" already exists in your dictionary`);

    const newWord = {
      id: wordData.id || generateUUID(),
      word: TextUtils.formatDisplayText(wordData.word),
      meaning: wordData.meaning || "",
      example: wordData.example || "",
      phonetic: wordData.phonetic || "",
      audioUrl: wordData.audioUrl || null,
      wordType: TextUtils.isPhrase(wordData.word) ? "phrase" : "word",
      wordCount: TextUtils.countWords(wordData.word),
      srs: wordData.srs && typeof wordData.srs === "object"
        ? {
            easeFactor: wordData.srs.easeFactor || 2.5,
            interval: wordData.srs.interval || 0,
            repetitions: wordData.srs.repetitions || 0,
            nextReview: wordData.srs.nextReview || DateUtils.now()
          }
        : { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: DateUtils.now() },
      createdAt: wordData.createdAt || DateUtils.now(),
      lastModified: DateUtils.now(),
      tags: wordData.tags || [],
      difficulty: wordData.difficulty || "medium",
      source: wordData.source || "manual"
    };

    words.push(newWord);
    await StorageManager.set(this.VOCAB_KEY, words);
    return newWord;
  },

  async updateWord(id, updates) {
    const words = await this.getAllWords();
    const idx = words.findIndex(w => w.id === id);
    if (idx === -1) throw new Error("Word not found");
    words[idx] = { ...words[idx], ...updates, lastModified: DateUtils.now() };
    await StorageManager.set(this.VOCAB_KEY, words);
    return words[idx];
  },

  async removeWord(id) {
    const words = await this.getAllWords();
    await StorageManager.set(this.VOCAB_KEY, words.filter(w => w.id !== id));
    return true;
  },

  async getWord(id) {
    const words = await this.getAllWords();
    return words.find(w => w.id === id) || null;
  },

  async getDueWords() {
    const words = await this.getAllWords();
    const now = Date.now();
    return words
      .filter(w => {
        const nr = w.srs?.nextReview;
        if (!nr) return true;
        const time = typeof nr === "string" ? new Date(nr).getTime() : nr;
        return now >= time;
      })
      .sort((a, b) => {
        const at = a.srs?.nextReview ? (typeof a.srs.nextReview === "string" ? new Date(a.srs.nextReview).getTime() : a.srs.nextReview) : 0;
        const bt = b.srs?.nextReview ? (typeof b.srs.nextReview === "string" ? new Date(b.srs.nextReview).getTime() : b.srs.nextReview) : 0;
        return at - bt;
      });
  }
};

export const GamificationStorage = {
  KEY: "vocabGamification",

  async getData() {
    return (await StorageManager.get(this.KEY)) || null;
  },

  async saveData(data) {
    await StorageManager.set(this.KEY, data);
    return true;
  },

  async clear() {
    await StorageManager.remove(this.KEY);
  }
};

export const AnalyticsStorage = {
  KEY: "vocabAnalytics",

  async getData() {
    return (await StorageManager.get(this.KEY)) || null;
  },

  async saveData(data) {
    await StorageManager.set(this.KEY, data);
    return true;
  },

  async clear() {
    await StorageManager.remove(this.KEY);
  }
};

