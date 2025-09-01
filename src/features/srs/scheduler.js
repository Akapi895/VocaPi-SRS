window.scheduleNextReview = function(card, quality, responseTime, adaptiveFactor, userStats, DEFAULT_PARAMETERS) {
    if (!card.srs) card.srs = {};
    
    card.srs.repetitions = (card.srs.repetitions || 0) + 1;
    card.srs.lastQuality = quality;
    card.srs.lastReview = new Date().toISOString();
    
    if (quality >= 3) {
        card.srs.interval = Math.max(1, (card.srs.interval || 1) * 2);
    } else {
        card.srs.interval = 1;
    }
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + card.srs.interval);
    card.srs.nextReview = nextReview.toISOString();
    
    return card.srs;
};
