import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { ThemeToggle } from '../components/ThemeToggle'
import { Settings, Users, BarChart3, Shield } from 'lucide-react'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post('http://localhost:13201/api/auth/admin/login', {
        username,
        password
      })

      if (response.data.success) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        navigate(from, { replace: true })
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Giriş başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-5xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="grid md:grid-cols-5">
          {/* Sol Taraf - Tanıtım */}
          <div className="hidden md:block md:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-900 dark:to-purple-950 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
            <div className="relative z-10 h-full flex flex-col justify-center">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">EnSQL</h1>
                <p className="text-lg text-indigo-100 font-medium">Admin Panel</p>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-white text-sm leading-relaxed">
                  Müşterilerinizin raporlarını merkezi olarak yönetin. Kullanıcı tanımlamaları, rapor tasarımları ve sistem ayarlarını tek noktadan kontrol edin.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Kullanıcı Yönetimi</p>
                    <p className="text-indigo-200 text-xs">Müşteri hesaplarını kolayca yönetin</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Rapor Tasarımı</p>
                    <p className="text-indigo-200 text-xs">SQL sorguları ile özel raporlar</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Sistem Ayarları</p>
                    <p className="text-indigo-200 text-xs">Merkezi yapılandırma kontrolleri</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Güvenli Erişim</p>
                    <p className="text-indigo-200 text-xs">Rol tabanlı yetkilendirme</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Taraf - Login Form */}
          <div className="md:col-span-3 p-10">
            <div className="max-w-md mx-auto">
              <div>
                <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                  Admin Girişi
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                  Yönetim paneline erişmek için giriş yapın
                </p>
              </div>
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                    <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kullanıcı Adı
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                      placeholder="Admin kullanıcı adınızı girin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Şifre
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                      placeholder="Admin şifrenizi girin"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </button>
                </div>
              </form>

              {/* Mobil için Kısa Tanıtım */}
              <div className="md:hidden mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Kullanıcı yönetimi, rapor tasarımı ve sistem ayarları
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
