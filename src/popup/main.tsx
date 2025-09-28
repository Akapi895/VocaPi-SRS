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
  } catch (error) {
    // Show fallback content
    container.innerHTML = '<div style="padding: 20px; text-align: center;">Error loading popup. Please refresh.</div>';
  }
}
