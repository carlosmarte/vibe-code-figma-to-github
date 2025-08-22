import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3200',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@shared': '../shared'
    }
  }
})
