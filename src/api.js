// Dictionary API integration for pronunciation and audio
const DictionaryAPI = {
  BASE_URL: 'https://api.dictionaryapi.dev/api/v2/entries/en/',
  
  async fetchWordData(text) {
    try {
      const cleanText = text.trim().toLowerCase();
      
      // For phrases, try to get data for individual words
      const words = cleanText.split(/\s+/);
      
      if (words.length === 1) {
        // Single word - use existing logic
        return await this.fetchSingleWordData(cleanText);
      } else {
        // Phrase - get data for the first significant word
        return await this.fetchPhraseData(words, cleanText);
      }
    } catch (error) {
      console.error('Dictionary API error:', error);
      throw error;
    }
  },
  
  async fetchSingleWordData(word) {
    const response = await fetch(`${this.BASE_URL}${encodeURIComponent(word)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Word not found in dictionary');
      }
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return this.parseAPIResponse(data, word);
  },
  
  async fetchPhraseData(words, originalPhrase) {
    // Try to find dictionary data for the most significant word
    const significantWords = words.filter(word => 
      word.length > 2 && !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word)
    );
    
    const targetWord = significantWords[0] || words[0];
    
    try {
      const data = await this.fetchSingleWordData(targetWord);
      // Override the word field with the original phrase
      data.word = originalPhrase;
      data.isPhrase = true;
      return data;
    } catch (error) {
      // If no dictionary data found, return basic structure for phrase
      return {
        word: originalPhrase,
        phonetic: '',
        audioUrl: '',
        definitions: [],
        isPhrase: true
      };
    }
  },
  
  parseAPIResponse(data, originalText) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid API response format');
    }
    
    const entry = data[0]; // Take the first entry
    const result = {
      word: originalText || entry.word || '',
      phonetic: '',
      audioUrl: '',
      definitions: []
    };
    
    // Extract phonetic information
    if (entry.phonetic) {
      result.phonetic = entry.phonetic;
    } else if (entry.phonetics && Array.isArray(entry.phonetics)) {
      // Find first phonetic with text
      const phoneticWithText = entry.phonetics.find(p => p.text);
      if (phoneticWithText) {
        result.phonetic = phoneticWithText.text;
      }
    }
    
    // Extract audio URL
    if (entry.phonetics && Array.isArray(entry.phonetics)) {
      // Priority: US English > UK English > any available audio
      let audioUrl = '';
      
      // First, try to find US audio
      const usAudio = entry.phonetics.find(p => 
        p.audio && (p.audio.includes('-us') || p.audio.includes('_us'))
      );
      
      if (usAudio) {
        audioUrl = usAudio.audio;
      } else {
        // Then try UK audio
        const ukAudio = entry.phonetics.find(p => 
          p.audio && (p.audio.includes('-uk') || p.audio.includes('_uk'))
        );
        
        if (ukAudio) {
          audioUrl = ukAudio.audio;
        } else {
          // Finally, take any available audio
          const anyAudio = entry.phonetics.find(p => p.audio);
          if (anyAudio) {
            audioUrl = anyAudio.audio;
          }
        }
      }
      
      result.audioUrl = audioUrl;
    }
    
    // Extract definitions (for reference, not stored in main vocab)
    if (entry.meanings && Array.isArray(entry.meanings)) {
      entry.meanings.forEach(meaning => {
        if (meaning.definitions && Array.isArray(meaning.definitions)) {
          meaning.definitions.slice(0, 3).forEach(def => { // Limit to 3 definitions
            if (def.definition) {
              result.definitions.push({
                partOfSpeech: meaning.partOfSpeech || '',
                definition: def.definition,
                example: def.example || ''
              });
            }
          });
        }
      });
    }
    
    return result;
  },
  
  async testConnection() {
    try {
      const testWord = 'test';
      await this.fetchWordData(testWord);
      return true;
    } catch (error) {
      console.error('Dictionary API connection test failed:', error);
      return false;
    }
  }
};

// Audio playback utility with TTS fallback
const AudioPlayer = {
  currentAudio: null,
  
  async playAudio(text, audioUrl) {
    try {
      // First try to play audio URL if available (typically for single words)
      if (audioUrl) {
        const success = await this.playAudioUrl(audioUrl);
        if (success) {
          return { method: 'audio', success: true };
        }
      }
      
      // Fallback to Text-to-Speech (works for both words and phrases)
      return await this.playTextToSpeech(text);
      
    } catch (error) {
      console.error('Audio playback error:', error);
      
      // Try TTS as final fallback
      try {
        return await this.playTextToSpeech(text);
      } catch (ttsError) {
        throw new Error('Both audio playback and text-to-speech failed');
      }
    }
  },
  
  async playAudioUrl(audioUrl) {
    try {
      // Stop current audio if playing
      this.stop();
      
      // Create and play new audio
      this.currentAudio = new Audio(audioUrl);
      
      return new Promise((resolve) => {
        this.currentAudio.onended = () => resolve(true);
        this.currentAudio.onerror = () => resolve(false); // Don't reject, just indicate failure
        
        // Set volume to reasonable level
        this.currentAudio.volume = 0.7;
        this.currentAudio.play().catch(() => resolve(false));
      });
    } catch (error) {
      console.error('Audio URL playback error:', error);
      return false;
    }
  },
  
  async playTextToSpeech(text) {
    return new Promise((resolve, reject) => {
      // Check if Speech Synthesis is supported
      if (!window.speechSynthesis) {
        reject(new Error('Text-to-speech not supported in this browser'));
        return;
      }
      
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        
        // Adjust rate based on text length (slower for phrases)
        const wordCount = text.trim().split(/\s+/).length;
        utterance.rate = wordCount > 1 ? 0.7 : 0.8; // Slower for phrases
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        // Set up event handlers
        utterance.onend = () => resolve({ method: 'tts', success: true });
        utterance.onerror = (event) => reject(new Error(`TTS error: ${event.error}`));
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
        
        // Timeout fallback (adjust timeout for phrases)
        const timeout = Math.max(3000, wordCount * 1000); // 1 second per word minimum
        setTimeout(() => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
          }
          resolve({ method: 'tts', success: true });
        }, timeout);
        
      } catch (error) {
        reject(new Error(`TTS setup failed: ${error.message}`));
      }
    });
  },
  
  stop() {
    // Stop audio playback
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    // Stop speech synthesis
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.VocabAPI = {
    DictionaryAPI,
    AudioPlayer
  };
}
