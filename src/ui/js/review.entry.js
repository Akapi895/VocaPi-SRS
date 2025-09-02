document.addEventListener("DOMContentLoaded", () => {
  const waitForReviewClasses = () => {
    if (window.VocabSRSReview) {
      new window.VocabSRSReview();
    } else {
      setTimeout(waitForReviewClasses, 100);
    }
  };
  
  waitForReviewClasses();
});