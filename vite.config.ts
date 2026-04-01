import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Capacitor on Android WebView: the `crossorigin` attribute that Vite adds to
// every <script> and <link> tag triggers CORS preflight requests. Even though
// Capacitor serves from http://localhost, the WebView rejects these silently →
// scripts never load → blank white screen with no error.
// This plugin strips every crossorigin attribute and removes modulepreload hints
// (which also carry crossorigin and are unnecessary for an offline APK).
function capacitorCompatPlugin() {
  return {
    name: 'capacitor-compat',
    transformIndexHtml(html: string): string {
      return html
        .replace(/\s+crossorigin(?:="[^"]*")?/g, '')
        .replace(/<link rel="modulepreload"[^>]*>\n?/g, '')
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), capacitorCompatPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
})
