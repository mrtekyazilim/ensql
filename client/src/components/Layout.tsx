import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { Copyright } from './Copyright'
import { Logo } from './Logo'
import { PWAInstallBanner } from './PWAInstallBanner'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { User, LogOut, Database, ChevronDown, Settings, Monitor, Download } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'

export function Layout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showConnectorMenu, setShowConnectorMenu] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [connectors, setConnectors] = useState<any[]>([])
  const [activeConnector, setActiveConnector] = useState<any>(null)
  const location = useLocation()
  const { isInstallable, isFromAdminPanel, install } = usePWAInstall()

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    setIsAuthenticated(!!token)
    setLoading(false)

    if (token) {
      loadCurrentUser()
      loadConnectors()
    }
  }, [])

  const loadCurrentUser = () => {
    const userData = localStorage.getItem('clientUser')
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }

  const loadConnectors = async () => {
    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.get('http://localhost:13201/api/connectors', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setConnectors(response.data.connectors)

        // localStorage'dan aktif connector'ı yükle
        const savedConnectorId = localStorage.getItem('activeConnectorId')
        if (savedConnectorId) {
          const connector = response.data.connectors.find((c: any) => c._id === savedConnectorId)
          if (connector) {
            setActiveConnector(connector)
          }
        }
      }
    } catch (error) {
      console.error('Connectors loading error:', error)
    }
  }

  const handleConnectorChange = async (connector: any) => {
    try {
      setActiveConnector(connector)
      localStorage.setItem('activeConnectorId', connector._id)
      setShowConnectorMenu(false)

      // Session'ı güncelle
      const token = localStorage.getItem('clientToken')
      const deviceId = localStorage.getItem('deviceId')

      await axios.put(
        'http://localhost:13201/api/sessions/active-connector',
        { deviceId, connectorId: connector._id },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success(`Aktif connector: ${connector.connectorName}`)
    } catch (error) {
      console.error('Connector change error:', error)
      toast.error('Connector değiştirilemedi')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('clientToken')
    localStorage.removeItem('clientUser')
    window.location.href = '/login'
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* PWA Install Banner */}
      <PWAInstallBanner />

      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <a href="/dashboard" className="hover:opacity-80 transition-opacity cursor-pointer group">
                  <Logo size="md" variant="default" />
                </a>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a
                  href="/reports"
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Raporlar
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Connector Selector - Desktop */}
              {connectors.length > 0 && (
                <div className="hidden sm:block relative">
                  <button
                    onClick={() => setShowConnectorMenu(!showConnectorMenu)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
                  >
                    <Database className="w-4 h-4" />
                    <span className="font-medium">
                      {activeConnector?.connectorName || 'Connector Seçin'}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showConnectorMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowConnectorMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20 max-h-80 overflow-y-auto">
                        <div className="py-1">
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Connector Seçin
                          </div>
                          {connectors.map((connector) => (
                            <button
                              key={connector._id}
                              onClick={() => handleConnectorChange(connector)}
                              className={`w-full text-left px-4 py-2 text-sm ${activeConnector?._id === connector._id
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                              <div className="flex items-center">
                                <Database className="w-4 h-4 mr-3" />
                                <div>
                                  <div className="font-medium">{connector.connectorName}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {connector.sqlServerConfig.server}:{connector.sqlServerConfig.port}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}


              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
                >
                  <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="hidden md:block font-medium">
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20">
                      <div className="py-1">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {currentUser?.companyName || 'Müşteri'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {currentUser?.username}
                          </p>
                        </div>

                        <a
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profil
                        </a>

                        <a
                          href="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Ayarlar
                        </a>

                        {isInstallable && !isFromAdminPanel && (
                          <button
                            onClick={() => {
                              install()
                              setShowUserMenu(false)
                            }}
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Download className="w-4 h-4 mr-3" />
                            Uygulamayı Yükle
                          </button>
                        )}

                        <a
                          href="/sessions"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Monitor className="w-4 h-4 mr-3" />
                          Oturumlar
                        </a>

                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                        <div className="px-4 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Tema</span>
                            <ThemeToggle />
                          </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Connector Selector - Mobile */}
      {connectors.length > 0 && (
        <div className="sm:hidden bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-2">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Aktif Connector
          </label>
          <select
            value={activeConnector?._id || ''}
            onChange={(e) => {
              const connector = connectors.find(c => c._id === e.target.value)
              if (connector) handleConnectorChange(connector)
            }}
            className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Connector Seçin</option>
            {connectors.map((connector) => (
              <option key={connector._id} value={connector._id}>
                {connector.connectorName} ({connector.sqlServerConfig.server})
              </option>
            ))}
          </select>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-gray-200 dark:border-gray-700">
        <Copyright />
      </footer>
    </div>
  )
}
