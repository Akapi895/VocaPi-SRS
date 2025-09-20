import React from 'react';
import { createRoot } from 'react-dom/client';
import Analytics from './Analytics';
import '@/main.css';

const container = document.getElementById('analytics-root');
if (container) {
  const root = createRoot(container);
  root.render(<Analytics />);
}
