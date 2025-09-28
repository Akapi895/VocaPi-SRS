import { createRoot } from 'react-dom/client';
import Analytics from './Analytics';
import '@/main.css';

const container = document.getElementById('analytics-root');
if (container) {
  // Remove theme-loading class immediately when React starts
  container.classList.remove('theme-loading');
  
  try {
    const root = createRoot(container);
    root.render(<Analytics />);
    console.log('Analytics page rendered successfully');
  } catch (error) {
    console.error('Error rendering analytics page:', error);
    // Show fallback content
    container.innerHTML = '<div style="padding: 20px; text-align: center;">Error loading analytics page. Please refresh.</div>';
  }
} else {
  console.error('Analytics root container not found');
}
