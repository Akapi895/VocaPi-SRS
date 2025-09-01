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
        const activityEvents = ['click', 'keydown', 'mousemove', 'scroll'];
        
        activityEvents.forEach(event => {
        document.addEventListener(event, () => {
            this.updateLastActivity();
        });
        });
        
        window.addEventListener('focus', () => {
        this.lastActivityTime = Date.now();
        this.startActivityTimer();
        });
        
        window.addEventListener('blur', () => {
        this.pauseTimeTracking();
        });
        
        window.addEventListener('beforeunload', () => {
        this.finalizeTimeTracking();
        });
        
        this.startActivityTimer();
        
        this.uiUpdateTimer = setInterval(() => {
        this.updateActiveTimeDisplay();
        }, 30000);
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
        
        if (this.lastActivityTime && (now - this.lastActivityTime) <= this.inactivityThreshold) {
        this.totalActiveTime += (now - this.lastActivityTime);
        }
        
        this.lastActivityTime = now;
    }
    
    startActivityTimer() {
        if (this.activityTimer) {
        clearInterval(this.activityTimer);
        }
        
        let lastTick = Date.now();
        this.activityTimer = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTick;
        lastTick = now;
        
        if (now - this.lastActivityTime <= this.inactivityThreshold) {
            this.totalActiveTime += delta;
        } else {
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
        
        return {
        activeTime: this.totalActiveTime,
        windowTime: totalWindowTime,
        activeTimeMinutes
        };
    }
    
    getCurrentActiveTime() {
        let currentActive = this.totalActiveTime;
        const now = Date.now();
        
        if (this.lastActivityTime && (now - this.lastActivityTime) <= this.inactivityThreshold) {
        currentActive += (now - this.lastActivityTime);
        }
        
        return Math.round(currentActive / 60000);
    }
}

if (typeof window !== 'undefined') {
  window.TimeTracker = TimeTracker;
}