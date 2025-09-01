const ReviewData = {
    async loadReviewData() {
        try {
            const allWords = await window.VocabStorage.getAllWords();

            if (allWords.length === 0) {
                const response = await chrome.runtime.sendMessage({ action: 'getWords' });
                
                if (response && response.success && response.words.length > 0) {
                    return { words: response.words };
                } else {
                    return { error: "No words in your vocabulary. Please add some words first." };
                }
            }

            const dueWords = await window.VocabStorage.getDueWords();

            if (dueWords.length === 0) {
                const nextDueWord = allWords
                    .filter(w => w.srs && w.srs.nextReview)
                    .sort((a, b) => {
                        const aTime = new Date(a.srs.nextReview).getTime();
                        const bTime = new Date(b.srs.nextReview).getTime();
                        return aTime - bTime;
                    })[0];

                if (nextDueWord) {
                    const nextTime = new Date(nextDueWord.srs.nextReview);
                    const timeUntilNext = window.TimeUtils ? window.TimeUtils.formatTimeUntilReview(nextTime.toISOString()) : 
                    `in ${Math.ceil((nextTime.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`;
                    return { error: `No words are due for review right now. Next word "${nextDueWord.word}" is due in ${timeUntilNext}.` };
                }

                return { error: "No words are scheduled for review. All your words may be new - they should be available for review immediately." };
            }

            return { words: dueWords };
        } catch (error) {
            console.error("Error loading review data:", error);
            
            try {
                const response = await chrome.runtime.sendMessage({ action: 'getWords' });
                if (response && response.success && response.words.length > 0) {
                    return { words: response.words };
                }
            } catch (fallbackError) {
                console.error("Fallback also failed:", fallbackError);
            }
            
            return { error: "Failed to load vocabulary data. Please try again." };
        }
    }  
};

if (typeof window !== 'undefined') {
  window.ReviewData = ReviewData;
}
