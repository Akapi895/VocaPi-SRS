import { DictionaryEntry } from '../types/index';

export interface DictionaryModalOptions {
  word?: string;
  onSave: (data: WordData) => void | Promise<void>;
  onClose: () => void;
}

export interface WordData {
  word: string;
  meaning: string;
  phonetic: string;
  wordType: string;
  example?: string;
  audioUrl?: string;
}

export interface DictLookupResult {
  word: string;
  entries: DictionaryEntry[];
}

export class DictionaryModal {
  private modal: HTMLElement | null = null;
  private options: DictionaryModalOptions;
  private currentTab: 'lookup' | 'input' = 'lookup';
  private lookupResults: DictLookupResult | null = null;
  private selectedEntry: DictionaryEntry | null = null;
  private selectedDefinitionIndex: number = 0;
  private selectedExampleIndex: number = 0;

  constructor(options: DictionaryModalOptions) {
    this.options = options;
  }

  public async show(): Promise<void> {
    await this.createModal();
    if (this.options.word) {
      await this.performDictionaryLookup(this.options.word);
    }
  }

  private async createModal(): Promise<void> {
    // Remove existing modal if any
    this.destroy();

    this.modal = document.createElement('div');
    this.modal.id = 'vocab-srs-dictionary-modal';
    this.modal.className = 'vocab-srs-modal';
    
    this.modal.innerHTML = this.getModalHTML();
    
    // Add styles
    this.addStyles();
    
    document.body.appendChild(this.modal);
    
    // Add event listeners
    this.attachEventListeners();
    
    // Show modal with animation
    setTimeout(() => {
      this.modal?.classList.add('vocab-srs-modal-show');
    }, 10);
  }

  private getModalHTML(): string {
    const hasResults = this.lookupResults && this.lookupResults.entries.length > 0;

    return `
      <div class="vocab-srs-modal-overlay">
        <div class="vocab-srs-modal-content vocab-srs-dictionary-modal-content">
          <div class="vocab-srs-modal-header">
            <div class="vocab-srs-tab-navigation">
              ${hasResults ? `
                <button class="vocab-srs-tab-btn ${this.currentTab === 'lookup' ? 'active' : ''}" data-tab="lookup">
                  Dictionary Lookup
                </button>
              ` : ''}
              <button class="vocab-srs-tab-btn ${this.currentTab === 'input' || !hasResults ? 'active' : ''}" data-tab="input">
                ${hasResults ? 'Custom Entry' : 'Add to Dictionary'}
              </button>
            </div>
            <button class="vocab-srs-modal-close">&times;</button>
          </div>
          
          <div class="vocab-srs-modal-body">
            ${hasResults ? this.getLookupTabHTML() : ''}
            ${this.getInputTabHTML()}
          </div>
          
          <div class="vocab-srs-modal-footer">
            <button class="vocab-srs-btn-cancel">Cancel</button>
            <button class="vocab-srs-btn-save">Save to Dictionary</button>
          </div>
        </div>
      </div>
    `;
  }

