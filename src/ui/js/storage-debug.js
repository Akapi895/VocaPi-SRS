// Simple storage debugging - LOCAL ONLY
console.log('=== ANALYTICS DEBUG ===');
console.log('StorageManager available:', typeof StorageManager !== 'undefined');
console.log('VocabAnalytics available:', typeof VocabAnalytics !== 'undefined');

setTimeout(() => {
    if (chrome && chrome.storage) {
        console.log('=== CHECKING LOCAL STORAGE ===');
        chrome.storage.local.get(null, (result) => {
            console.log('📦 Local storage contents:', result);
            console.log('� Vocab words:', result.vocab_words ? result.vocab_words.length : 'none');
            console.log('� Analytics data:', result.analytics_data || 'none');
            console.log('🎯 Review sessions:', result.review_sessions || 'none');
            
            if (result.vocab_words && result.vocab_words.length > 0) {
                const words = result.vocab_words;
                const reviewedWords = words.filter(w => w.reviewCount > 0);
                const masteredWords = words.filter(w => w.srs && w.srs.quality >= 4);
                
                console.log('� Word stats:');
                console.log('- Total words:', words.length);
                console.log('- Reviewed words:', reviewedWords.length);
                console.log('- Mastered words (quality ≥ 4):', masteredWords.length);
                console.log('- Sample word:', words[0]);
            }
        });
    }
}, 1000);
