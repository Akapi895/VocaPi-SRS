import React, { useState, useEffect } from 'react';
import { useChromeStorage } from '@/hooks/useChromeStorage';
import { useChromeMessages } from '@/hooks/useChromeMessages';
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

const Popup: React.FC = () => {
  const { data, loading, error, updateSettings, saveData } = useChromeStorage();
  const { showSuccessMessage, showErrorMessage } = useChromeMessages();
  
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
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-secondary btn-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const dueWords = getCurrentDueWords();

  return (
    <div className="w-96 h-[600px] bg-white flex flex-col">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              VocaPi
            </h1>
            <p className="text-sm opacity-90">Spaced Repetition Learning</p>
          </div>
          <button 
            onClick={toggleWordHighlighting}
            className={`p-2 rounded-lg transition-colors ${
              wordHighlightingEnabled 
                ? 'bg-primary-700 hover:bg-primary-800' 
                : 'hover:bg-primary-700'
            }`}
            title={wordHighlightingEnabled ? "Disable word highlighting" : "Enable word highlighting"}
          >
            {wordHighlightingEnabled ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Screen */}
      {currentScreen === 'main' && (
        <div className="flex-1 p-4 space-y-4">
          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3 text-center">
              <div className="text-2xl font-bold text-primary-600">
                {data?.vocabWords.length || 0}
              </div>
              <div className="text-xs text-gray-600">Total Words</div>
            </div>
            <div className="card p-3 text-center bg-warning-50 border-warning-200">
              <div className="text-2xl font-bold text-warning-600">
                {dueWords.length}
              </div>
              <div className="text-xs text-gray-600">Due Now</div>
            </div>
          </div>

          {/* Gamification Widget */}
          <div className="card p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-yellow-500" />
                <span className="text-gray-600">Level:</span>
                <span className="font-semibold">{getStats().level}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-blue-500" />
                <span className="text-gray-600">XP:</span>
                <span className="font-semibold">{getStats().xp}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-green-500" />
                <span className="text-gray-600">Streak:</span>
                <span className="font-semibold">{getStats().streak} days</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-purple-500" />
                <span className="text-gray-600">Accuracy:</span>
                <span className="font-semibold">{getStats().accuracy}%</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button 
              onClick={() => openExtensionPage('review.html')}
              className="btn btn-primary w-full btn-lg"
              disabled={dueWords.length === 0}
            >
              <Play className="w-4 h-4" />
              Start Review ({dueWords.length} words)
            </button>
            
            <button 
              onClick={() => setCurrentScreen('wordList')}
              className="btn btn-secondary w-full"
            >
              <BookOpen className="w-4 h-4" />
              View All Words
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => openExtensionPage('analytics.html')}
              className="btn btn-outline btn-sm p-2"
              title="View learning analytics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => openExtensionPage('options.html')}
              className="btn btn-outline btn-sm p-2"
              title="Settings & Cloud Sync"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={handleExportData}
              className="btn btn-outline btn-sm p-2"
              title="Export vocabulary data"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={handleImportData}
              className="btn btn-outline btn-sm p-2"
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
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentScreen('main')}
                className="btn btn-text btn-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h2 className="font-semibold">All Words</h2>
            </div>
          </div>
          
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search words..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getCurrentFilteredWords().map((word) => (
                <div key={word.id} className="card p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{word.word}</div>
                        <div 
                          className={`w-2 h-2 rounded-full ${getReviewStatusColor(word.nextReview)}`}
                          title={word.nextReview <= Date.now() ? 'Due for review' : 'Not due yet'}
                        />
                        <button 
                          onClick={() => playAudio(word.word)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Play Audio"
                        >
                          <Volume2 className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                      <div className="text-sm text-gray-600">{word.meaning}</div>
                      {word.example && (
                        <div className="text-xs text-gray-500 mt-1">{word.example}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDateForDisplay(word.nextReview)}
                    </div>
                  </div>
                </div>
              ))}
              {getCurrentFilteredWords().length === 0 && searchTerm && (
                <div className="text-center text-gray-500 py-8">
                  No words found matching "{searchTerm}"
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
