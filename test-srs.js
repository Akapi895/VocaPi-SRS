// Test SRS Algorithm functionality
// Run this in browser console to test the SRS algorithm

console.log('Testing SRS Algorithm...');

// Mock data for testing
const mockSRSData = {
  repetitions: 2,
  interval: 6,
  easiness: 2.3,
  nextReview: new Date().toISOString(),
  lastReviewedAt: Date.now(),
  totalReviews: 2,
  reviewHistory: []
};

// Test quality levels
const qualityLevels = [0, 1, 2, 3, 4, 5];

qualityLevels.forEach(quality => {
  console.log(`\n--- Testing Quality ${quality} ---`);
  
  try {
    // Load utils.js first if in extension context
    if (typeof window !== 'undefined' && window.VocabUtils) {
      const result = window.VocabUtils.SRSAlgorithm.updateCard(mockSRSData, quality, {
        useAdvanced: false // Use basic algorithm for stability
      });
      
      console.log('Input SRS:', mockSRSData);
      console.log('Quality:', quality);
      console.log('Output SRS:', result);
      console.log('Valid result:', result && typeof result === 'object' && result.nextReview);
      
    } else {
      console.log('VocabUtils not available - run this in extension context');
    }
    
  } catch (error) {
    console.error(`Error with quality ${quality}:`, error);
  }
});

console.log('\nSRS Algorithm test completed.');