  private getLookupTabHTML(): string {
    if (!this.lookupResults) {
      return '<div class="vocab-srs-tab-content" data-tab="lookup" style="display: none;"></div>';
    }

    const entriesHTML = this.lookupResults.entries.map((entry, index) => {
      const maxDefinitions = 3;
      const maxExamples = 2;
      const hasMoreDefs = entry.definitions && entry.definitions.length > maxDefinitions;
      const hasMoreExs = entry.examples && entry.examples.length > maxExamples;

      return `
        <div class="vocab-srs-dict-entry ${this.selectedEntry === entry ? 'selected' : ''}" data-entry-index="${index}">
          <div class="vocab-srs-dict-entry-header">
            <div class="vocab-srs-dict-word-info">
              <div class="vocab-srs-dict-word">${this.lookupResults!.word}</div>
              ${entry.phonetic ? `<div class="vocab-srs-dict-phonetic">${entry.phonetic}</div>` : ''}
            </div>
            <div class="vocab-srs-dict-actions">
              ${entry.audio ? `<button class="vocab-srs-dict-audio" data-audio="${entry.audio}" title="Play pronunciation">🔊</button>` : ''}
              <button class="vocab-srs-dict-select-btn-compact">Select</button>
            </div>
          </div>
          
          ${entry.types && entry.types.length > 0 ? `
            <div class="vocab-srs-dict-types">
              ${entry.types.map((type: string) => `<span class="vocab-srs-dict-type">${type}</span>`).join('')}
            </div>
          ` : ''}
          
          ${entry.definitions && entry.definitions.length > 0 ? `
            <div class="vocab-srs-dict-definitions">
              <div class="vocab-srs-section-header">
                <h4>Definitions</h4>
                ${hasMoreDefs ? `<span class="vocab-srs-count-badge">${entry.definitions.length}</span>` : ''}
              </div>
              <ul class="vocab-srs-definitions-list">
                ${entry.definitions.slice(0, maxDefinitions).map((def: string) => 
                  `<li class="vocab-srs-definition-item">${this.smartTruncate(def, 120)}</li>`
                ).join('')}
                ${hasMoreDefs ? `
                  <li class="vocab-srs-more-items">
                    <button class="vocab-srs-show-more" data-type="definitions" data-entry-index="${index}">
                      +${entry.definitions.length - maxDefinitions} more definitions
                    </button>
                  </li>
                ` : ''}
              </ul>
            </div>
          ` : ''}
          
          ${entry.examples && entry.examples.length > 0 ? `
            <div class="vocab-srs-dict-examples">
              <div class="vocab-srs-section-header">
                <h4>Examples</h4>
                ${hasMoreExs ? `<span class="vocab-srs-count-badge">${entry.examples.length}</span>` : ''}
              </div>
              <ul class="vocab-srs-examples-list">
                ${entry.examples.slice(0, maxExamples).map((ex: string) => 
                  `<li class="vocab-srs-example-item">"${this.smartTruncate(ex, 100)}"</li>`
                ).join('')}
                ${hasMoreExs ? `
                  <li class="vocab-srs-more-items">
                    <button class="vocab-srs-show-more" data-type="examples" data-entry-index="${index}">
                      +${entry.examples.length - maxExamples} more examples
                    </button>
                  </li>
                ` : ''}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="vocab-srs-tab-content" data-tab="lookup" ${this.currentTab === 'lookup' ? '' : 'style="display: none;"'}>
        <div class="vocab-srs-dict-search-result">
          <div class="vocab-srs-result-header">
            <h3>Dictionary Results</h3>
            <span class="vocab-srs-result-count">${this.lookupResults.entries.length} ${this.lookupResults.entries.length === 1 ? 'entry' : 'entries'} for "${this.lookupResults.word}"</span>
          </div>
          <div class="vocab-srs-dict-entries">
            ${entriesHTML}
          </div>
        </div>
      </div>
    `;
  }

  private getInputTabHTML(): string {
    const isActive = this.currentTab === 'input' || !this.lookupResults;
    const hasSelectedEntry = !!this.selectedEntry;
    
    // Pre-fill data from selected entry or existing word
    const wordValue = this.selectedEntry ? this.lookupResults?.word || '' : this.options.word || '';
    const meaningValue = hasSelectedEntry && this.selectedEntry?.definitions ? this.selectedEntry.definitions[this.selectedDefinitionIndex] : '';
    const phoneticValue = this.selectedEntry?.phonetic || (wordValue ? this.generateFallbackPhonetic(wordValue) : '');
    const exampleValue = hasSelectedEntry && this.selectedEntry?.examples ? this.selectedEntry.examples[this.selectedExampleIndex] : '';
    const audioUrl = this.selectedEntry?.audio || '';
    
    // Try to match word type from selected entry
    let wordTypeValue = '';
    if (hasSelectedEntry && this.selectedEntry?.types) {
      const validTypes = ['noun', 'verb', 'adjective', 'adverb', 'idiom', 'phrase', 'other'];
      const matchedType = this.selectedEntry.types.find((type: string) => 
        validTypes.includes(type.toLowerCase())
      );
      wordTypeValue = matchedType?.toLowerCase() || '';
    }

    // Create meaning options for dropdown
    const meaningOptions = hasSelectedEntry && this.selectedEntry?.definitions 
      ? this.selectedEntry.definitions.map((def, index) => {
          const truncatedDef = this.smartTruncate(def, 80);
          return `<option value="${index}" ${index === this.selectedDefinitionIndex ? 'selected' : ''}>${truncatedDef}</option>`;
        }).join('')
      : '';

    // Create example options for dropdown
    const exampleOptions = hasSelectedEntry && this.selectedEntry?.examples 
      ? this.selectedEntry.examples.map((ex, index) => {
          const truncatedEx = this.smartTruncate(ex, 70);
          return `<option value="${index}" ${index === this.selectedExampleIndex ? 'selected' : ''}>${truncatedEx}</option>`;
        }).join('')
      : '';

    return `
      <div class="vocab-srs-tab-content" data-tab="input" ${isActive ? '' : 'style="display: none;"'}>
        <div class="vocab-srs-form-group">
          <label>Word *</label>
          <input type="text" id="vocab-word" value="${wordValue}" placeholder="Enter word" required>
        </div>
        
        ${hasSelectedEntry ? `
          <div class="vocab-srs-form-group">
            <label>Select Meaning *</label>
            <select id="vocab-meaning-select" required>
              ${meaningOptions}
              <option value="custom">Custom meaning...</option>
            </select>
          </div>
        ` : ''}
        
        <div class="vocab-srs-form-group" id="vocab-meaning-group" ${hasSelectedEntry ? 'style="display: none;"' : ''}>
          <label>Meaning *</label>
          <input type="text" id="vocab-meaning" value="${meaningValue}" placeholder="Enter meaning" ${hasSelectedEntry ? 'readonly' : ''} required>
        </div>
        
        <div class="vocab-srs-form-group">
          <label>Phonetic *</label>
          <div class="vocab-srs-phonetic-group">
            <input type="text" id="vocab-phonetic" value="${phoneticValue}" placeholder="Phonetic transcription" ${hasSelectedEntry ? '' : 'readonly'}>
            <button type="button" class="vocab-srs-play-audio" ${audioUrl ? `data-audio="${audioUrl}"` : ''} title="Play pronunciation">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5,6 9,2 9,2 15,6 15,11 19,11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="vocab-srs-form-group">
          <label>Word Type *</label>
          <select id="vocab-word-type" required>
            <option value="">Select word type</option>
            <option value="noun" ${wordTypeValue === 'noun' ? 'selected' : ''}>Noun</option>
            <option value="verb" ${wordTypeValue === 'verb' ? 'selected' : ''}>Verb</option>
            <option value="adjective" ${wordTypeValue === 'adjective' ? 'selected' : ''}>Adjective</option>
            <option value="adverb" ${wordTypeValue === 'adverb' ? 'selected' : ''}>Adverb</option>
            <option value="idiom" ${wordTypeValue === 'idiom' ? 'selected' : ''}>Idiom</option>
            <option value="phrase" ${wordTypeValue === 'phrase' ? 'selected' : ''}>Phrase</option>
            <option value="other" ${wordTypeValue === 'other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
        
        ${hasSelectedEntry && this.selectedEntry?.examples && this.selectedEntry.examples.length > 0 ? `
          <div class="vocab-srs-form-group">
            <label>Select Example (optional)</label>
            <select id="vocab-example-select">
              <option value="">No example</option>
              ${exampleOptions}
              <option value="custom">Custom example...</option>
            </select>
          </div>
        ` : ''}
        
        <div class="vocab-srs-form-group" id="vocab-example-group" ${hasSelectedEntry && this.selectedEntry?.examples && this.selectedEntry.examples.length > 0 ? 'style="display: none;"' : ''}>
          <label>Example (optional)</label>
          <input type="text" id="vocab-example" value="${exampleValue}" placeholder="Enter example sentence" ${hasSelectedEntry && exampleValue ? 'readonly' : ''}>
        </div>
        
        ${hasSelectedEntry ? `
          <div class="vocab-srs-selected-entry-info">
            <small>✓ Data populated from dictionary entry</small>
            ${this.lookupResults ? `<small style="display: block; margin-top: 4px; color: #6b7280;">💡 You can switch back to "Dictionary Lookup" tab to choose a different entry</small>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  private async performDictionaryLookup(word: string): Promise<void> {
    try {
      // Show loading state
      if (this.modal) {
        const bodyEl = this.modal.querySelector('.vocab-srs-modal-body');
        if (bodyEl) {
          bodyEl.innerHTML = `
            <div class="vocab-srs-loading">
              <div class="vocab-srs-spinner"></div>
              <p>🔍 Searching dictionary for "${word}"...</p>
              <small>Checking online dictionary first...</small>
            </div>
          `;
        }
      }

      const result = await this.searchDictionary(word);
      this.lookupResults = result;
      
      // Update modal content based on lookup results
      if (result && result.entries.length > 0) {
        this.currentTab = 'lookup';
        
        // Update modal content in-place instead of recreating
        this.updateModalContent();
        
        // Auto-fetch phonetic using cascade system after displaying results
        setTimeout(() => {
          this.cascadePhoneticFetch(word).then(() => {
            // Auto-play audio after cascade fetch completes
            this.autoPlayWordAudio(word);
          });
        }, 300); // Small delay to let UI update first
      } else {
        this.currentTab = 'input';
        this.lookupResults = null;
        
        // Show "not found" message very briefly  
        if (this.modal) {
          const bodyEl = this.modal.querySelector('.vocab-srs-modal-body');
          if (bodyEl) {
            bodyEl.innerHTML = `
              <div class="vocab-srs-not-found">
                <div class="vocab-srs-not-found-icon">❌</div>
                <p>No dictionary entry found for "${word}"</p>
                <small>Switching to manual entry...</small>
              </div>
            `;
          }
        }
        
        // Switch to input tab quickly (500ms instead of 1500ms)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update to input tab
        this.updateModalContent();
        
        // Auto-fetch phonetic and audio for the word after switching to input tab
        await this.fetchPhoneticForWord(word);
        
        // Auto-play audio after fetching phonetic
        this.autoPlayWordAudio(word);
      }
      
    } catch (error) {
      console.error('Dictionary lookup failed:', error);
      
      // Show error message
      if (this.modal) {
        const bodyEl = this.modal.querySelector('.vocab-srs-modal-body');
        if (bodyEl) {
          bodyEl.innerHTML = `
            <div class="vocab-srs-error">
              <div class="vocab-srs-error-icon">⚠️</div>
              <p>Dictionary lookup failed</p>
              <small>Loading manual entry form...</small>
            </div>
          `;
        }
      }
      
      // Wait a moment then switch to input tab
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.currentTab = 'input';
      this.lookupResults = null;
      this.updateModalContent();
      
      // Auto-fetch phonetic and audio even after error
      await this.fetchPhoneticForWord(word);
      
      // Auto-play audio after error recovery
      this.autoPlayWordAudio(word);
    }
  }

  private async searchDictionary(word: string): Promise<DictLookupResult | null> {
    try {
      // Try online API first with short timeout
      try {
        const onlineResult = await this.searchOnlineAPI(word);
        if (onlineResult) {
          return onlineResult;
        }
      } catch (onlineError) {
        // Online API failed, continue to fallback
      }
      
      // Fallback to simple mock dictionary for now
      return this.createSimpleDictionaryEntry(word);
      
    } catch (error) {
      console.error('Dictionary search error:', error);
      return this.createSimpleDictionaryEntry(word);
    }
  }

  private createSimpleDictionaryEntry(word: string): DictLookupResult | null {
    // Create a simple entry for common words
    const commonWords: { [key: string]: { definitions: string[], type: string } } = {
      'hello': { definitions: ['A greeting used when meeting someone'], type: 'interjection' },
      'hey': { definitions: ['An exclamation used to attract attention or express surprise'], type: 'interjection' },
      'hi': { definitions: ['An informal greeting'], type: 'interjection' },
      'good': { definitions: ['Having the required qualities; of a high standard'], type: 'adjective' },
      'bad': { definitions: ['Of poor quality; not satisfactory'], type: 'adjective' },
      'big': { definitions: ['Of considerable size or extent'], type: 'adjective' },
      'small': { definitions: ['Of a size that is less than normal or usual'], type: 'adjective' },
      'beautiful': { definitions: ['Pleasing the senses or mind aesthetically'], type: 'adjective' },
      'amazing': { definitions: ['Causing great surprise or wonder; astonishing'], type: 'adjective' },
      'wonderful': { definitions: ['Inspiring delight, pleasure, or admiration; extremely good'], type: 'adjective' }
    };

    const wordLower = word.toLowerCase();
    const entry = commonWords[wordLower];
    
    if (entry) {
      return {
        word,
        entries: [{
          definitions: entry.definitions,
          examples: [`Example with "${word}"`],
          types: [entry.type],
          phonetic: `/${wordLower}/`,
          audio: ''
        }]
      };
    }

    return null; // Return null if not in simple dictionary
  }

  private async searchOnlineAPI(word: string): Promise<DictLookupResult | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 3000); // Reduced to 3 seconds
      
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
        { 
          signal: controller.signal,
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data || !Array.isArray(data) || data.length === 0) {
        return null;
      }

      const entry = data[0];
      const entries: DictionaryEntry[] = [];

      // Process meanings
      if (entry.meanings && Array.isArray(entry.meanings)) {
        for (const meaning of entry.meanings) {
          const definitions: string[] = [];
          const examples: string[] = [];
          
          if (meaning.definitions && Array.isArray(meaning.definitions)) {
            for (const def of meaning.definitions) {
              if (def.definition) {
                definitions.push(def.definition);
              }
              if (def.example) {
                examples.push(def.example);
              }
            }
          }

          if (definitions.length > 0) {
            entries.push({
              definitions,
              examples,
              types: [meaning.partOfSpeech || 'unknown'],
              phonetic: entry.phonetic || '',
              audio: entry.phonetics?.find((p: any) => p.audio)?.audio || ''
            });
          }
        }
      }

      const result = entries.length > 0 ? {
        word: entry.word || word,
        entries
      } : null;

      return result;

    } catch (error) {
      return null;
    }
  }





  private attachEventListeners(): void {
    if (!this.modal) return;

    // Close button
    const closeBtn = this.modal.querySelector('.vocab-srs-modal-close');
    closeBtn?.addEventListener('click', () => this.close());

    // Cancel button
    const cancelBtn = this.modal.querySelector('.vocab-srs-btn-cancel');
    cancelBtn?.addEventListener('click', () => this.close());

    // Save button
    const saveBtn = this.modal.querySelector('.vocab-srs-btn-save');
    saveBtn?.addEventListener('click', () => this.handleSave());

    // Tab buttons
    const tabBtns = this.modal.querySelectorAll('.vocab-srs-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tab = target.dataset.tab as 'lookup' | 'input';
        this.switchTab(tab);
      });
    });

