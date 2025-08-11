#!/usr/bin/env node

/**
 * SRS Algorithm Test Script
 * Tests the SM-2 (SuperMemo 2) algorithm implementation
 * 
 * Run with: node srs_test.js
 */

// Simple SM-2 implementation for testing (copy of the algorithm from utils.js)
function updateSRSCard(srsData, quality) {
  const updatedSRS = { ...srsData };
  
  if (quality >= 3) {
    // Successful review
    if (updatedSRS.repetitions === 0) {
      updatedSRS.interval = 1;
    } else if (updatedSRS.repetitions === 1) {
      updatedSRS.interval = 6;
    } else {
      updatedSRS.interval = Math.round(updatedSRS.interval * updatedSRS.easiness);
    }
    
    updatedSRS.repetitions += 1;
    updatedSRS.easiness = updatedSRS.easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    
    if (updatedSRS.easiness < 1.3) {
      updatedSRS.easiness = 1.3;
    }
  } else {
    // Failed review
    updatedSRS.repetitions = 0;
    updatedSRS.interval = 1;
  }
  
  // Set next review date (simplified for testing)
  const today = new Date();
  const nextReview = new Date(today);
  nextReview.setDate(today.getDate() + updatedSRS.interval);
  updatedSRS.nextReview = nextReview.toISOString();
  
  return updatedSRS;
}

// Test cases
function runTests() {
  console.log('🧪 Testing SM-2 SRS Algorithm\n');
  
  // Test Case 1: Perfect learning sequence (quality 5)
  console.log('📚 Test 1: Perfect Learning (Quality 5)');
  let card1 = {
    easiness: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString()
  };
  
  const perfectQualities = [5, 5, 5, 5, 5];
  perfectQualities.forEach((quality, index) => {
    card1 = updateSRSCard(card1, quality);
    console.log(`Review ${index + 1}: Quality ${quality} -> Interval: ${card1.interval} days, EF: ${card1.easiness.toFixed(2)}, Reps: ${card1.repetitions}`);
  });
  console.log('');
  
  // Test Case 2: Gradual improvement (quality 3 -> 4 -> 5)
  console.log('📈 Test 2: Gradual Improvement');
  let card2 = {
    easiness: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString()
  };
  
  const gradualQualities = [3, 4, 4, 5, 5];
  gradualQualities.forEach((quality, index) => {
    card2 = updateSRSCard(card2, quality);
    console.log(`Review ${index + 1}: Quality ${quality} -> Interval: ${card2.interval} days, EF: ${card2.easiness.toFixed(2)}, Reps: ${card2.repetitions}`);
  });
  console.log('');
  
  // Test Case 3: Failure and recovery
  console.log('❌ Test 3: Failure and Recovery');
  let card3 = {
    easiness: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString()
  };
  
  const failureQualities = [4, 5, 2, 3, 4, 5]; // Fail on 3rd review, then recover
  failureQualities.forEach((quality, index) => {
    card3 = updateSRSCard(card3, quality);
    const status = quality < 3 ? '❌ FAIL' : '✅ PASS';
    console.log(`Review ${index + 1}: Quality ${quality} ${status} -> Interval: ${card3.interval} days, EF: ${card3.easiness.toFixed(2)}, Reps: ${card3.repetitions}`);
  });
  console.log('');
  
  // Test Case 4: Consistent poor performance
  console.log('📉 Test 4: Consistent Poor Performance');
  let card4 = {
    easiness: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString()
  };
  
  const poorQualities = [1, 2, 1, 3, 2, 1];
  poorQualities.forEach((quality, index) => {
    card4 = updateSRSCard(card4, quality);
    const status = quality < 3 ? '❌ FAIL' : '✅ PASS';
    console.log(`Review ${index + 1}: Quality ${quality} ${status} -> Interval: ${card4.interval} days, EF: ${card4.easiness.toFixed(2)}, Reps: ${card4.repetitions}`);
  });
  console.log('');
  
  // Test Case 5: Edge cases
  console.log('🔍 Test 5: Edge Cases');
  
  // Minimum easiness factor test
  let cardMin = { easiness: 1.3, interval: 10, repetitions: 5, nextReview: new Date().toISOString() };
  cardMin = updateSRSCard(cardMin, 0); // Worst possible quality
  console.log(`Minimum EF test: Quality 0 -> EF stays at ${cardMin.easiness} (should not go below 1.3)`);
  
  // Maximum easiness factor progression
  let cardMax = { easiness: 2.5, interval: 0, repetitions: 0, nextReview: new Date().toISOString() };
  for (let i = 0; i < 10; i++) {
    cardMax = updateSRSCard(cardMax, 5);
  }
  console.log(`Maximum EF progression: After 10 perfect reviews -> EF: ${cardMax.easiness.toFixed(2)}, Interval: ${cardMax.interval} days`);
  
  console.log('');
  
  // Validation Tests
  console.log('✅ Validation Tests');
  
  // Test initial state
  const initialCard = { easiness: 2.5, interval: 0, repetitions: 0, nextReview: new Date().toISOString() };
  const firstReview = updateSRSCard(initialCard, 4);
  
  console.log(`Initial state validation:`);
  console.log(`- First successful review should set interval to 1: ${firstReview.interval === 1 ? '✅' : '❌'}`);
  console.log(`- First successful review should increment repetitions: ${firstReview.repetitions === 1 ? '✅' : '❌'}`);
  
  const secondReview = updateSRSCard(firstReview, 4);
  console.log(`- Second successful review should set interval to 6: ${secondReview.interval === 6 ? '✅' : '❌'}`);
  
  // Test failure reset
  const failedCard = updateSRSCard(secondReview, 2);
  console.log(`- Failed review should reset repetitions to 0: ${failedCard.repetitions === 0 ? '✅' : '❌'}`);
  console.log(`- Failed review should reset interval to 1: ${failedCard.interval === 1 ? '✅' : '❌'}`);
  
  // Test easiness factor bounds
  let minEFCard = { easiness: 1.5, interval: 5, repetitions: 3, nextReview: new Date().toISOString() };
  minEFCard = updateSRSCard(minEFCard, 0);
  console.log(`- EF should not go below 1.3: ${minEFCard.easiness >= 1.3 ? '✅' : '❌'} (EF: ${minEFCard.easiness.toFixed(2)})`);
  
  console.log('\n🎉 All tests completed!');
  
  // Summary
  console.log('\n📊 Algorithm Summary:');
  console.log('- Quality 0-2: Reset repetitions and interval to 1 (failed)');
  console.log('- Quality 3-5: Increase interval based on easiness factor (passed)');
  console.log('- Easiness factor is adjusted based on quality rating');
  console.log('- Minimum easiness factor is 1.3');
  console.log('- Interval progression: 1 day → 6 days → previous_interval × EF');
}

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = {
  updateSRSCard,
  runTests
};
