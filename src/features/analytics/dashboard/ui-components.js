class DashboardUI {
  renderOverviewStats(stats) {
    const totalWordsEl = document.getElementById('total-words');
    const currentStreakEl = document.getElementById('current-streak');
    const totalTimeEl = document.getElementById('total-time');
    const todayAccuracyEl = document.getElementById('today-accuracy');
    const totalXpEl = document.getElementById('total-xp');

    if (totalWordsEl) {
      const value = stats.totalWordsLearned || stats.totalWords || 0;
      totalWordsEl.textContent = value.toLocaleString();
      if (stats.totalReviews && stats.totalReviews !== value) {
        totalWordsEl.title = `${value} unique words, ${stats.totalReviews} total reviews`;
      }
      console.log('Total words updated:', value);
    }

    if (currentStreakEl) {
      this.updateStreakUI(currentStreakEl, stats.currentStreak || 0);
    }

    if (totalTimeEl) {
      const value = stats.totalTimeSpent || 0;
      totalTimeEl.textContent = this.formatTime(value);
      console.log('Total time updated:', value, 'formatted:', this.formatTime(value));
    }

    if (todayAccuracyEl) {
      this.updateAccuracyUI(todayAccuracyEl, stats.todayAccuracy || 0);
    }

    if (totalXpEl) {
      const value = stats.totalXP || 0;
      totalXpEl.textContent = value.toLocaleString();
      console.log('Total XP updated:', value);
    }
  }

  updateStreakUI(el, streakValue) {
    const streakText = streakValue > 0 ? `${streakValue} day${streakValue > 1 ? 's' : ''}` : '0 days';
    el.textContent = streakText;

    const streakContainer = el.parentElement;
    streakContainer.className = streakContainer.className.replace(/ streak-\w+/g, '');

    if (streakValue === 0) {
      streakContainer.classList.add('streak-broken');
      let hintEl = streakContainer.querySelector('.streak-hint');
      if (!hintEl) {
        hintEl = document.createElement('div');
        hintEl.className = 'streak-hint';
        streakContainer.appendChild(hintEl);
      }
      hintEl.textContent = 'Review 5+ words daily to build streak';
      hintEl.style.cssText = 'font-size: 10px; color: rgba(255,255,255,0.6); margin-top: 2px;';
    } else if (streakValue >= 7) {
      streakContainer.classList.add('streak-fire');
      const hintEl = streakContainer.querySelector('.streak-hint');
      if (hintEl) hintEl.remove();
    } else {
      streakContainer.classList.add('streak-active');
      const hintEl = streakContainer.querySelector('.streak-hint');
      if (hintEl) hintEl.remove();
    }

    console.log('Current streak updated:', streakText);
  }

  updateAccuracyUI(el, accuracyValue) {
    const accuracyText = `${accuracyValue}%`;
    el.textContent = accuracyText;

    const accuracyContainer = el.parentElement;
    accuracyContainer.className = accuracyContainer.className.replace(/ accuracy-\w+/g, '');

    if (accuracyValue >= 90) {
      accuracyContainer.classList.add('accuracy-excellent');
    } else if (accuracyValue >= 70) {
      accuracyContainer.classList.add('accuracy-good');
    } else if (accuracyValue > 0) {
      accuracyContainer.classList.add('accuracy-needs-work');
    }

    console.log('Today accuracy updated:', accuracyText);
  }

  formatTime(minutes) {
    // ✅ SỬA: Kiểm tra nếu minutes quá lớn (có thể là milliseconds)
    if (minutes > 10000) {
      // Nếu quá lớn, có thể là milliseconds, convert sang minutes
      minutes = Math.round(minutes / 60000 * 100) / 100;
    }
    
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  }

  showLoading() {
    document.getElementById('loading-state').style.display = 'flex';
    document.getElementById('error-state').style.display = 'none';
    document.querySelector('.stats-overview').style.display = 'none';
    document.querySelector('.charts-section').style.display = 'none';
    document.querySelector('.achievements-section').style.display = 'none';
    document.querySelector('.difficult-words-section').style.display = 'none';
    document.querySelector('.patterns-section').style.display = 'none';
  }
  
  hideLoading() {
    document.getElementById('loading-state').style.display = 'none';
    document.querySelector('.stats-overview').style.display = 'grid';
    document.querySelector('.charts-section').style.display = 'grid';
    document.querySelector('.achievements-section').style.display = 'block';
    document.querySelector('.difficult-words-section').style.display = 'block';
    document.querySelector('.patterns-section').style.display = 'block';
  }
  
  showError(message) {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'flex';
    document.getElementById('error-message').textContent = message;
  }

  async loadAchievements(achievements) {
    try {
      console.log('🏆 Loading achievements:', achievements);
      
      const container = document.getElementById('achievements-grid');
      if (!container) {
        console.warn('⚠️ achievements-grid container not found');
        return;
      }

      container.innerHTML = '';
      
      if (!achievements || achievements.length === 0) {
        container.innerHTML = `
          <div class="achievement-card">
            <div class="achievement-icon">🎯</div>
            <div class="achievement-info">
              <h4>Start Learning!</h4>
              <p>Complete your first review session to unlock achievements</p>
            </div>
          </div>
        `;
        return;
      }
      
      // ✅ SỬA: Hiển thị achievements thật
      achievements.forEach(achievement => {
        const achievementCard = document.createElement('div');
        achievementCard.className = 'achievement-card unlocked';
        achievementCard.innerHTML = `
          <div class="achievement-icon">${achievement.icon}</div>
          <div class="achievement-info">
            <h4>${achievement.name}</h4>
            <p>${achievement.description}</p>
            <div class="achievement-xp">+${achievement.xpReward} XP</div>
          </div>
        `;
        container.appendChild(achievementCard);
      });
      
      console.log(`✅ Loaded ${achievements.length} achievements`);
    } catch (error) {
      console.error('❌ Error loading achievements:', error);
    }
  }
  
  async loadDifficultWords(difficultWords) {
    try {
      console.log('🔍 Loading difficult words:', difficultWords);
      
      const container = document.getElementById('difficult-words-list');
      if (!container) {
        console.warn('⚠️ difficult-words-list container not found');
        return;
      }

      if (!difficultWords || difficultWords.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🎯</div>
            <h4>No Difficult Words!</h4>
            <p>Great job! You're mastering all your vocabulary words.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      
      difficultWords.forEach((word, index) => {
        const wordItem = document.createElement('div');
        wordItem.className = `difficult-word-item difficulty-${word.difficulty}`;
        wordItem.innerHTML = `
          <div class="word-rank">#${index + 1}</div>
          <div class="word-content">
            <div class="word-header">
              <div class="word-name">${word.word || word.wordId || 'Unknown'}</div>
              <div class="difficulty-badge difficulty-${word.difficulty}">
                ${word.difficulty === 'high' ? 'High' : word.difficulty === 'medium' ? 'Medium' : 'Low'} difficulty
              </div>
            </div>
            <div class="word-meaning">${word.meaning || 'No meaning available'}</div>
            <div class="word-stats">
              <div class="stat-item">
                <span class="stat-label">Accuracy:</span>
                <span class="stat-value accuracy-${word.accuracy < 50 ? 'low' : word.accuracy < 70 ? 'medium' : 'high'}">
                  ${word.accuracy}%
                </span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Reviews:</span>
                <span class="stat-value">${word.reviewCount}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Avg Quality:</span>
                <span class="stat-value">${word.averageQuality}/5</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Correct:</span>
                <span class="stat-value">${word.correctCount}/${word.reviewCount}</span>
              </div>
            </div>
            ${word.lastReviewed ? `
              <div class="last-reviewed">
                Last reviewed: ${new Date(word.lastReviewed).toLocaleDateString()}
              </div>
            ` : ''}
          </div>
        `;
        container.appendChild(wordItem);
      });
      
      console.log(`✅ Loaded ${difficultWords.length} difficult words`);
    } catch (error) {
      console.error('❌ Error loading difficult words:', error);
      const container = document.getElementById('difficult-words-list');
      if (container) {
        container.innerHTML = `
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <p>Failed to load difficult words</p>
            <small>${error.message}</small>
          </div>
        `;
      }
    }
  }

  // ✅ SỬA: Chỉ giữ lại 1 method loadLearningPatterns
  loadLearningPatterns(dashboardStats, weeklyProgress) {
    try {
      console.log('📊 Loading learning patterns with real data:', { dashboardStats, weeklyProgress });
      
      // ✅ SỬA: Best Study Time
      const bestStudyTime = dashboardStats.bestStudyTime || 'No data yet';
      const bestStudyTimeEl = document.getElementById('best-study-time');
      if (bestStudyTimeEl) {
        bestStudyTimeEl.textContent = bestStudyTime;
        console.log(' Best study time:', bestStudyTime);
      }

      // ✅ SỬA: Most Active Day - sử dụng data từ dashboardStats
      const mostActiveDay = dashboardStats.mostActiveDay || 'No activity yet';
      const mostActiveDayEl = document.getElementById('most-active-day');
      if (mostActiveDayEl) {
        mostActiveDayEl.textContent = mostActiveDay;
        console.log(' Most active day:', mostActiveDay);
      }

      // ✅ SỬA: Average Session Length
      const avgSessionLength = dashboardStats.avgSessionLength || 0;
      const avgSessionDisplay = avgSessionLength > 0 
        ? `${avgSessionLength} min` 
        : 'No sessions yet';
      const avgSessionEl = document.getElementById('avg-session-length');
      if (avgSessionEl) {
        avgSessionEl.textContent = avgSessionDisplay;
        console.log('⚡ Average session length:', avgSessionDisplay);
      }

      // ✅ SỬA: Overall Accuracy
      const overallAccuracy = dashboardStats.overallAccuracy || 0;
      const accuracyDisplay = overallAccuracy > 0 
        ? `${overallAccuracy}%` 
        : 'No reviews yet';
      const overallAccuracyEl = document.getElementById('overall-accuracy');
      if (overallAccuracyEl) {
        overallAccuracyEl.textContent = accuracyDisplay;
        console.log('🎯 Overall accuracy:', accuracyDisplay);
      }

      console.log('✅ Learning patterns loaded successfully');
    } catch (error) {
      console.error('❌ Error loading learning patterns:', error);
    }
  }

  showEmptyState(stats) {
    const container = document.querySelector('.analytics-container') || document.body;
    const emptyDiv = document.createElement('div');
    emptyDiv.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <h3>📊 No Analytics Data Yet</h3>
        <p>Complete some word reviews to see your learning analytics!</p>
      </div>
    `;
    container.appendChild(emptyDiv);
  }

  showFallbackAnalytics() {
    const container = document.querySelector('.analytics-container') || document.body;
    const fallbackDiv = document.createElement('div');
    fallbackDiv.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <h3>📊 Analytics Unavailable</h3>
        <p>Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    `;
    container.appendChild(fallbackDiv);
  }

  updateXPDisplay(xpValue) {
    const totalXpEl = document.getElementById('total-xp');
    if (totalXpEl) {
      totalXpEl.textContent = (xpValue || 0).toLocaleString();
      
      // Thêm animation khi XP thay đổi
      totalXpEl.style.transform = 'scale(1.1)';
      setTimeout(() => {
        totalXpEl.style.transform = 'scale(1)';
      }, 200);
      
      console.log('XP display updated:', xpValue);
    }
  }
}

// Export for use in extension
if (typeof window !== 'undefined') {
  window.DashboardUI = DashboardUI;
}
