# VocaPi - Development Guide

## Project Structure

This project has been migrated from vanilla HTML/CSS/JS to **Vite + React + TailwindCSS** for better development experience and maintainability.

```
src/
├── popup/                 # Extension popup (React)
│   ├── index.html
│   ├── main.tsx
│   └── Popup.tsx
├── options/               # Options page (React)
│   ├── index.html
│   ├── main.tsx
│   └── Options.tsx
├── review/                # Review page (React)
│   ├── index.html
│   ├── main.tsx
│   └── Review.tsx
├── analytics/             # Analytics page (React)
│   ├── index.html
│   ├── main.tsx
│   └── Analytics.tsx
├── content/               # Content script (TypeScript)
│   └── index.ts
├── service-worker/        # Service worker (TypeScript)
│   └── index.ts
├── components/            # Shared React components
├── hooks/                 # Custom React hooks
│   ├── useChromeStorage.ts
│   └── useChromeMessages.ts
├── types/                 # TypeScript type definitions
│   └── index.ts
├── utils/                 # Utility functions (migrated from core/)
└── main.css              # Global TailwindCSS styles
```

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Chrome browser for testing

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

### Development Workflow

1. **Development Mode**: Run `npm run dev` to start Vite dev server
2. **Build Extension**: Run `npm run build` to create production build in `dist/` folder
3. **Load Extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist/` folder

## Key Features

### React Components

- **Popup**: Main extension interface with review controls and stats
- **Options**: Settings page with Firebase sync configuration
- **Review**: Full-screen review session with SRS algorithm
- **Analytics**: Learning analytics dashboard with charts and insights

### Custom Hooks

- **useChromeStorage**: Manages Chrome extension storage with React state
- **useChromeMessages**: Handles communication between extension components

### TypeScript Types

- Complete type definitions for all data structures
- Chrome extension API types
- Component prop types

## Build Configuration

### Vite Config

The project uses Vite with multiple entry points for different extension pages:

- `popup`: Extension popup interface
- `options`: Options/settings page
- `review`: Review session page
- `analytics`: Analytics dashboard
- `content`: Content script for web page integration
- `serviceWorker`: Background service worker

### TailwindCSS

- Custom color palette for the extension
- Component classes for buttons, cards, inputs
- Responsive design utilities
- Custom animations and transitions

## Migration Notes

### From Vanilla JS to React

- HTML templates converted to React components
- Event handlers converted to React event handlers
- DOM manipulation replaced with React state management
- CSS classes converted to TailwindCSS utilities

### From Vanilla CSS to TailwindCSS

- Custom CSS converted to TailwindCSS utility classes
- Component styles extracted to reusable classes
- Responsive design implemented with TailwindCSS breakpoints
- Dark mode support added

### Chrome Extension Specific

- Manifest V3 compatibility maintained
- Content script integration preserved
- Service worker functionality enhanced
- Storage API integration improved

## Development Tips

### Hot Reload

- Vite provides hot module replacement for React components
- Changes to components update instantly without full page reload
- Content scripts and service workers require extension reload

### Debugging

- Use Chrome DevTools for debugging React components
- Service worker debugging in `chrome://extensions/`
- Content script debugging in page DevTools

### Testing

- Test in Chrome extension environment
- Verify all extension permissions work correctly
- Test content script integration on various websites

## Deployment

1. Build the extension: `npm run build`
2. Zip the `dist/` folder contents
3. Upload to Chrome Web Store or distribute as unpacked extension

## Troubleshooting

### Common Issues

1. **Build Errors**: Check TypeScript types and imports
2. **Extension Not Loading**: Verify manifest.json paths are correct
3. **Content Script Issues**: Check CSP and permissions
4. **Storage Issues**: Verify Chrome storage API usage

### Performance

- React components are optimized with proper key props
- TailwindCSS purges unused styles in production
- Vite provides efficient bundling and code splitting

## Contributing

1. Follow React best practices
2. Use TypeScript for type safety
3. Maintain TailwindCSS utility-first approach
4. Test in Chrome extension environment
5. Update documentation for new features
