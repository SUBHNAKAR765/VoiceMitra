import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://voicemitra-production.up.railway.app',
        changeOrigin: true,
      },
      '/audio': {
        target: 'https://voicemitra-production.up.railway.app',
        changeOrigin: true,
      },
      '/health': {
        target: 'https://voicemitra-production.up.railway.app',
        changeOrigin: true,
      },
    },
  },
})
