import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/nse': {
        target: `http://localhost:${process.env.NSE_PROXY_PORT || 5175}`,
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'https://dev-api.ranevra.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
