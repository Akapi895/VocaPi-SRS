// review-data.js
// VocabStorage and TimeUtils will be available globally from other scripts

const ReviewData = {
    async loadReviewData() {
        console.log("🔄 Loading review data...");

        try {
            const allWords = await window.VocabStorage.getAllWords();
            console.log(`📚 Total words in vocabulary: ${allWords.length}`);

            if (allWords.length === 0) {
                // Fallback to Chrome Storage via service worker
                console.log("🔄 IndexedDB empty, trying Chrome Storage...");
                const response = await chrome.runtime.sendMessage({ action: 'getWords' });
                
                if (response && response.success && response.words.length > 0) {
                    console.log(`📚 Got ${response.words.length} words from Chrome Storage`);
                    return { words: response.words };
                } else {
                    return { error: "No words in your vocabulary. Please add some words first." };
                }
            }

            console.log("📋 Sample words:", allWords.slice(0, 3).map(w => ({
                word: w.word,
                srs: w.srs,
                nextReview: w.srs?.nextReview
            })));

            const dueWords = await window.VocabStorage.getDueWords();
            console.log(`⏰ Due words found: ${dueWords.length}`);

            if (dueWords.length === 0) {
                console.log("ℹ️ No words are due for review");

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

            console.log("✅ Review data loaded successfully");
            console.log("🎯 Words for review:", dueWords.map(w => w.word));

            return { words: dueWords };
        } catch (error) {
            console.error("❌ Error loading review data:", error);
            
            // Final fallback to Chrome Storage
            try {
                const response = await chrome.runtime.sendMessage({ action: 'getWords' });
                if (response && response.success && response.words.length > 0) {
                    return { words: response.words };
                }
            } catch (fallbackError) {
                console.error("❌ Fallback also failed:", fallbackError);
            }
            
            return { error: "Failed to load vocabulary data. Please try again." };
        }
    }  
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.ReviewData = ReviewData;
}
