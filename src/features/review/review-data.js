// review-data.js
import { VocabStorage } from "../../core/storage.js";
import { TimeUtils } from "../../core/date.js";

export const ReviewData = {
    async loadReviewData() {
        console.log("🔄 Loading review data...");

        const allWords = await VocabStorage.getAllWords();
        console.log(`📚 Total words in vocabulary: ${allWords.length}`);

        if (allWords.length === 0) {
            return { error: "No words in your vocabulary. Please add some words first." };
        }

        console.log("📋 Sample words:", allWords.slice(0, 3).map(w => ({
            word: w.word,
            srs: w.srs,
            nextReview: w.srs?.nextReview
        })));

        const dueWords = await VocabStorage.getDueWords();
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
                const timeUntilNext = TimeUtils.formatTimeUntilReview(nextTime.toISOString());
                return { error: `No words are due for review right now. Next word "${nextDueWord.word}" is due in ${timeUntilNext}.` };
            }

            return { error: "No words are scheduled for review. All your words may be new - they should be available for review immediately." };
        }

        console.log("✅ Review data loaded successfully");
        console.log("🎯 Words for review:", dueWords.map(w => w.word));

        return { words: dueWords };
    }
};
