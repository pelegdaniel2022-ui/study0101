import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'

// viteSingleFile inlines ALL JS and CSS directly into index.html.
// This means zero external HTTP requests, zero CORS issues, zero module
// loading failures — the single biggest source of Android WebView blank
// screens with Capacitor. One self-contained HTML file loads perfectly
// on every Android WebView version.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Required by vite-plugin-singlefile
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 100_000,
  },
})