    // Dictionary entry selection buttons (both compact and regular)
    const selectBtns = this.modal.querySelectorAll('.vocab-srs-dict-select-btn, .vocab-srs-dict-select-btn-compact');
    selectBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const entryEl = target.closest('.vocab-srs-dict-entry');
        if (entryEl) {
          const entryIndex = parseInt(entryEl.getAttribute('data-entry-index') || '0');
          if (this.lookupResults?.entries[entryIndex]) {
            this.selectDictionaryEntry(this.lookupResults.entries[entryIndex]);
          }
        }
      });
    });

    // Show more buttons for definitions and examples
    const showMoreBtns = this.modal.querySelectorAll('.vocab-srs-show-more');
    showMoreBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const type = target.dataset.type;
        const entryIndex = parseInt(target.dataset.entryIndex || '0');
        this.expandDictionarySection(type as 'definitions' | 'examples', entryIndex);
      });
    });

    // Audio play buttons
    const audioBtns = this.modal.querySelectorAll('.vocab-srs-play-audio, .vocab-srs-dict-audio');
    audioBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const audioUrl = target.dataset.audio || target.closest('[data-audio]')?.getAttribute('data-audio') || '';
        
        if (audioUrl.trim() !== '') {
          // Play from audio URL (no TTS fallback)
          this.playAudio(audioUrl);
        } else {
          // No audio URL, use TTS
          const wordInput = this.modal?.querySelector('#vocab-word') as HTMLInputElement;
          const word = this.lookupResults?.word || wordInput?.value || '';
          if (word) {
            this.playTextToSpeech(word);
          }
        }
      });
    });

    // ESC key to close
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', handleEscKey);

    // Click outside to close
    this.modal.querySelector('.vocab-srs-modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.close();
      }
    });

    // Auto-fetch phonetic when word is entered manually
    const wordInput = this.modal.querySelector('#vocab-word') as HTMLInputElement;
    if (wordInput && !this.selectedEntry) {
      let debounceTimer: number;
      wordInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => {
          this.fetchPhoneticForWord(wordInput.value.trim());
        }, 500);
      });
    }

    // Attach dropdown event listeners for show/hide input fields
    this.reattachInputEventListeners();
  }

  private updateModalContent(): void {
    if (!this.modal) return;
    
    // Update header with tabs
    const headerEl = this.modal.querySelector('.vocab-srs-modal-header');
    if (headerEl) {
      const hasResults = this.lookupResults && this.lookupResults.entries.length > 0;
      headerEl.innerHTML = `
        <div class="vocab-srs-tab-navigation">
          ${hasResults ? `
            <button class="vocab-srs-tab-btn ${this.currentTab === 'lookup' ? 'active' : ''}" data-tab="lookup">
              Dictionary Lookup
            </button>
          ` : ''}
          <button class="vocab-srs-tab-btn ${this.currentTab === 'input' || !hasResults ? 'active' : ''}" data-tab="input">
            ${hasResults ? 'Custom Entry' : 'Add to Dictionary'}
          </button>
        </div>
        <button class="vocab-srs-modal-close">&times;</button>
      `;
    }
    
    // Update body content
    const bodyEl = this.modal.querySelector('.vocab-srs-modal-body');
    if (bodyEl) {
      const hasResults = this.lookupResults && this.lookupResults.entries.length > 0;
      bodyEl.innerHTML = `
        ${hasResults ? this.getLookupTabHTML() : ''}
        ${this.getInputTabHTML()}
      `;
    }
    
    // Re-attach all event listeners
    this.attachEventListeners();
  }

  private switchTab(tab: 'lookup' | 'input'): void {
    this.currentTab = tab;
    
    if (!this.modal) return;

    // Update tab buttons
    const tabBtns = this.modal.querySelectorAll('.vocab-srs-tab-btn');
    tabBtns.forEach(btn => {
      const btnTab = (btn as HTMLElement).dataset.tab;
      btn.classList.toggle('active', btnTab === tab);
    });

    // Update tab content
    const tabContents = this.modal.querySelectorAll('.vocab-srs-tab-content');
    tabContents.forEach(content => {
      const contentTab = (content as HTMLElement).dataset.tab;
      (content as HTMLElement).style.display = contentTab === tab ? 'block' : 'none';
    });

    // If switching to input tab, ensure it has current content
    if (tab === 'input') {
      const inputTabContent = this.modal.querySelector('[data-tab="input"]');
      if (inputTabContent && this.selectedEntry) {
        // Only regenerate if we have a selected entry and content might be stale
        inputTabContent.innerHTML = this.getInputTabHTML().match(/<div class="vocab-srs-tab-content"[^>]*>(.*?)<\/div>$/s)?.[1] || '';
        this.reattachInputEventListeners();
      }
    }
    
    // If switching to lookup tab, ensure it's visible
    if (tab === 'lookup') {
      const lookupTabContent = this.modal.querySelector('[data-tab="lookup"]');
      if (!lookupTabContent && this.lookupResults) {
        // Regenerate lookup tab if it's missing
        this.updateModalContent();
        return;
      }
    }
  }

  private selectDictionaryEntry(entry: DictionaryEntry): void {
    this.selectedEntry = entry;
    this.selectedDefinitionIndex = 0;
    this.selectedExampleIndex = 0;
    
    // Switch to input tab with pre-filled data
    this.currentTab = 'input';
    this.updateModalContent();
  }

  private expandDictionarySection(type: 'definitions' | 'examples', entryIndex: number): void {
    if (!this.lookupResults || !this.lookupResults.entries[entryIndex]) return;
    
    const entry = this.lookupResults.entries[entryIndex];
    const entryEl = this.modal?.querySelector(`.vocab-srs-dict-entry[data-entry-index="${entryIndex}"]`);
    if (!entryEl) return;

    if (type === 'definitions' && entry.definitions) {
      const definitionsEl = entryEl.querySelector('.vocab-srs-definitions-list');
      if (definitionsEl) {
        // Remove the "show more" button
        const moreBtn = definitionsEl.querySelector('.vocab-srs-more-items');
        if (moreBtn) moreBtn.remove();
        
        // Add remaining definitions
        const maxDefinitions = 3;
        const remainingDefs = entry.definitions.slice(maxDefinitions);
        remainingDefs.forEach(def => {
          const li = document.createElement('li');
          li.className = 'vocab-srs-definition-item vocab-srs-expanded-item';
          li.textContent = def;
          definitionsEl.appendChild(li);
        });
        
        // Add collapse button
        const collapseBtn = document.createElement('li');
        collapseBtn.className = 'vocab-srs-more-items';
        collapseBtn.innerHTML = `<button class="vocab-srs-show-less" data-type="definitions" data-entry-index="${entryIndex}">Show less</button>`;
        definitionsEl.appendChild(collapseBtn);
        
        // Add event listener to collapse button
        const collapseBtnEl = collapseBtn.querySelector('.vocab-srs-show-less') as HTMLButtonElement;
        collapseBtnEl.addEventListener('click', () => {
          this.collapseDictionarySection('definitions', entryIndex);
        });
      }
    } else if (type === 'examples' && entry.examples) {
      const examplesEl = entryEl.querySelector('.vocab-srs-examples-list');
      if (examplesEl) {
        // Remove the "show more" button
        const moreBtn = examplesEl.querySelector('.vocab-srs-more-items');
        if (moreBtn) moreBtn.remove();
        
        // Add remaining examples
        const maxExamples = 2;
        const remainingExs = entry.examples.slice(maxExamples);
        remainingExs.forEach(ex => {
          const li = document.createElement('li');
          li.className = 'vocab-srs-example-item vocab-srs-expanded-item';
          li.textContent = `"${ex}"`;
          examplesEl.appendChild(li);
        });
        
        // Add collapse button
        const collapseBtn = document.createElement('li');
        collapseBtn.className = 'vocab-srs-more-items';
        collapseBtn.innerHTML = `<button class="vocab-srs-show-less" data-type="examples" data-entry-index="${entryIndex}">Show less</button>`;
        examplesEl.appendChild(collapseBtn);
        
        // Add event listener to collapse button
        const collapseBtnEl = collapseBtn.querySelector('.vocab-srs-show-less') as HTMLButtonElement;
        collapseBtnEl.addEventListener('click', () => {
          this.collapseDictionarySection('examples', entryIndex);
        });
      }
    }
  }

  private collapseDictionarySection(type: 'definitions' | 'examples', entryIndex: number): void {
    if (!this.lookupResults || !this.lookupResults.entries[entryIndex]) return;
    
    const entry = this.lookupResults.entries[entryIndex];
    const entryEl = this.modal?.querySelector(`.vocab-srs-dict-entry[data-entry-index="${entryIndex}"]`);
    if (!entryEl) return;

    if (type === 'definitions' && entry.definitions) {
      const definitionsEl = entryEl.querySelector('.vocab-srs-definitions-list');
      if (definitionsEl) {
        // Remove expanded items and collapse button
        const expandedItems = definitionsEl.querySelectorAll('.vocab-srs-expanded-item, .vocab-srs-more-items');
        expandedItems.forEach(item => item.remove());
        
        // Add back the "show more" button
        const maxDefinitions = 3;
        const hasMoreDefs = entry.definitions.length > maxDefinitions;
        if (hasMoreDefs) {
          const moreBtn = document.createElement('li');
          moreBtn.className = 'vocab-srs-more-items';
          moreBtn.innerHTML = `<button class="vocab-srs-show-more" data-type="definitions" data-entry-index="${entryIndex}">+${entry.definitions.length - maxDefinitions} more definitions</button>`;
          definitionsEl.appendChild(moreBtn);
          
          // Add event listener
          const showMoreBtnEl = moreBtn.querySelector('.vocab-srs-show-more') as HTMLButtonElement;
          showMoreBtnEl.addEventListener('click', () => {
            this.expandDictionarySection('definitions', entryIndex);
          });
        }
      }
    } else if (type === 'examples' && entry.examples) {
      const examplesEl = entryEl.querySelector('.vocab-srs-examples-list');
      if (examplesEl) {
        // Remove expanded items and collapse button
        const expandedItems = examplesEl.querySelectorAll('.vocab-srs-expanded-item, .vocab-srs-more-items');
        expandedItems.forEach(item => item.remove());
        
        // Add back the "show more" button
        const maxExamples = 2;
        const hasMoreExs = entry.examples.length > maxExamples;
        if (hasMoreExs) {
          const moreBtn = document.createElement('li');
          moreBtn.className = 'vocab-srs-more-items';
          moreBtn.innerHTML = `<button class="vocab-srs-show-more" data-type="examples" data-entry-index="${entryIndex}">+${entry.examples.length - maxExamples} more examples</button>`;
          examplesEl.appendChild(moreBtn);
          
          // Add event listener
          const showMoreBtnEl = moreBtn.querySelector('.vocab-srs-show-more') as HTMLButtonElement;
          showMoreBtnEl.addEventListener('click', () => {
            this.expandDictionarySection('examples', entryIndex);
          });
        }
      }
    }
  }

  private reattachInputEventListeners(): void {
    if (!this.modal) return;

    // Note: Audio button listeners are handled by main attachEventListeners method
    // No need to re-attach here to avoid duplicate listeners
    
    // However, ensure audio button has correct data-audio attribute
    if (this.selectedEntry?.audio) {
      const audioBtn = this.modal.querySelector('.vocab-srs-play-audio') as HTMLElement;
      if (audioBtn) {
        audioBtn.dataset.audio = this.selectedEntry.audio;
      }
    }

    // Re-attach dropdown change listeners
    const meaningSelect = this.modal.querySelector('#vocab-meaning-select') as HTMLSelectElement;
    const meaningInput = this.modal.querySelector('#vocab-meaning') as HTMLInputElement;
    const exampleSelect = this.modal.querySelector('#vocab-example-select') as HTMLSelectElement;
    const exampleInput = this.modal.querySelector('#vocab-example') as HTMLInputElement;

    // Always ensure meaning group is visible if no dropdown exists
    const meaningGroup = this.modal.querySelector('#vocab-meaning-group') as HTMLElement;
    if (!meaningSelect && meaningGroup) {
      meaningGroup.style.display = 'block';
    }

    // Always ensure example group is visible if no dropdown exists  
    const exampleGroup = this.modal.querySelector('#vocab-example-group') as HTMLElement;
    if (!exampleSelect && exampleGroup) {
      exampleGroup.style.display = 'block';
    }

    if (meaningSelect && meaningInput && meaningGroup) {
      meaningSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        if (target.value === 'custom') {
          meaningInput.value = '';
          meaningInput.placeholder = 'Enter custom meaning';
          meaningInput.readOnly = false;
          if (meaningGroup) {
            meaningGroup.style.display = 'block';
          }
          meaningInput.focus();
        } else if (target.value) {
          const index = parseInt(target.value);
          if (this.selectedEntry?.definitions && this.selectedEntry.definitions[index]) {
            meaningInput.value = this.selectedEntry.definitions[index];
            meaningInput.readOnly = true;
            this.selectedDefinitionIndex = index;
            if (meaningGroup) {
              meaningGroup.style.display = 'none';
            }
          }
        } else {
          if (meaningGroup) {
            meaningGroup.style.display = 'block';
          }
          meaningInput.readOnly = false;
        }
      });
    }

    if (exampleSelect && exampleInput && exampleGroup) {
      exampleSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        if (target.value === 'custom') {
          exampleInput.value = '';
          exampleInput.placeholder = 'Enter custom example';
          exampleInput.readOnly = false;
          if (exampleGroup) {
            exampleGroup.style.display = 'block';
          }
          exampleInput.focus();
        } else if (target.value) {
          const index = parseInt(target.value);
          if (this.selectedEntry?.examples && this.selectedEntry.examples[index]) {
            exampleInput.value = this.selectedEntry.examples[index];
            exampleInput.readOnly = true;
            this.selectedExampleIndex = index;
            if (exampleGroup) {
              exampleGroup.style.display = 'none';
            }
          }
        } else {
          if (exampleGroup) {
            exampleGroup.style.display = 'block';
          }
          exampleInput.readOnly = false;
        }
      });
    }
  }

  private async fetchPhoneticForWord(word: string): Promise<void> {
    if (!word) return;
    
    // Don't fetch if we already have phonetic and audio from selected entry
    if (this.selectedEntry && this.selectedEntry.phonetic && this.selectedEntry.audio) {
      return;
    }
    
    // Don't fetch if phonetic input already has a value (from selected entry)
    const phoneticInput = this.modal?.querySelector('#vocab-phonetic') as HTMLInputElement;
    if (phoneticInput?.value && phoneticInput.value.trim() !== '') {
      return;
    }

    // Show loading state
    if (phoneticInput) {
      phoneticInput.placeholder = 'Fetching phonetic...';
      phoneticInput.style.background = '#f3f4f6';
    }

    // Cascade phonetic fetching: Dictionary lookup → API → Fallback
    const result = await this.cascadePhoneticFetch(word);
    
    // Update UI with results
    this.updatePhoneticUI(result, word);
  }

  private async cascadePhoneticFetch(word: string): Promise<{phonetic?: string, audioUrl?: string, source: string}> {
    // 1. First try: Dictionary lookup (if we have lookupResults)
    if (this.lookupResults && this.lookupResults.entries.length > 0) {
      const result = this.extractPhoneticFromDictionary(word);
      if (result.phonetic || result.audioUrl) {
        return { ...result, source: 'dictionary' };
      }
    }
    
    // 2. Second try: DictionaryAPI.dev
    const apiResult = await this.fetchFromDictionaryAPI(word);
    if (apiResult.phonetic || apiResult.audioUrl) {
      return { ...apiResult, source: 'api' };
    }
    
    // 3. Last resort: Fallback phonetic + TTS
    const fallbackPhonetic = this.generateFallbackPhonetic(word);
    return { 
      phonetic: fallbackPhonetic, 
      audioUrl: undefined, // Will use TTS
      source: 'fallback' 
    };
  }

  private extractPhoneticFromDictionary(_word: string): {phonetic?: string, audioUrl?: string} {
    if (!this.lookupResults) return {};
    
    // Try to find phonetic and audio from current dictionary results
    // Prioritize entries with both phonetic and audio
    let bestEntry = null;
    let hasPhoneticOnly = null;
    let hasAudioOnly = null;
    
    for (const entry of this.lookupResults.entries) {
      if (entry.phonetic && entry.audio) {
        bestEntry = entry;
        break; // Found perfect match
      } else if (entry.phonetic && !hasPhoneticOnly) {
        hasPhoneticOnly = entry;
      } else if (entry.audio && !hasAudioOnly) {
        hasAudioOnly = entry;
      }
    }
    
    // Return best available option
    const selectedEntry = bestEntry || hasPhoneticOnly || hasAudioOnly;
    if (selectedEntry) {
      return {
        phonetic: selectedEntry.phonetic,
        audioUrl: selectedEntry.audio
      };
    }
    
    return {};
  }

  private async fetchFromDictionaryAPI(word: string): Promise<{phonetic?: string, audioUrl?: string}> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000);
      
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
        { 
          signal: controller.signal,
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        return {};
      }

      const data = await response.json();
      if (data?.[0]?.phonetics) {
        const phonetic = data[0].phonetics.find((p: any) => p.text && p.audio) || 
                        data[0].phonetics.find((p: any) => p.text) || 
                        data[0].phonetics.find((p: any) => p.audio);
        
        if (phonetic) {
          return {
            phonetic: phonetic.text,
            audioUrl: phonetic.audio
          };
        }
      }
      return {};
    } catch (error) {
      return {};
    }
  }

  private updatePhoneticUI(result: {phonetic?: string, audioUrl?: string, source: string}, word: string): void {
    const phoneticInput = this.modal?.querySelector('#vocab-phonetic') as HTMLInputElement;
    const audioBtn = this.modal?.querySelector('.vocab-srs-play-audio') as HTMLElement;
    
    if (phoneticInput) {
      phoneticInput.style.background = '';
      phoneticInput.placeholder = 'Phonetic transcription';
      
      if (result.phonetic) {
        phoneticInput.value = result.phonetic;
        phoneticInput.readOnly = false;
      } else {
        phoneticInput.value = this.generateFallbackPhonetic(word);
        phoneticInput.readOnly = false;
      }
    }
    
    if (audioBtn && result.audioUrl) {
      audioBtn.dataset.audio = result.audioUrl;
    } else if (audioBtn) {
      // Clear audio URL for TTS fallback
      audioBtn.removeAttribute('data-audio');
    }
  }

  private generateFallbackPhonetic(word: string): string {
    if (!word || word.trim() === '') return '';
    
    const cleanWord = word.toLowerCase().trim();
    
    // Simple phonetic rules for common patterns
    let phonetic = cleanWord;
    
    // Common vowel patterns
    phonetic = phonetic.replace(/ough/g, 'ʌf');
    phonetic = phonetic.replace(/through/g, 'θru');
    phonetic = phonetic.replace(/thought/g, 'θɔt');
    phonetic = phonetic.replace(/ea/g, 'i');
    phonetic = phonetic.replace(/ee/g, 'i');
    phonetic = phonetic.replace(/oo/g, 'u');
    phonetic = phonetic.replace(/ou/g, 'aʊ');
    phonetic = phonetic.replace(/ow/g, 'oʊ');
    phonetic = phonetic.replace(/ay/g, 'eɪ');
    phonetic = phonetic.replace(/ai/g, 'eɪ');
    phonetic = phonetic.replace(/ey/g, 'eɪ');
    phonetic = phonetic.replace(/ie/g, 'aɪ');
    phonetic = phonetic.replace(/igh/g, 'aɪ');
    phonetic = phonetic.replace(/y$/g, 'i');
    
    // Common consonant patterns
    phonetic = phonetic.replace(/ch/g, 'tʃ');
    phonetic = phonetic.replace(/sh/g, 'ʃ');
    phonetic = phonetic.replace(/th/g, 'θ');
    phonetic = phonetic.replace(/ph/g, 'f');
    phonetic = phonetic.replace(/gh/g, '');
    phonetic = phonetic.replace(/ck/g, 'k');
    phonetic = phonetic.replace(/qu/g, 'kw');
    phonetic = phonetic.replace(/x/g, 'ks');
    
    // Handle silent letters
    phonetic = phonetic.replace(/^kn/g, 'n');
    phonetic = phonetic.replace(/^wr/g, 'r');
    phonetic = phonetic.replace(/mb$/g, 'm');
    phonetic = phonetic.replace(/^ps/g, 's');
    
    // Single vowels in stressed position
    phonetic = phonetic.replace(/a([^aeiou])/g, 'æ$1');
    phonetic = phonetic.replace(/e([^aeiou])/g, 'ɛ$1');
    phonetic = phonetic.replace(/i([^aeiou])/g, 'ɪ$1');
    phonetic = phonetic.replace(/o([^aeiou])/g, 'ɒ$1');
    phonetic = phonetic.replace(/u([^aeiou])/g, 'ʌ$1');
    
    // Wrap in IPA brackets
    return `/${phonetic}/`;
  }

  private smartTruncate(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    
    // Try to truncate at word boundary
    const truncatedAtWord = text.substring(0, maxLength);
    const lastSpaceIndex = truncatedAtWord.lastIndexOf(' ');
    
    // If we can find a space near the end, truncate there
    if (lastSpaceIndex > maxLength * 0.7) {
      return truncatedAtWord.substring(0, lastSpaceIndex) + '...';
    }
    
    // Otherwise, truncate at character boundary but avoid cutting in the middle of a word
    let truncateIndex = maxLength - 3; // Leave space for '...'
    while (truncateIndex > 0 && text[truncateIndex] !== ' ' && /[a-zA-Z]/.test(text[truncateIndex])) {
      truncateIndex--;
    }
    
    // If we couldn't find a good spot, just truncate at max length
    if (truncateIndex <= maxLength * 0.5) {
      truncateIndex = maxLength - 3;
    }
    
    return text.substring(0, truncateIndex).trim() + '...';
  }

  private playAudio(audioUrl: string): void {
    if (!audioUrl || audioUrl.trim() === '') {
      // Only use TTS if no audioUrl is provided
      const wordInput = this.modal?.querySelector('#vocab-word') as HTMLInputElement;
      if (wordInput?.value) {
        this.playTextToSpeech(wordInput.value);
      }
      return;
    }

    try {

      const audio = new Audio(audioUrl);
      audio.play().catch((error) => {
        console.warn('Audio playback failed:', error);
        // Do NOT fallback to TTS when we have audioUrl - just fail silently
        // User can manually use TTS if needed
      });
    } catch (error) {
      console.debug('Audio initialization failed:', error);
    }
  }

  private playTextToSpeech(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  }

  private async handleSave(): Promise<void> {
    if (!this.modal) return;

    // Prevent multiple calls
    const saveBtn = this.modal.querySelector('.vocab-srs-btn-save') as HTMLButtonElement;
    if (saveBtn?.disabled) {
      return;
    }

    // Get form data from input tab
    const wordInput = this.modal.querySelector('#vocab-word') as HTMLInputElement;
    const meaningInput = this.modal.querySelector('#vocab-meaning') as HTMLInputElement;
    const phoneticInput = this.modal.querySelector('#vocab-phonetic') as HTMLInputElement;
    const wordTypeSelect = this.modal.querySelector('#vocab-word-type') as HTMLSelectElement;
    const exampleInput = this.modal.querySelector('#vocab-example') as HTMLInputElement;

    // Validate required fields
    if (!wordInput?.value?.trim()) {
      this.showValidationError('Word is required');
      wordInput?.focus();
      return;
    }

    if (!meaningInput?.value?.trim()) {
      this.showValidationError('Meaning is required');
      meaningInput?.focus();
      return;
    }

    if (!phoneticInput?.value?.trim()) {
      this.showValidationError('Phonetic is required');
      phoneticInput?.focus();
      return;
    }

    if (!wordTypeSelect?.value) {
      this.showValidationError('Word type is required');
      wordTypeSelect?.focus();
      return;
    }

    // Set loading state immediately after validation to prevent duplicate calls
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    // Get audio URL from selected entry or audio button
    const audioBtn = this.modal.querySelector('.vocab-srs-play-audio') as HTMLElement;
    const audioUrl = audioBtn?.dataset?.audio || this.selectedEntry?.audio || '';

    // Create word data object
    const wordData: WordData = {
      word: wordInput.value.trim(),
      meaning: meaningInput.value.trim(),
      phonetic: phoneticInput.value.trim(),
      wordType: wordTypeSelect.value,
      example: exampleInput?.value?.trim() || undefined,
      audioUrl: audioUrl || undefined
    };

    // Call save callback
    try {
      console.log('Dictionary Modal: Calling onSave with data:', wordData);
      
      // Await the callback (handles both sync and async)
      await this.options.onSave(wordData);
      
      console.log('Dictionary Modal: Save completed successfully');
      this.close();
    } catch (error) {
      console.error('Dictionary Modal: Save failed:', error);
      this.showValidationError('Failed to save word. Please try again.');
      
      // Reset button state
      const saveBtn = this.modal.querySelector('.vocab-srs-btn-save') as HTMLButtonElement;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save to Dictionary';
      }
    }
  }

  private showValidationError(message: string): void {
    // Remove existing error message
    const existingError = this.modal?.querySelector('.vocab-srs-validation-error');
    if (existingError) {
      existingError.remove();
    }

    // Create new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'vocab-srs-validation-error';
    errorDiv.textContent = message;

    // Insert error message before modal footer
    const footer = this.modal?.querySelector('.vocab-srs-modal-footer');
    if (footer) {
      footer.parentNode?.insertBefore(errorDiv, footer);
    }

    // Auto remove error after 3 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }

  private close(): void {
    this.options.onClose();
    this.destroy();
  }

  private destroy(): void {
    if (this.modal) {
      this.modal.classList.remove('vocab-srs-modal-show');
      setTimeout(() => {
        if (this.modal && this.modal.parentNode) {
          this.modal.parentNode.removeChild(this.modal);
        }
        this.modal = null;
      }, 300);
    }
  }

  private autoPlayWordAudio(word: string): void {

    
    // Small delay to ensure UI is ready
    setTimeout(() => {
      let audioPlayed = false;
      
      // Try to find audio from dictionary entries first
      if (this.lookupResults?.entries) {
        for (const entry of this.lookupResults.entries) {
          if (entry.audio) {

            this.playAudio(entry.audio);
            audioPlayed = true;
            break;
          }
        }
      }
      
      // If no audio from dictionary, try audio button in input tab
      if (!audioPlayed) {
        const audioBtn = this.modal?.querySelector('.vocab-srs-play-audio') as HTMLElement;
        const audioUrl = audioBtn?.dataset?.audio;
        
        if (audioUrl && audioUrl.trim() !== '') {

          this.playAudio(audioUrl);
          audioPlayed = true;
        }
      }
      
      // Fallback to TTS if no audio URL available
      if (!audioPlayed) {
        this.playTextToSpeech(word);
      }
    }, 500); // 500ms delay to ensure audio elements are ready
  }

  private addStyles(): void {
    const styleId = 'vocab-srs-dictionary-modal-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Dictionary Modal Specific Styles */
      .vocab-srs-dictionary-modal-content {
        max-width: 700px !important;
        max-height: 85vh !important;
        animation: vocab-srs-modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      
      @keyframes vocab-srs-modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      /* Tab Navigation */
      .vocab-srs-tab-navigation {
        display: flex !important;
        gap: 4px !important;
        background: #f1f5f9 !important;
        padding: 4px !important;
        border-radius: 12px !important;
      }
      
      .vocab-srs-tab-btn {
        padding: 10px 20px !important;
        border: none !important;
        background: transparent !important;
        border-radius: 8px !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.3s ease !important;
        color: #64748b !important;
        position: relative !important;
        white-space: nowrap !important;
      }
      
      .vocab-srs-tab-btn.active {
        background: white !important;
        color: #22c55e !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        transform: translateY(-1px) !important;
      }
      
      .vocab-srs-tab-btn:hover:not(.active) {
        background: rgba(255, 255, 255, 0.7) !important;
        color: #475569 !important;
        transform: translateY(-0.5px) !important;
      }
      
      /* Loading State */
      .vocab-srs-loading {
        text-align: center !important;
        padding: 40px 20px !important;
      }
      
      .vocab-srs-spinner {
        width: 40px !important;
        height: 40px !important;
        border: 4px solid #f3f4f6 !important;
        border-top: 4px solid #22c55e !important;
        border-radius: 50% !important;
        animation: vocab-srs-spin 1s linear infinite !important;
        margin: 0 auto 16px !important;
      }
      
      @keyframes vocab-srs-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* Dictionary Entries */
      .vocab-srs-result-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: baseline !important;
        margin-bottom: 24px !important;
        padding-bottom: 12px !important;
        border-bottom: 2px solid #e5e7eb !important;
      }
      
      .vocab-srs-result-header h3 {
        margin: 0 !important;
        color: #111827 !important;
        font-size: 20px !important;
        font-weight: 700 !important;
      }
      
      .vocab-srs-result-count {
        color: #6b7280 !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        background: #f3f4f6 !important;
        padding: 4px 12px !important;
        border-radius: 12px !important;
      }
      
      .vocab-srs-dict-entries {
        max-height: 450px !important;
        overflow-y: auto !important;
        gap: 20px !important;
        display: flex !important;
        flex-direction: column !important;
        padding-right: 4px !important;
      }
      
      .vocab-srs-dict-entry {
        border: 2px solid #e5e7eb !important;
        border-radius: 16px !important;
        padding: 20px !important;
        background: white !important;
        transition: all 0.3s ease !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04) !important;
      }
      
      .vocab-srs-dict-entry:hover {
        border-color: #22c55e !important;
        background: #f8fafc !important;
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.1) !important;
        transform: translateY(-1px) !important;
      }
      
      .vocab-srs-dict-entry.selected {
        border-color: #22c55e !important;
        background: #f0fdf4 !important;
        box-shadow: 0 4px 16px rgba(34, 197, 94, 0.15) !important;
      }
      
      .vocab-srs-dict-entry-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        margin-bottom: 16px !important;
        padding-bottom: 12px !important;
        border-bottom: 1px solid #f1f5f9 !important;
      }
      
      .vocab-srs-dict-word-info {
        display: flex !important;
        flex-direction: column !important;
        gap: 4px !important;
      }
      
      .vocab-srs-dict-word {
        font-size: 22px !important;
        font-weight: 700 !important;
        color: #111827 !important;
        line-height: 1.2 !important;
      }
      
      .vocab-srs-dict-phonetic {
        font-family: 'Courier New', monospace !important;
        color: #6b7280 !important;
        font-size: 15px !important;
        background: #f8fafc !important;
        padding: 2px 8px !important;
        border-radius: 6px !important;
        align-self: flex-start !important;
      }
      
      .vocab-srs-dict-actions {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      
      .vocab-srs-dict-audio {
        background: linear-gradient(135deg, #3b82f6, #1e40af) !important;
        color: white !important;
        border: none !important;
        font-size: 14px !important;
        cursor: pointer !important;
        padding: 6px 8px !important;
        border-radius: 8px !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
      }
      
      .vocab-srs-dict-audio:hover {
        background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3) !important;
      }
      
      .vocab-srs-dict-select-btn-compact {
        background: linear-gradient(135deg, #22c55e, #16a34a) !important;
        color: white !important;
        border: none !important;
        padding: 6px 16px !important;
        border-radius: 8px !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 2px 4px rgba(34, 197, 94, 0.2) !important;
      }
      
      .vocab-srs-dict-select-btn-compact:hover {
        background: linear-gradient(135deg, #16a34a, #15803d) !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 8px rgba(34, 197, 94, 0.3) !important;
      }
      
      .vocab-srs-dict-types {
        display: flex !important;
        gap: 8px !important;
        margin-bottom: 16px !important;
        flex-wrap: wrap !important;
      }
      
      .vocab-srs-dict-type {
        background: linear-gradient(135deg, #ddd6fe, #c4b5fd) !important;
        color: #6b21a8 !important;
        padding: 4px 12px !important;
        border-radius: 16px !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        text-transform: capitalize !important;
        box-shadow: 0 2px 4px rgba(139, 69, 19, 0.1) !important;
      }
      
      .vocab-srs-section-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        margin-bottom: 12px !important;
      }
      
      .vocab-srs-section-header h4 {
        margin: 0 !important;
        font-size: 15px !important;
        font-weight: 700 !important;
        color: #374151 !important;
      }
      
      .vocab-srs-count-badge {
        background: #22c55e !important;
        color: white !important;
        padding: 2px 8px !important;
        border-radius: 10px !important;
        font-size: 11px !important;
        font-weight: 600 !important;
      }
      
      .vocab-srs-definitions-list,
      .vocab-srs-examples-list {
        margin: 0 !important;
        padding-left: 0 !important;
        list-style: none !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
      }
      
      .vocab-srs-definition-item {
        background: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
        border-left: 4px solid #3b82f6 !important;
        padding: 12px 16px 12px 40px !important;
        border-radius: 8px !important;
        color: #374151 !important;
        line-height: 1.5 !important;
        font-size: 14px !important;
        position: relative !important;
      }
      
      .vocab-srs-definition-item::before {
        content: "•" !important;
        position: absolute !important;
        left: 16px !important;
        top: 12px !important;
        color: #3b82f6 !important;
        font-size: 16px !important;
        font-weight: bold !important;
        line-height: 1.5 !important;
      }
      
      .vocab-srs-example-item {
        background: #f0fdf4 !important;
        border: 1px solid #bbf7d0 !important;
        border-left: 4px solid #22c55e !important;
        padding: 12px 16px !important;
        border-radius: 8px !important;
        color: #374151 !important;
        line-height: 1.5 !important;
        font-size: 14px !important;
        font-style: italic !important;
        position: relative !important;
      }
      
      .vocab-srs-example-item::before {
        content: '"' !important;
        position: absolute !important;
        left: -8px !important;
        top: 8px !important;
        font-size: 24px !important;
        color: #22c55e !important;
        font-weight: bold !important;
        line-height: 1 !important;
      }
      
      .vocab-srs-dict-definitions,
      .vocab-srs-dict-examples {
        margin-bottom: 16px !important;
        position: relative !important;
        padding-left: 0 !important;
      }
      
      .vocab-srs-more-items {
        margin: 8px 0 0 0 !important;
        padding: 0 !important;
        list-style: none !important;
      }
      
      .vocab-srs-show-more,
      .vocab-srs-show-less {
        background: linear-gradient(135deg, #f59e0b, #d97706) !important;
        color: white !important;
        border: none !important;
        padding: 6px 16px !important;
        border-radius: 20px !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2) !important;
      }
      
      .vocab-srs-show-more:hover,
      .vocab-srs-show-less:hover {
        background: linear-gradient(135deg, #d97706, #b45309) !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3) !important;
      }
      
      .vocab-srs-expanded-item {
        animation: vocab-srs-fadeIn 0.3s ease-in-out !important;
      }
      
      @keyframes vocab-srs-fadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .vocab-srs-dict-select-btn {
        background: linear-gradient(135deg, #22c55e, #16a34a) !important;
        color: white !important;
        border: none !important;
        padding: 8px 16px !important;
        border-radius: 8px !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        margin-top: 12px !important;
      }
      
      .vocab-srs-dict-select-btn:hover {
        background: linear-gradient(135deg, #16a34a, #15803d) !important;
        transform: translateY(-1px) !important;
      }
      
      /* Custom Entry Form Styles */
      .vocab-srs-form-group select {
        width: 100% !important;
        padding: 12px 40px 12px 16px !important;
        border: 2px solid #e5e7eb !important;
        border-radius: 10px !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
        transition: all 0.2s ease !important;
        background: white url("data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>") no-repeat right 12px center !important;
        background-size: 16px 16px !important;
        color: #374151 !important;
        font-family: inherit !important;
        box-sizing: border-box !important;
        cursor: pointer !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
      }
      
      .vocab-srs-form-group select:focus {
        outline: none !important;
        border-color: #22c55e !important;
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1) !important;
      }

      .vocab-srs-form-group select option {
        padding: 8px 12px !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        max-width: 100% !important;
      }
      
      .vocab-srs-form-group input[readonly] {
        background: #f9fafb !important;
        cursor: default !important;
        border-color: #d1d5db !important;
      }
      
      /* Phonetic Group Layout */
      .vocab-srs-phonetic-group {
        display: flex !important;
        gap: 8px !important;
        align-items: center !important;
      }
      
      .vocab-srs-phonetic-group input {
        flex: 1 !important;
        margin: 0 !important;
      }
      
      .vocab-srs-play-audio {
        background: white !important;
        color: #374151 !important;
        border: 2px solid #e5e7eb !important;
        padding: 12px !important;
        border-radius: 10px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-width: 44px !important;
        height: 44px !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
      }
      
      .vocab-srs-play-audio:hover {
        background: #f8fafc !important;
        border-color: #d1d5db !important;
        color: #22c55e !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
      }
      
      .vocab-srs-play-audio:active {
        transform: translateY(0) !important;
      }
      
      /* Selected Entry Info */
      .vocab-srs-selected-entry-info {
        background: #ecfdf5 !important;
        border: 1px solid #bbf7d0 !important;
        border-radius: 8px !important;
        padding: 12px !important;
        margin-top: 16px !important;
      }
      
      .vocab-srs-selected-entry-info small {
        color: #059669 !important;
        font-weight: 500 !important;
      }
      
      /* Loading, Error, and Not Found States */
      .vocab-srs-loading,
      .vocab-srs-error,
      .vocab-srs-not-found {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 40px 20px !important;
        text-align: center !important;
        min-height: 200px !important;
      }
      
      .vocab-srs-spinner {
        width: 40px !important;
        height: 40px !important;
        border: 4px solid #e5e7eb !important;
        border-top: 4px solid #22c55e !important;
        border-radius: 50% !important;
        animation: vocab-srs-spin 1s linear infinite !important;
        margin-bottom: 16px !important;
      }
      
      @keyframes vocab-srs-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .vocab-srs-loading p,
      .vocab-srs-error p,
      .vocab-srs-not-found p {
        font-size: 16px !important;
        font-weight: 500 !important;
        color: #374151 !important;
        margin: 0 0 8px 0 !important;
      }
      
      .vocab-srs-loading small,
      .vocab-srs-error small,
      .vocab-srs-not-found small {
        font-size: 14px !important;
        color: #6b7280 !important;
        margin: 0 !important;
      }
      
      .vocab-srs-error-icon,
      .vocab-srs-not-found-icon {
        font-size: 48px !important;
        margin-bottom: 16px !important;
      }
      
      .vocab-srs-error p {
        color: #dc2626 !important;
      }
      
      .vocab-srs-not-found p {
        color: #f59e0b !important;
      }
      
      /* Modal Footer */
      .vocab-srs-modal-footer {
        display: flex !important;
        gap: 12px !important;
        justify-content: flex-end !important;
        padding: 20px 28px !important;
        border-top: 1px solid #e5e7eb !important;
        background: #fafafa !important;
        border-radius: 0 0 16px 16px !important;
      }
      
      /* Buttons */
      .vocab-srs-btn-cancel {
        background: white !important;
        color: #6b7280 !important;
        border: 2px solid #e5e7eb !important;
        padding: 12px 24px !important;
        border-radius: 10px !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        min-width: 100px !important;
      }
      
      .vocab-srs-btn-cancel:hover {
        background: #f3f4f6 !important;
        border-color: #d1d5db !important;
        color: #374151 !important;
        transform: translateY(-1px) !important;
      }
      
      .vocab-srs-btn-save {
        background: linear-gradient(135deg, #22c55e, #16a34a) !important;
        color: white !important;
        border: 2px solid #22c55e !important;
        padding: 12px 24px !important;
        border-radius: 10px !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        min-width: 100px !important;
        margin-left: 12px !important;
      }
      
      .vocab-srs-btn-save:hover {
        background: linear-gradient(135deg, #34d399, #22c55e) !important;
        border-color: #34d399 !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3) !important;
      }
      
      .vocab-srs-btn-save:active {
        transform: translateY(0) !important;
      }
      
      .vocab-srs-btn-save:disabled {
        background: #9ca3af !important;
        border-color: #9ca3af !important;
        cursor: not-allowed !important;
        transform: none !important;
        box-shadow: none !important;
        opacity: 0.6 !important;
      }
      
      /* Validation Error */
      .vocab-srs-validation-error {
        background: linear-gradient(135deg, #fef2f2, #fee2e2) !important;
        color: #dc2626 !important;
        border: 2px solid #ef4444 !important;
        border-radius: 10px !important;
        padding: 12px 16px !important;
        margin: 16px 28px !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      
      .vocab-srs-validation-error:before {
        content: "⚠️" !important;
        font-size: 16px !important;
      }

      
      /* Fixed Modal Height */
      .vocab-srs-dictionary-modal-content {
        min-height: 500px !important;
        max-height: 90vh !important;
        display: flex !important;
        flex-direction: column !important;
      }
      
      .vocab-srs-modal-body {
        flex: 1 !important;
        overflow-y: auto !important;
        min-height: 0 !important;
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .vocab-srs-tab-navigation {
          background: #374151 !important;
        }
        
        .vocab-srs-tab-btn {
          color: #d1d5db !important;
        }
        
        .vocab-srs-tab-btn.active {
          background: #1f2937 !important;
          color: #22c55e !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
        }
        
        .vocab-srs-tab-btn:hover:not(.active) {
          background: rgba(31, 41, 55, 0.7) !important;
          color: #f1f5f9 !important;
        }
        
        .vocab-srs-modal-footer {
          background: #1f2937 !important;
          border-top-color: #374151 !important;
        }
        
        .vocab-srs-btn-cancel {
          background: #374151 !important;
          color: #d1d5db !important;
          border-color: #4b5563 !important;
        }
        
        .vocab-srs-btn-cancel:hover {
          background: #4b5563 !important;
          border-color: #6b7280 !important;
          color: #f1f5f9 !important;
        }
        
        .vocab-srs-btn-save {
          background: linear-gradient(135deg, #059669, #047857) !important;
          border-color: #059669 !important;
        }
        
        .vocab-srs-btn-save:hover {
          background: linear-gradient(135deg, #10b981, #059669) !important;
          border-color: #10b981 !important;
          box-shadow: 0 4px 20px rgba(5, 150, 105, 0.4) !important;
        }
        
        .vocab-srs-btn-save:disabled {
          background: #4b5563 !important;
          border-color: #4b5563 !important;
          cursor: not-allowed !important;
          transform: none !important;
          box-shadow: none !important;
          opacity: 0.5 !important;
        }
        
        .vocab-srs-validation-error {
          background: linear-gradient(135deg, #431c1e, #4c1d1f) !important;
          color: #f87171 !important;
          border-color: #dc2626 !important;
        }
        
        .vocab-srs-play-audio {
          background: #374151 !important;
          color: #d1d5db !important;
          border-color: #4b5563 !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
        }
        
        .vocab-srs-play-audio:hover {
          background: #4b5563 !important;
          border-color: #6b7280 !important;
          color: #10b981 !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4) !important;
        }
        
        .vocab-srs-result-header h3 {
          color: #f9fafb !important;
        }
        
        .vocab-srs-result-header {
          border-bottom-color: #4b5563 !important;
        }
        
        .vocab-srs-result-count {
          background: #4b5563 !important;
          color: #d1d5db !important;
        }
        
        .vocab-srs-dict-entry {
          background: #374151 !important;
          border-color: #4b5563 !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
        }
        
        .vocab-srs-dict-entry:hover {
          background: #4b5563 !important;
          border-color: #22c55e !important;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2) !important;
        }
        
        .vocab-srs-dict-entry.selected {
          background: #064e3b !important;
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.25) !important;
        }
        
        .vocab-srs-dict-entry-header {
          border-bottom-color: #4b5563 !important;
        }
        
        .vocab-srs-dict-word {
          color: #f9fafb !important;
        }
        
        .vocab-srs-dict-phonetic {
          color: #9ca3af !important;
          background: #4b5563 !important;
        }
        
        .vocab-srs-dict-type {
          background: linear-gradient(135deg, #4c1d95, #5b21b6) !important;
          color: #e9d5ff !important;
        }
        
        .vocab-srs-section-header h4 {
          color: #d1d5db !important;
        }
        
        .vocab-srs-definition-item {
          background: #4b5563 !important;
          border-color: #6b7280 !important;
          color: #e5e7eb !important;
        }
        
        .vocab-srs-definition-item::before {
          color: #60a5fa !important;
        }
        
        .vocab-srs-example-item {
          background: #065f46 !important;
          border-color: #059669 !important;
          color: #d1fae5 !important;
        }
        
        .vocab-srs-example-item::before {
          color: #34d399 !important;
        }
        
        .vocab-srs-dict-audio {
          background: linear-gradient(135deg, #1e40af, #1e3a8a) !important;
          box-shadow: 0 2px 4px rgba(30, 64, 175, 0.3) !important;
        }
        
        .vocab-srs-dict-audio:hover {
          background: linear-gradient(135deg, #1d4ed8, #1e40af) !important;
          box-shadow: 0 4px 8px rgba(30, 64, 175, 0.4) !important;
        }
        
        .vocab-srs-dict-select-btn-compact {
          background: linear-gradient(135deg, #16a34a, #15803d) !important;
          box-shadow: 0 2px 4px rgba(22, 163, 74, 0.3) !important;
        }
        
        .vocab-srs-dict-select-btn-compact:hover {
          background: linear-gradient(135deg, #15803d, #166534) !important;
          box-shadow: 0 4px 8px rgba(22, 163, 74, 0.4) !important;
        }
        
        .vocab-srs-form-group select {
          background: #374151 url("data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>") no-repeat right 12px center !important;
          background-size: 16px 16px !important;
          border-color: #4b5563 !important;
          color: #d1d5db !important;
        }

        .vocab-srs-form-group select option {
          background: #374151 !important;
          color: #d1d5db !important;
        }
        
        .vocab-srs-form-group input[readonly] {
          background: #374151 !important;
          border-color: #4b5563 !important;
          color: #9ca3af !important;
        }
        
        .vocab-srs-dict-definitions h4,
        .vocab-srs-dict-examples h4 {
          color: #d1d5db !important;
        }
        
        .vocab-srs-dict-definitions li,
        .vocab-srs-dict-examples li {
          color: #d1d5db !important;
        }
        
        .vocab-srs-selected-entry-info {
          background: #064e3b !important;
          border-color: #059669 !important;
        }
        
        .vocab-srs-selected-entry-info small {
          color: #34d399 !important;
        }
        
        /* Dark mode loading states */
        .vocab-srs-spinner {
          border-color: #4b5563 !important;
          border-top-color: #34d399 !important;
        }
        
        .vocab-srs-loading p,
        .vocab-srs-error p,
        .vocab-srs-not-found p {
          color: #d1d5db !important;
        }
        
        .vocab-srs-loading small,
        .vocab-srs-error small,
        .vocab-srs-not-found small {
          color: #9ca3af !important;
        }
        
        .vocab-srs-error p {
          color: #f87171 !important;
        }
        
        .vocab-srs-not-found p {
          color: #fbbf24 !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}