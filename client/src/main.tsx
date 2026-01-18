import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// PWA Service Worker registration - vite-plugin-pwa otomatik
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Yeni versiyon mevcut. Güncellemek ister misiniz?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    // App ready for offline use
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
