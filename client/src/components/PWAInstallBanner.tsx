import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'

export function PWAInstallBanner() {
  const { isInstallable, isFromAdminPanel, install } = usePWAInstall()
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-banner-dismissed') === 'true'
    setIsDismissed(dismissed)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', 'true')
    setIsDismissed(true)
  }

  const handleInstall = async () => {
    await install()
    handleDismiss()
  }

  // Admin panelden gelmişse veya dismiss edilmişse veya kurulabilir değilse gösterme
  if (isFromAdminPanel || isDismissed || !isInstallable) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 dark:from-blue-600 to-indigo-700 dark:to-indigo-950 text-white px-4 py-3 shadow-md">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Download className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm sm:text-base font-medium truncate">
            EnSQL uygulamasını cihazınıza yükleyin
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="px-4 py-1.5 text-sm font-medium bg-white text-blue-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Yükle
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
