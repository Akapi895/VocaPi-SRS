import React from 'react';
import { createRoot } from 'react-dom/client';
import Review from './Review';
import '@/main.css';

const container = document.getElementById('review-root');
if (container) {
  const root = createRoot(container);
  root.render(<Review />);
}
