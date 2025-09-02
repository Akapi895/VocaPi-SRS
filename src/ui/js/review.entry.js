// Review entry point - no ES modules needed
document.addEventListener("DOMContentLoaded", () => {
  // Wait for all review classes to be loaded
  const waitForReviewClasses = () => {
    if (window.VocabSRSReview) {
      new window.VocabSRSReview();
    } else {
      setTimeout(waitForReviewClasses, 100);
    }
  };
  
  waitForReviewClasses();
});

console.log('🔍 Scripts loaded, checking VocabAnalytics:', {
  VocabAnalytics: !!window.VocabAnalytics,
  recordWordReview: !!(window.VocabAnalytics && window.VocabAnalytics.recordWordReview),
  VocabAnalyticsType: typeof window.VocabAnalytics
});