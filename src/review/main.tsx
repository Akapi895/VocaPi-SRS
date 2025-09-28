import { createRoot } from 'react-dom/client';
import Review from './Review';
import '@/main.css';

const container = document.getElementById('review-root');
if (container) {
  // Remove theme-loading class immediately when React starts
  container.classList.remove('theme-loading');
  
  try {
    const root = createRoot(container);
    root.render(<Review />);
    console.log('Review page rendered successfully');
  } catch (error) {
    console.error('Error rendering review page:', error);
    // Show fallback content
    container.innerHTML = '<div style="padding: 20px; text-align: center;">Error loading review page. Please refresh.</div>';
  }
} else {
  console.error('Review root container not found');
}
