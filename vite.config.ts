import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'assets/*',
          dest: 'assets'
        },
        {
          src: 'manifest.json',
          dest: '.'
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(process.cwd(), 'src/popup/index.html'),
        options: resolve(process.cwd(), 'src/options/index.html'),
        review: resolve(process.cwd(), 'src/review/index.html'),
        analytics: resolve(process.cwd(), 'src/analytics/index.html'),
        content: resolve(process.cwd(), 'src/content/index.ts'),
        serviceWorker: resolve(process.cwd(), 'src/service-worker/index.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'serviceWorker') {
            return 'src/core/serviceWorker.js'
          }
          if (chunkInfo.name === 'content') {
            return 'src/content/index.js'
          }
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.indexOf('.html') !== -1) {
            return assetInfo.name
          }
          return 'assets/[name]-[hash].[ext]'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src')
    }
  }
})
