class DashboardCharts {
  constructor() {
    this.charts = {};
    this.textChartWrappers = new Map(); // Cache text chart wrappers
  }

  destroyChart(key) {
    if (this.charts[key]) {
      this.charts[key].destroy();
      delete this.charts[key];
    }
  }

  // Cleanup all charts and text wrappers
  destroyAll() {
    Object.keys(this.charts).forEach(key => this.destroyChart(key));
    this.textChartWrappers.forEach(wrapper => {
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
    });
    this.textChartWrappers.clear();
  }

  getChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: 'white', font: { size: 11 } }
        }
      },
      scales: {
        x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
        y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
      }
    };
  }

  createWeeklyProgressChart(weeklyData) {
    const canvas = document.getElementById('weekly-progress-chart');
    if (!canvas) return;

    if (typeof Chart === 'undefined') {
      return this.createTextBasedWeeklyChart(weeklyData);
    }

    this.destroyChart('weeklyProgress');

    this.charts.weeklyProgress = new Chart(canvas, {
      type: 'line',
      data: {
        labels: weeklyData.map(d => d.day),
        datasets: [
          {
            label: 'Words Reviewed',
            data: weeklyData.map(d => d.words),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true
          },
          {
            label: 'Time Spent (min)',
            data: weeklyData.map(d => d.time || 0),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: true
          }
        ]
      },
      options: this.getChartOptions()
    });
  }

  createQualityDistributionChart(qualityData) {
    const canvas = document.getElementById('quality-chart');
    if (!canvas) return;

    if (typeof Chart === 'undefined') {
      return this.createTextBasedQualityChart(qualityData);
    }

    this.destroyChart('qualityDistribution');

    const labels = ['Blackout', 'Incorrect', 'Hard', 'Correct', 'Easy', 'Perfect'];
    const data = [0, 1, 2, 3, 4, 5].map(q => qualityData[q] || 0);
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];

    this.charts.qualityDistribution = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.map(c => c + '80'),
          borderColor: colors,
          borderWidth: 2
        }]
      },
      options: this.getChartOptions()
    });
  }

  updateWeeklyChart(weeklyData) {
    if (this.charts.weeklyProgress && typeof Chart !== 'undefined') {
      const chart = this.charts.weeklyProgress;
      chart.data.labels = weeklyData.map(d => d.day);
      chart.data.datasets[0].data = weeklyData.map(d => d.words);
      chart.data.datasets[1].data = weeklyData.map(d => d.time || 0);
      chart.update('none');
    } else {
      this.createTextBasedWeeklyChart(weeklyData);
    }
  }

  updateQualityChart(qualityData) {
    if (this.charts.qualityDistribution && typeof Chart !== 'undefined') {
      const chart = this.charts.qualityDistribution;
      chart.data.datasets[0].data = [0, 1, 2, 3, 4, 5].map(q => qualityData[q] || 0);
      chart.update('none');
    } else {
      this.createTextBasedQualityChart(qualityData);
    }
  }

  // Optimized text chart creation with caching
  createTextBasedWeeklyChart(weeklyData) {
    const canvas = document.getElementById('weekly-progress-chart');
    if (!canvas) {
      console.error('Weekly progress canvas not found for fallback chart');
      return;
    }
    
    const container = canvas.parentElement;
    
    // Use cached wrapper or create new one
    let textWrapper = this.textChartWrappers.get('weekly');
    if (!textWrapper) {
      textWrapper = document.createElement('div');
      textWrapper.className = 'text-chart-wrapper';
      container.appendChild(textWrapper);
      this.textChartWrappers.set('weekly', textWrapper);
    }
    
    // Use provided data or fallback to default
    const chartData = weeklyData && weeklyData.length > 0 ? weeklyData : this.getDefaultWeeklyProgress();
    
    // Calculate max values for proper scaling
    const maxWords = Math.max(...chartData.map(d => d.words || 0), 1);
    const maxTime = Math.max(...chartData.map(d => d.time || 0), 1);
    
    // Generate the text-based chart
    textWrapper.innerHTML = `
      <div class="text-chart" style="background: rgba(16, 24, 39, 0.8); border-radius: 12px; padding: 16px; margin: 8px 0;">
        <div class="chart-title" style="color: white; font-weight: 600; font-size: 16px; margin-bottom: 16px; text-align: center;">📈 Weekly Progress</div>
        <div class="weekly-bars" style="display: flex; justify-content: space-between; align-items: end; height: 120px; margin: 16px 0;">
          ${chartData.map(day => {
            const wordsPct = maxWords > 0 ? Math.max(5, (day.words / maxWords) * 100) : 5;
            const timePct = maxTime > 0 ? Math.max(5, (day.time / maxTime) * 100) : 5;
            return `
              <div class="day-bar" style="display: flex; flex-direction: column; align-items: center; flex: 1; margin: 0 2px;">
                <div class="bars" style="display: flex; gap: 4px; align-items: end; height: 80px; margin-bottom: 8px;">
                  <div class="bar words-bar" style="
                    background: linear-gradient(180deg, #10b981, #065f46);
                    height: ${wordsPct.toFixed(1)}%;
                    width: 12px;
                    border-radius: 2px;
                    position: relative;
                    min-height: 4px;
                    display: flex;
                    align-items: end;
                    justify-content: center;
                  " title="${day.words} words">
                    <span class="bar-value" style="
                      position: absolute;
                      bottom: -18px;
                      font-size: 10px;
                      color: #10b981;
                      font-weight: 600;
                    ">${day.words}</span>
                  </div>
                  <div class="bar time-bar" style="
                    background: linear-gradient(180deg, #f59e0b, #d97706);
                    height: ${timePct.toFixed(1)}%;
                    width: 12px;
                    border-radius: 2px;
                    position: relative;
                    min-height: 4px;
                    display: flex;
                    align-items: end;
                    justify-content: center;
                  " title="${day.time} minutes">
                    <span class="bar-value" style="
                      position: absolute;
                      bottom: -18px;
                      font-size: 10px;
                      color: #f59e0b;
                      font-weight: 600;
                    ">${day.time}m</span>
                  </div>
                </div>
                <div class="day-label" style="
                  color: rgba(255, 255, 255, 0.8);
                  font-size: 12px;
                  font-weight: 500;
                  margin-top: 8px;
                ">${day.day}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="chart-legend" style="display: flex; justify-content: center; gap: 20px; margin-top: 12px;">
          <div class="legend-item" style="display: flex; align-items: center; gap: 6px;">
            <div class="legend-color words-color" style="
              width: 12px;
              height: 12px;
              background: #10b981;
              border-radius: 2px;
            "></div>
            <span style="color: rgba(255, 255, 255, 0.9); font-size: 13px;">Words Reviewed</span>
          </div>
          <div class="legend-item" style="display: flex; align-items: center; gap: 6px;">
            <div class="legend-color time-color" style="
              width: 12px;
              height: 12px;
              background: #f59e0b;
              border-radius: 2px;
            "></div>
            <span style="color: rgba(255, 255, 255, 0.9); font-size: 13px;">Time Spent (min)</span>
          </div>
        </div>
      </div>
    `;
    
    // Hide the canvas since we're using text version
    canvas.style.display = 'none';
    
    console.log('📊 Text-based weekly progress chart created/updated');
  }
  
  createTextBasedQualityChart(qualityData) {
    const canvas = document.getElementById('quality-chart');
    if (!canvas) {
      console.error('Quality chart canvas not found for fallback chart');
      return;
    }
    
    const container = canvas.parentElement;
    
    // Get or create wrapper for text chart
    let textWrapper = container.querySelector('.text-quality-wrapper');
    if (!textWrapper) {
      textWrapper = document.createElement('div');
      textWrapper.className = 'text-quality-wrapper';
      container.appendChild(textWrapper);
    }
    
    const labels = ['Blackout', 'Incorrect', 'Hard', 'Correct', 'Easy', 'Perfect'];
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];
    const data = qualityData || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const total = Object.values(data).reduce((sum, count) => sum + count, 0) || 1;
    
    // Generate the text-based quality chart
    textWrapper.innerHTML = `
      <div class="text-chart" style="background: rgba(16, 24, 39, 0.8); border-radius: 12px; padding: 16px; margin: 8px 0;">
        <div class="chart-title" style="color: white; font-weight: 600; font-size: 16px; margin-bottom: 16px; text-align: center;">🎯 Quality Distribution</div>
        <div class="quality-bars" style="display: flex; flex-direction: column; gap: 8px;">
          ${labels.map((label, index) => {
            const count = data[index] || 0;
            const percentage = Math.round((count / total) * 100);
            const hasData = count > 0;
            
            return `
              <div class="quality-item" style="display: flex; align-items: center; gap: 12px;">
                <div class="quality-label" style="
                  color: rgba(255, 255, 255, 0.9);
                  font-size: 13px;
                  font-weight: 500;
                  width: 80px;
                  text-align: left;
                ">${label}</div>
                <div class="quality-bar-container" style="
                  flex: 1;
                  height: 20px;
                  background: rgba(255, 255, 255, 0.1);
                  border-radius: 10px;
                  overflow: visible;
                  position: relative;
                ">
                  <div class="quality-bar" style="
                    width: ${percentage}%;
                    height: 100%;
                    background: ${colors[index]};
                    border-radius: 10px;
                    transition: width 0.3s ease;
                    display: flex;
                    align-items: center;
                    ${percentage > 40 ? 'justify-content: center;' : ''}
                  ">
                    ${percentage > 40 ? `
                      <span class="quality-count" style="
                        color: white;
                        font-size: 11px;
                        font-weight: 600;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                      ">${hasData ? `${percentage}%` : '0%'}</span>
                    ` : ''}
                  </div>
                  ${percentage <= 40 ? `
                    <span class="quality-count" style="
                      position: absolute;
                      right: 8px;
                      top: 50%;
                      transform: translateY(-50%);
                      color: ${colors[index]};
                      font-size: 11px;
                      font-weight: 600;
                    ">${hasData ? `${percentage}%` : '0%'}</span>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        ${total > 1 ? `
          <div style="
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
            text-align: center;
            margin-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 8px;
          ">
            Total Reviews: ${total}
          </div>
        ` : ''}
      </div>
    `;
    
    // Hide the canvas since we're using text version
    canvas.style.display = 'none';
    
    console.log('📊 Text-based quality distribution chart created/updated');
  }

  getDefaultWeeklyProgress() {
    return [
      { day: 'Mon', words: 0, time: 0 },
      { day: 'Tue', words: 0, time: 0 },
      { day: 'Wed', words: 0, time: 0 },
      { day: 'Thu', words: 0, time: 0 },
      { day: 'Fri', words: 0, time: 0 },
      { day: 'Sat', words: 0, time: 0 },
      { day: 'Sun', words: 0, time: 0 }
    ];
  }
}

// Export for use in extension
if (typeof window !== 'undefined') {
  window.DashboardCharts = DashboardCharts;
}