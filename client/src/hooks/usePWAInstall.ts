import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isFromAdminPanel, setIsFromAdminPanel] = useState(false)

  useEffect(() => {
    // Admin panelden gelip gelmediğini kontrol et
    const fromAdmin = localStorage.getItem('isFromAdminPanel') === 'true'
    setIsFromAdminPanel(fromAdmin)

    // beforeinstallprompt event'ini yakala
    const handler = (e: Event) => {
      // Admin panelden gelmişse prompt'u gösterme
      if (fromAdmin) {
        return
      }

      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Uygulama zaten kurulmuş mu kontrol et
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) {
      return
    }

    try {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice

      setDeferredPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('PWA kurulum hatası:', error)
    }
  }

  return {
    isInstallable,
    isFromAdminPanel,
    install
  }
}
