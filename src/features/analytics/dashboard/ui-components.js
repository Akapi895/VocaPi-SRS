export class DashboardUI {
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
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
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

  loadAchievements(achievements) {
    const container = document.getElementById('achievements-grid');
    container.innerHTML = '';
    
    if (achievements.length === 0) {
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
    
    achievements.forEach(achievement => {
      const achievementCard = document.createElement('div');
      achievementCard.className = 'achievement-card';
      achievementCard.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
          <h4>${achievement.name}</h4>
          <p>${achievement.description}</p>
          <div class="achievement-xp">+${achievement.xp} XP</div>
        </div>
      `;
      container.appendChild(achievementCard);
    });
  }
  
  async loadDifficultWords(difficultWords) {
    const container = document.getElementById('difficult-words-list');
    container.innerHTML = '';
    
    if (difficultWords.length === 0) {
      container.innerHTML = `
        <div class="difficult-word-item">
          <div class="word-info">
            <div class="word-name">Great job! 🎉</div>
            <div class="word-stats">No words are giving you trouble right now</div>
          </div>
        </div>
      `;
      return;
    }
    
    try {
      const wordPromises = difficultWords.slice(0, 8).map(stat =>
        window.VocabUtils.VocabStorage.getWord(stat.wordId).then(word => ({ word, stat }))
      );
      const wordsData = await Promise.all(wordPromises);

      wordsData.forEach(({ word, stat }) => {
        if (!word) return;
        const wordItem = document.createElement('div');
        wordItem.className = 'difficult-word-item';
        const difficultyLevel = stat.difficultyScore > 0.7 ? 'high' : 'medium';
        const difficultyText = stat.difficultyScore > 0.7 ? 'Very Hard' : 'Hard';
        
        wordItem.innerHTML = `
          <div class="word-info">
            <div class="word-name">${word.word}</div>
            <div class="word-stats">
              ${stat.attempts} attempts • ${Math.round(stat.avgQuality * 10) / 10} avg quality
            </div>
          </div>
          <div class="difficulty-badge difficulty-${difficultyLevel}">
            ${difficultyText}
          </div>
        `;
        container.appendChild(wordItem);
      });
    } catch (error) {
      console.error('Error loading difficult words:', error);
    }
  }

  loadLearningPatterns(stats, weeklyData) {
    console.log('📊 Loading learning patterns with real data:', { stats, weeklyData });
    
    const bestStudyTime = stats.bestStudyTime || 'No data yet';
    document.getElementById('best-study-time').textContent = bestStudyTime;

    const dayTotals = weeklyData.reduce((acc, day) => {
      const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' });
      acc[dayName] = (acc[dayName] || 0) + day.words;
      return acc;
    }, {});
    
    const hasWeeklyActivity = Object.values(dayTotals).some(total => total > 0);
    const mostActiveDay = hasWeeklyActivity 
      ? Object.entries(dayTotals).sort(([,a], [,b]) => b - a)[0]?.[0] 
      : 'No activity yet';
    document.getElementById('most-active-day').textContent = mostActiveDay;

    const avgSessionDisplay = stats.avgSessionLength || 'No sessions yet';
    document.getElementById('avg-session-length').textContent = avgSessionDisplay;

    const totalQualities = Object.values(stats.qualityDistribution || {});
    const totalReviews = totalQualities.reduce((sum, count) => sum + count, 0);
    const weightedScore = Object.entries(stats.qualityDistribution || {})
      .reduce((sum, [quality, count]) => sum + (parseInt(quality) * count), 0);
    
    const overallAccuracy = totalReviews > 0 
      ? Math.round((weightedScore / (totalReviews * 5)) * 100)
      : 0;
    
    const accuracyDisplay = totalReviews > 0 
      ? `${overallAccuracy}%`
      : 'No reviews yet';
    
    document.getElementById('overall-accuracy').textContent = accuracyDisplay;
  }
}
