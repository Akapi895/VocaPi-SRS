import { createRoot } from 'react-dom/client';
import Popup from './Popup';
import '@/main.css';

const container = document.getElementById('popup-root');
if (container) {
  // Remove theme-loading class immediately when React starts
  container.classList.remove('theme-loading');
  
  try {
    const root = createRoot(container);
    root.render(<Popup />);
    console.log('Popup rendered successfully');
  } catch (error) {
    console.error('Error rendering popup:', error);
    // Show fallback content
    container.innerHTML = '<div style="padding: 20px; text-align: center;">Error loading popup. Please refresh.</div>';
  }
} else {
  console.error('Popup root container not found');
}
