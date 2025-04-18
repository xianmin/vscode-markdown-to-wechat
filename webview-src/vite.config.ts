import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../media/webview',
    emptyOutDir: true,
    // 使用固定文件名
    rollupOptions: {
      output: {
        entryFileNames: 'assets/main.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/main.[ext]',
      },
    },
    // 这样构建会生成相对路径的资源引用，适合在 VSCode WebView 中使用
    assetsDir: 'assets',
  },
  // VSCode WebView 中需要调整基本路径
  base: './',
})
