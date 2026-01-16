import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { Copyright } from './Copyright'
import { User, LogOut } from 'lucide-react'

export function Layout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    setIsAuthenticated(!!token)
    setLoading(false)

    if (token) {
      loadCurrentUser()
    }
  }, [])

  const loadCurrentUser = () => {
    const userData = localStorage.getItem('clientUser')
    if (userData) {
      setCurrentUser(JSON.parse(userData))
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
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">EnSQL</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a
                  href="/dashboard"
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Ana Sayfa
                </a>
                <a
                  href="/reports"
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Raporlar
                </a>
                <a
                  href="/settings"
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Ayarlar
                </a>
                <a
                  href="/sessions"
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Oturumlar
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />

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
                    {currentUser?.companyName || currentUser?.username || 'Kullanıcı'}
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-gray-200 dark:border-gray-700">
        <Copyright />
      </footer>
    </div>
  )
}
