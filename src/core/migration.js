// Migration script to convert Chrome Storage to IndexedDB
class StorageMigration {
  constructor() {
    this.isMigrated = false;
  }

  async checkAndMigrate() {
    try {
      // Check if migration is needed
      const migrationStatus = await this.getMigrationStatus();
      
      if (migrationStatus.completed) {
        console.log('✅ Migration already completed');
        return true;
      }

      console.log('🔄 Starting migration from Chrome Storage to IndexedDB...');
      
      // Migrate vocabulary words
      await this.migrateVocabWords();
      
      // Migrate gamification data
      await this.migrateGamificationData();
      
      // Migrate analytics data
      await this.migrateAnalyticsData();
      
      // Mark migration as completed
      await this.markMigrationCompleted();
      
      console.log('✅ Migration completed successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return false;
    }
  }

  async getMigrationStatus() {
    try {
      const result = await chrome.storage.local.get(['migrationStatus']);
      return result.migrationStatus || { completed: false, timestamp: null };
    } catch (error) {
      console.error('Error getting migration status:', error);
      return { completed: false, timestamp: null };
    }
  }

  async markMigrationCompleted() {
    try {
      const status = {
        completed: true,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      await chrome.storage.local.set({ migrationStatus: status });
      
      // Also save to IndexedDB
      if (window.indexedDBManager) {
        await window.indexedDBManager.set('settings', { 
          key: 'migrationStatus', 
          value: status 
        });
      }
      
      this.isMigrated = true;
    } catch (error) {
      console.error('Error marking migration completed:', error);
    }
  }

  async migrateVocabWords() {
    try {
      console.log('📚 Migrating vocabulary words...');
      
      // Get words from Chrome Storage
      const result = await chrome.storage.local.get(['vocabWords']);
      const vocabWords = result.vocabWords || [];
      
      if (vocabWords.length === 0) {
        console.log('No vocabulary words to migrate');
        return;
      }

      // Save to IndexedDB
      if (window.indexedDBManager) {
        for (const word of vocabWords) {
          try {
            await window.indexedDBManager.add('vocabWords', word);
          } catch (error) {
            console.warn('Failed to migrate word:', word.word, error);
          }
        }
        console.log(`✅ Migrated ${vocabWords.length} vocabulary words`);
      } else {
        console.warn('IndexedDB manager not available, skipping migration');
      }
      
    } catch (error) {
      console.error('Error migrating vocabulary words:', error);
    }
  }

  async migrateGamificationData() {
    try {
      console.log('🎮 Migrating gamification data...');
      
      // Get gamification data from Chrome Storage
      const result = await chrome.storage.local.get(['vocabGamification']);
      const gamificationData = result.vocabGamification;
      
      if (!gamificationData) {
        console.log('No gamification data to migrate');
        return;
      }

      // Save to IndexedDB
      if (window.indexedDBManager) {
        await window.indexedDBManager.set('gamification', gamificationData);
        console.log('✅ Migrated gamification data');
      } else {
        console.warn('IndexedDB manager not available, skipping migration');
      }
      
    } catch (error) {
      console.error('Error migrating gamification data:', error);
    }
  }

  async migrateAnalyticsData() {
    try {
      console.log('📊 Migrating analytics data...');
      
      // Get analytics data from Chrome Storage
      const result = await chrome.storage.local.get(['vocabAnalytics']);
      const analyticsData = result.vocabAnalytics;
      
      if (!analyticsData) {
        console.log('No analytics data to migrate');
        return;
      }

      // Save to IndexedDB
      if (window.indexedDBManager) {
        await window.indexedDBManager.set('analytics', analyticsData);
        console.log('✅ Migrated analytics data');
      } else {
        console.warn('IndexedDB manager not available, skipping migration');
      }
      
    } catch (error) {
      console.error('Error migrating analytics data:', error);
    }
  }

  async cleanupChromeStorage() {
    try {
      console.log('🧹 Cleaning up Chrome Storage...');
      
      // Remove migrated data from Chrome Storage
      await chrome.storage.local.remove([
        'vocabWords',
        'vocabGamification', 
        'vocabAnalytics'
      ]);
      
      console.log('✅ Chrome Storage cleaned up');
    } catch (error) {
      console.error('Error cleaning up Chrome Storage:', error);
    }
  }
}

// Global instance
const storageMigration = new StorageMigration();

// Export for use in other files
if (typeof window !== 'undefined') {
  window.StorageMigration = StorageMigration;
  window.storageMigration = storageMigration;
}
