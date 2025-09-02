// Initialize all gamification components on window
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGamification);
  } else {
    // Delay initialization to ensure components are loaded
    setTimeout(initializeGamification, 100);
  }
}

function initializeGamification() {
  // Check if all components are available
  const components = ['VocabGamification', 'FastGamificationWidget', 'GamificationUI'];
  const missingComponents = components.filter(comp => !window[comp]);
  
  if (missingComponents.length === 0) {

    initializeGamificationInstance();
  } else {

    
    // Retry với exponential backoff
    let retryCount = 0;
    const maxRetries = 5; // Tăng số lần retry
    const retryInterval = 500; // Giảm interval xuống 500ms
    
    const retry = () => {
      retryCount++;

      
      setTimeout(() => {
        const stillMissing = components.filter(comp => !window[comp]);
        if (stillMissing.length === 0) {

          initializeGamificationInstance();
        } else if (retryCount < maxRetries) {
          retry();
        } else {
          console.warn('Some gamification components still missing after all retries:', stillMissing);
          // Proceed with available components
          initializeGamificationInstance();
        }
      }, retryInterval * retryCount);
    };
    
    retry();
  }
}

function initializeGamificationInstance() {
  try {
    // Initialize global gamification instance if needed
    if (!window.gamificationInstance && window.VocabGamification) {
      window.gamificationInstance = new window.VocabGamification();
      window.gamificationInstance.initializeGamification().catch(error => {
        console.warn('Failed to initialize gamification instance:', error);
      });

    }
    
    // Emit event that components are ready
    window.dispatchEvent(new CustomEvent('gamificationComponentsReady'));

  } catch (error) {
    console.error('Failed to initialize gamification:', error);
  }
}
