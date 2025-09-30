import React, { useState, useEffect } from 'react';
import { useChromeStorage } from '@/hooks/useChromeStorage';
import { useChromeMessages } from '@/hooks/useChromeMessages';
import { useTheme } from '@/utils/theme';
import {
  getDueWords,
  getFilteredWords,
  playWordPronunciation,
  createExportData,
  generateExportFilename,
  downloadJsonFile,
  processDataImport,
  createFileInput,
  toggleWordHighlightingGlobally,
  openExtensionPage,
  calculateLearningStats,
  formatDateForDisplay,
  getReviewStatusColor,
  debounce
} from './utils';
import { 
  BookOpen, 
  Play, 
  BarChart3, 
  Settings, 
  Upload, 
  Download,
  ArrowLeft,
  Volume2,
  Search,
  Trophy,
  Zap,
  Target,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { Moon, Sun } from 'lucide-react';

const Popup: React.FC = () => {
  const { data, loading, error, updateSettings, saveData } = useChromeStorage();
  const { showSuccessMessage, showErrorMessage } = useChromeMessages();
  const { isDark, toggleTheme } = useTheme();
  
  const [currentScreen, setCurrentScreen] = useState<'main' | 'wordList'>('main');
  const [wordHighlightingEnabled, setWordHighlightingEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Load settings on component mount
  useEffect(() => {
    if (data?.settings) {
      setWordHighlightingEnabled(data.settings.notifications); // Using notifications as proxy for word highlighting
    }
  }, [data?.settings]);

  // Debounced search effect
  useEffect(() => {
    const debouncedSearch = debounce((term: string) => {
      setDebouncedSearchTerm(term);
    }, 300);

    debouncedSearch(searchTerm);
  }, [searchTerm]);

  // Helper functions using utils
  const getCurrentDueWords = () => getDueWords(data?.vocabWords || []);
  const getCurrentFilteredWords = () => getFilteredWords(data?.vocabWords || [], debouncedSearchTerm);
  const getStats = () => calculateLearningStats(data);




  // Toggle word highlighting feature
  const toggleWordHighlighting = async () => {
    const newValue = !wordHighlightingEnabled;
    setWordHighlightingEnabled(newValue);
    await updateSettings({ notifications: newValue });
    
    // Use utils function to broadcast to all tabs
    try {
      await toggleWordHighlightingGlobally(newValue);
    } catch (error) {
      console.error('Failed to update content scripts:', error);
    }
  };

  // Play audio pronunciation
  const playAudio = async (word: string) => {
    try {
      await playWordPronunciation(word, data?.vocabWords || []);
    } catch (error) {
      console.error('Failed to play pronunciation:', error);
    }
  };

  // Export data
  const handleExportData = () => {
    if (!data) return;
    
    const exportData = createExportData(data);
    const filename = generateExportFilename();
    downloadJsonFile(exportData, filename);
  };

  // Import data
  const handleImportData = async () => {
    try {
      const files = await createFileInput('.json', false);
      if (!files || files.length === 0) return;
      
      const file = files[0];
      const result = await processDataImport(file, data);
      
      if (result.success && result.data) {
        // Confirm import
        const confirmed = confirm(
          `This will import ${result.wordCount} words and replace your current data. Are you sure?`
        );
        
        if (confirmed) {
          await saveData(result.data);
          await showSuccessMessage('Data imported successfully!');
          setTimeout(() => window.location.reload(), 1000);
        }
      } else {
        await showErrorMessage(result.error || 'Failed to import data. Please check the file format.');
      }
    } catch (error) {
      console.error('Import failed:', error);
      await showErrorMessage('Failed to import data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 dark:from-dark-background dark:to-dark-background-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-foreground-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 dark:from-dark-background dark:to-dark-background-secondary">
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-sm text-danger-600 dark:text-danger-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-secondary btn-sm hover-scale focus-ring"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const dueWords = getCurrentDueWords();
  
  return (
    <div className="w-full h-full max-w-[400px] max-h-[600px] bg-background dark:bg-dark-background flex flex-col">
      {/* Header */}
      <div className="gradient-green p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2 text-white">
              <BookOpen className="w-5 h-5" />
              VocaPi
            </h1>
            <p className="text-sm text-white/90">Spaced Repetition Learning</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-white/20"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-white" />
              ) : (
                <Moon className="w-4 h-4 text-white" />
              )}
            </button>
            <button 
              onClick={toggleWordHighlighting}
              className={`p-2 rounded-lg transition-all duration-200 ${
                wordHighlightingEnabled 
                  ? 'bg-white/20 hover:bg-white/30 shadow-soft' 
                  : 'hover:bg-white/20'
              }`}
              title={wordHighlightingEnabled ? "Disable word highlighting" : "Enable word highlighting"}
            >
              {wordHighlightingEnabled ? (
                <Eye className="w-4 h-4 text-white" />
              ) : (
                <EyeOff className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Screen */}
      {currentScreen === 'main' && (
        <div className="flex-1 p-4 space-y-4">
          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4 text-center hover-lift">
              <div className="text-2xl font-bold text-gradient-green">
                {data?.vocabWords.length || 0}
              </div>
              <div className="text-xs text-foreground-muted">Total Words</div>
            </div>
            <div className="card p-4 text-center bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20 border-warning-200 dark:border-warning-700 hover-lift">
              <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                {dueWords.length}
              </div>
              <div className="text-xs text-foreground-muted">Due Now</div>
            </div>
          </div>

          {/* Gamification Widget */}
          <div className="card p-4 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-primary-200 dark:border-primary-700 hover-lift">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-foreground-muted">Level:</span>
                <span className="font-semibold text-foreground">{getStats().level}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary-500" />
                <span className="text-foreground-muted">XP:</span>
                <span className="font-semibold text-foreground">{getStats().xp}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-accent-500" />
                <span className="text-foreground-muted">Streak:</span>
                <span className="font-semibold text-foreground">{getStats().streak} days</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success-500" />
                <span className="text-foreground-muted">Accuracy:</span>
                <span className="font-semibold text-foreground">{getStats().accuracy}%</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              onClick={() => openExtensionPage('review.html')}
              className="btn btn-primary w-full btn-lg shadow-green-glow hover:shadow-green-glow-lg animate-pulse-gentle"
              disabled={dueWords.length === 0}
            >
              <Play className="w-5 h-5 mr-1" />
              Start Review ({dueWords.length} words)
            </button>
            
            <button 
              onClick={() => setCurrentScreen('wordList')}
              className="btn btn-secondary w-full btn-lg hover-lift"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              View All Words
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => openExtensionPage('analytics.html')}
              className="btn btn-outline btn-sm p-3 hover-scale focus-ring"
              title="View learning analytics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => openExtensionPage('options.html')}
              className="btn btn-outline btn-sm p-3 hover-scale focus-ring"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={handleExportData}
              className="btn btn-outline btn-sm p-3 hover-scale focus-ring"
              title="Export vocabulary data"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={handleImportData}
              className="btn btn-outline btn-sm p-3 hover-scale focus-ring"
              title="Import vocabulary data"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}


      {/* Word List Screen */}
      {currentScreen === 'wordList' && (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border bg-background-secondary dark:bg-dark-background-secondary">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentScreen('main')}
                className="btn btn-text btn-sm hover-scale focus-ring"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h2 className="font-semibold text-foreground">All Words</h2>
            </div>
          </div>
          
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <input 
                type="text"
                placeholder="Search words..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 focus-ring"
              />
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto overflow-scrollbar-hidden">
              {getCurrentFilteredWords().map((word) => (
                <div key={word.id} className="card p-3 hover-lift card-interactive animate-fade-in-up">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-foreground">{word.word}</div>
                        <div 
                          className={`w-2 h-2 rounded-full ${getReviewStatusColor(word.nextReview)}`}
                          title={word.nextReview <= Date.now() ? 'Due for review' : 'Not due yet'}
                        />
                        <button 
                          onClick={() => playAudio(word.word)}
                          className="p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors focus-ring"
                          title="Play Audio"
                        >
                          <Volume2 className="w-3 h-3 text-primary-500" />
                        </button>
                      </div>
                      <div className="text-sm text-foreground-secondary">{word.meaning}</div>
                      {word.example && (
                        <div className="text-xs text-foreground-muted mt-1 italic">{word.example}</div>
                      )}
                    </div>
                    <div className="text-xs text-foreground-muted">
                      {formatDateForDisplay(word.nextReview)}
                    </div>
                  </div>
                </div>
              ))}
              {getCurrentFilteredWords().length === 0 && searchTerm && (
                <div className="text-center text-foreground-muted py-8">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No words found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Popup;
