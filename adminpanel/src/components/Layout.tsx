import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { Copyright } from './Copyright'
import { LayoutDashboard, Users, FileText, Activity, User, ChevronDown, LogOut } from 'lucide-react'

export function Layout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

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
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">EnSQL Admin</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a
                  href="/dashboard"
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-1"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </a>
                <a
                  href="/users"
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-1"
                >
                  <Users className="h-4 w-4" />
                  Müşteriler
                </a>
                <a
                  href="/reports"
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-1"
                >
                  <FileText className="h-4 w-4" />
                  Raporlar
                </a>
                <a
                  href="/sessions"
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-1"
                >
                  <Activity className="h-4 w-4" />
                  Oturumlar
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <div className="relative ml-4">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">Admin</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 z-20 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <a
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Profil
                        </a>
                        <button
                          onClick={() => {
                            localStorage.removeItem('token')
                            window.location.href = '/login'
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Çıkış
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
