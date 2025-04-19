import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/main-dev.js',
        chunkFileNames: 'assets/[name]-dev.js',
        assetFileNames: 'assets/main-dev.[ext]',
      },
    },
  },
})
