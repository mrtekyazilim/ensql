import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  // Development'ta config.dev.js'i config.js olarak kopyala
  if (command === 'serve') {
    const configDevPath = path.resolve(__dirname, './src/config.dev.js')
    const configPath = path.resolve(__dirname, './src/config.js')
    if (fs.existsSync(configDevPath)) {
      fs.copyFileSync(configDevPath, configPath)
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: '../dist/partner',
      emptyOutDir: true,
    },
    server: {
      port: 13202,
      proxy: {
        '/api': {
          target: 'http://localhost:13201',
          changeOrigin: true,
        },
      },
    },
  }
})
