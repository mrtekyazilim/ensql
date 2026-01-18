import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      includeAssets: ['img/icon.png', 'img/icon-192.png', 'img/icon-512.png'],
      manifest: {
        name: 'EnSQL - Rapor Sistemi',
        short_name: 'EnSQL',
        description: 'SQL Server bazlı rapor görüntüleme uygulaması',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/img/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/img/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globDirectory: 'dist',
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        navigateFallbackAllowlist: [/.*/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        disableDevLogs: true,
        mode: 'production',
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:13201\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 dakika
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 13203,
    proxy: {
      '/api': {
        target: 'http://localhost:13201',
        changeOrigin: true,
      },
    },
  },
})
