import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = 'https://voicemitra-production.up.railway.app'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api':    { target: BACKEND, changeOrigin: true },
      '/audio':  { target: BACKEND, changeOrigin: true },
      '/health': { target: BACKEND, changeOrigin: true },
    },
  },
})
