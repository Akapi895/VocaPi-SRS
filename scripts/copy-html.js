import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

const distDir = 'dist';
const htmlFiles = [
  { src: 'src/popup/index.html', dest: 'popup.html' },
  { src: 'src/options/index.html', dest: 'options.html' },
  { src: 'src/review/index.html', dest: 'review.html' },
  { src: 'src/analytics/index.html', dest: 'analytics.html' }
];

console.log('Copying HTML files to root...');

htmlFiles.forEach(({ src, dest }) => {
  const srcPath = join(distDir, src);
  const destPath = join(distDir, dest);
  
  if (existsSync(srcPath)) {
    copyFileSync(srcPath, destPath);
    console.log(`✓ Copied ${src} → ${dest}`);
  } else {
    console.log(`✗ Source file not found: ${srcPath}`);
  }
});

console.log('HTML files copied successfully!');
