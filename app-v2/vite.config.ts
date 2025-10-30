import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Allow external tunnels (ngrok, etc.). For dev only.
    allowedHosts: true,
    proxy: {
      // Proxy API calls to the local knowledge/chat server on 3001
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Raise warning threshold; this only affects warnings, not output size
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Create separate chunks for large deps to improve caching and load times
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react'
            if (id.includes('three')) return 'three'
            if (id.includes('framer-motion')) return 'motion'
            return 'vendor'
          }
        }
      }
    }
  }
})
