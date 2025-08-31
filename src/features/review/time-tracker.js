class TimeTracker {
    constructor(inactivityThreshold = 30000) {
        this.windowOpenTime = Date.now();
        this.lastActivityTime = Date.now();
        this.totalActiveTime = 0;
        this.inactivityThreshold = inactivityThreshold;
        this.activityTimer = null;
        this.uiUpdateTimer = null;
    }

    setupWindowTracking() {
        console.log('🕒 Setting up window time tracking');
        
        // Track user activity to pause timer when inactive
        const activityEvents = ['click', 'keydown', 'mousemove', 'scroll'];
        
        activityEvents.forEach(event => {
        document.addEventListener(event, () => {
            this.updateLastActivity();
        });
        });
        
        // Track window focus/blur for accurate timing
        window.addEventListener('focus', () => {
        console.log('🟢 Window focused - resuming time tracking');
        this.lastActivityTime = Date.now();
        this.startActivityTimer();
        });
        
        window.addEventListener('blur', () => {
        console.log('🔴 Window blurred - pausing time tracking');
        this.pauseTimeTracking();
        });
        
        // Track window close to save final time
        window.addEventListener('beforeunload', () => {
        this.finalizeTimeTracking();
        });
        
        // Start the activity timer
        this.startActivityTimer();
        
        // Update UI timer every 30 seconds
        this.uiUpdateTimer = setInterval(() => {
        this.updateActiveTimeDisplay();
        }, 30000);
        
        console.log('⏱️ Window time tracking started at:', new Date().toLocaleTimeString());
    }
    
    updateActiveTimeDisplay() {
        const activeMinutes = this.getCurrentActiveTime();
        const display = document.getElementById('active-time-display');
        if (display) {
        display.textContent = `${activeMinutes} min`;
        }
    }
    
    updateLastActivity() {
        const now = Date.now();
        
        // If we were inactive, add the gap to total active time
        if (this.lastActivityTime && (now - this.lastActivityTime) <= this.inactivityThreshold) {
        this.totalActiveTime += (now - this.lastActivityTime);
        }
        
        this.lastActivityTime = now;
    }
    
    startActivityTimer() {
        // Clear existing timer
        if (this.activityTimer) {
        clearInterval(this.activityTimer);
        }
        
        let lastTick = Date.now();
        this.activityTimer = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTick;
        lastTick = now;
        
        if (now - this.lastActivityTime <= this.inactivityThreshold) {
            this.totalActiveTime += delta; // chính xác hơn
        } else {
            console.log('⏸️ Inactive > threshold - pausing');
            clearInterval(this.activityTimer);
        }
        }, 1000);
    }
    
    pauseTimeTracking() {
        if (this.activityTimer) {
        clearInterval(this.activityTimer);
        this.activityTimer = null;
        }
        
        if (this.uiUpdateTimer) {
        clearInterval(this.uiUpdateTimer);
        this.uiUpdateTimer = null;
        }
        
        // Add final chunk of active time
        const now = Date.now();
        if (this.lastActivityTime && (now - this.lastActivityTime) <= this.inactivityThreshold) {
        this.totalActiveTime += (now - this.lastActivityTime);
        }
    }
    
    finalizeTimeTracking() {
        this.pauseTimeTracking();
        
        const totalWindowTime = Date.now() - this.windowOpenTime;
        const activeTimeMinutes = Math.round(this.totalActiveTime / 60000);
        const windowTimeMinutes = Math.round(totalWindowTime / 60000);
        
        console.log('📊 Final time tracking:', {
        totalWindowTime: windowTimeMinutes + ' min',
        totalActiveTime: activeTimeMinutes + ' min',
        activePercentage: Math.round((this.totalActiveTime / totalWindowTime) * 100) + '%'
        });
        
        return {
        activeTime: this.totalActiveTime,
        windowTime: totalWindowTime,
        activeTimeMinutes
        };
    }
    
    getCurrentActiveTime() {
        // Get current active time including ongoing activity
        let currentActive = this.totalActiveTime;
        const now = Date.now();
        
        if (this.lastActivityTime && (now - this.lastActivityTime) <= this.inactivityThreshold) {
        currentActive += (now - this.lastActivityTime);
        }
        
        return Math.round(currentActive / 60000); // Return in minutes
    }
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.TimeTracker = TimeTracker;
}