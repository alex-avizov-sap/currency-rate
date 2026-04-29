import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../app',
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/currency': 'http://localhost:4004'
    }
  }
})
