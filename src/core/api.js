// Dictionary API
const DictionaryAPI = {
  BASE_URL: 'https://api.dictionaryapi.dev/api/v2/entries/en/',
  
  async fetchWordData(text) {
    const cleanText = text.trim().toLowerCase();
    const words = cleanText.split(/\s+/);
    const isPhrase = words.length > 1;

    const targetWord = isPhrase
      ? words.find(w => w.length > 2 && !['the','and','or','but','in','on','at','to','for','of','with','by'].includes(w)) || words[0]
      : cleanText;

    try {
      const data = await this.fetchSingleWordData(targetWord);
      if (isPhrase) {
        data.word = cleanText;
        data.isPhrase = true;
      }
      return data;
    } catch {
      return isPhrase ? { word: cleanText, phonetic:'', audioUrl:'', definitions:[], isPhrase:true } : null;
    }
  },

  async fetchSingleWordData(word) {
    const res = await fetch(`${this.BASE_URL}${encodeURIComponent(word)}`);
    if (!res.ok) throw new Error(res.status === 404 ? 'Word not found' : `API error: ${res.status}`);
    return this.parseAPIResponse(await res.json(), word);
  },

  parseAPIResponse(data, word) {
    if (!Array.isArray(data) || !data.length) throw new Error('Invalid API response');
    const entry = data[0];
    const result = { word, phonetic:'', audioUrl:'', definitions:[] };

    result.phonetic = entry.phonetic || entry.phonetics?.find(p=>p.text)?.text || '';
    result.audioUrl = this.pickAudio(entry.phonetics);
    entry.meanings?.forEach(m => 
      m.definitions?.slice(0,3).forEach(d => result.definitions.push({
        partOfSpeech: m.partOfSpeech||'', definition: d.definition, example: d.example||''
      }))
    );
    return result;
  },

  pickAudio(phonetics=[]) {
    return phonetics.find(p=>p.audio?.includes('-us')||p.audio?.includes('_us'))?.audio ||
           phonetics.find(p=>p.audio?.includes('-uk')||p.audio?.includes('_uk'))?.audio ||
           phonetics.find(p=>p.audio)?.audio || '';
  },

  async testConnection() {
    try { await this.fetchWordData('test'); return true; }
    catch { return false; }
  },

  // Thêm method getWordInfo để tương thích với addModal.js
  async getWordInfo(word) {
    try {
      const data = await this.fetchWordData(word);
      if (data) {
        return {
          word: data.word,
          phonetic: data.phonetic || "/" + word + "/",
          audioUrl: data.audioUrl || ""
        };
      }
    } catch (error) {
      console.log("DictionaryAPI.getWordInfo failed:", error.message);
    }
    
    // Fallback
    return {
      word: word,
      phonetic: "/" + word + "/",
      audioUrl: ""
    };
  }
};

// Expose to window for content scripts
if (typeof window !== 'undefined') {
  window.DictionaryAPI = DictionaryAPI;
}

// No export needed for content scripts

// Audio Player
const AudioPlayer = {
  current: null,
  
  async playAudio(text, url) {
    return (url && await this.playUrl(url)) ? {method:'audio',success:true} 
           : this.playTTS(text);
  },

  playUrl(url) {
    this.stop();
    return new Promise(res=>{
      const a = this.current = new Audio(url);
      a.volume = 0.7;
      a.onended = ()=>res(true);
      a.onerror = ()=>res(false);
      a.play().catch(()=>res(false));
    });
  },

  playTTS(text) {
    return new Promise((res,rej)=>{
      if (!window.speechSynthesis) return rej(new Error('TTS not supported'));
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const words = text.trim().split(/\s+/).length;
      Object.assign(u,{ lang:'en-US', rate: words>1?0.7:0.8, pitch:1, volume:0.8 });
      u.onend = ()=>res({method:'tts',success:true});
      u.onerror = e=>rej(new Error(`TTS error: ${e.error}`));
      window.speechSynthesis.speak(u);
    });
  },

  stop() {
    if (this.current) { this.current.pause(); this.current=null; }
    if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
  }
};

// Expose to window for content scripts
if (typeof window !== 'undefined') {
  window.AudioPlayer = AudioPlayer;
}
