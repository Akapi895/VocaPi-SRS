import { createRoot } from 'react-dom/client';
import Options from './Options';
import '@/main.css';

const container = document.getElementById('options-root');
if (container) {
  // Remove theme-loading class immediately when React starts
  container.classList.remove('theme-loading');
  
  try {
    const root = createRoot(container);
    root.render(<Options />);
    console.log('Options page rendered successfully');
  } catch (error) {
    console.error('Error rendering options page:', error);
    // Show fallback content
    container.innerHTML = '<div style="padding: 20px; text-align: center;">Error loading options page. Please refresh.</div>';
  }
} else {
  console.error('Options root container not found');
}
