// Expose SRS algorithms and utilities to window
window.AdvancedSRSAlgorithm = window.AdvancedSRSAlgorithm || {};
window.TimeUtils = window.TimeUtils || {};
window.calculateForgettingCurve = window.calculateForgettingCurve || function() {};
window.analyzeResponseTime = window.analyzeResponseTime || function() {};
window.calculateQualityBonus = window.calculateQualityBonus || function() {};
window.calculateConsistencyBonus = window.calculateConsistencyBonus || function() {};

window.SRSAlgorithm = {
    fallbackSM2Algorithm: function(srs, quality) {
        if (!srs) srs = {};
        srs.repetitions = (srs.repetitions || 0) + 1;
        srs.lastQuality = quality;
        srs.lastReview = new Date().toISOString();
        
        if (quality >= 3) {
            srs.interval = Math.max(1, (srs.interval || 1) * 2);
        } else {
            srs.interval = 1;
        }
        
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + srs.interval);
        srs.nextReview = nextReview.toISOString();
        
        return srs;
    }
};
