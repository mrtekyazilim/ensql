import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { ThemeToggle } from '../components/ThemeToggle'
import { Monitor, Smartphone, Tablet, Zap, Shield, TrendingUp } from 'lucide-react'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/dashboard'

  // DeviceId oluştur veya al
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId')
    if (!deviceId) {
      deviceId = crypto.randomUUID()
      localStorage.setItem('deviceId', deviceId)
    }
    return deviceId
  }

  const getBrowserInfo = () => {
    const ua = navigator.userAgent
    let browserName = 'Bilinmeyen'

    if (ua.indexOf('Chrome') > -1) browserName = 'Chrome'
    else if (ua.indexOf('Safari') > -1) browserName = 'Safari'
    else if (ua.indexOf('Firefox') > -1) browserName = 'Firefox'
    else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) browserName = 'Internet Explorer'
    else if (ua.indexOf('Edge') > -1) browserName = 'Edge'

    return `${browserName} - ${navigator.platform}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const deviceId = getDeviceId()
      const browserInfo = getBrowserInfo()

      const response = await axios.post('http://localhost:13201/api/auth/client/login', {
        username,
        password,
        deviceId,
        deviceName: browserInfo,
        browserInfo
      })

      if (response.data.success) {
        localStorage.setItem('clientToken', response.data.token)
        localStorage.setItem('clientUser', JSON.stringify(response.data.user))
        navigate(from, { replace: true })
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Giriş başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Sol Taraf - Tanıtım */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-950 p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="relative z-10 max-w-xl">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white mb-4">EnSQL</h1>
            <p className="text-xl text-blue-100">Şirket Raporlama Sistemi</p>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-semibold text-white mb-6">
              Raporlama Windows, Web, Android, iOS Heryerden Şirket Raporlarınıza Anında Erişebilirsiniz
            </h2>
            <p className="text-lg text-blue-100">
              Modern, güvenli ve hızlı raporlama deneyimi ile işinizi kolaylaştırın.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Çoklu Platform Desteği</h3>
                <p className="text-blue-100">Windows, Web, Android ve iOS üzerinden kesintisiz erişim</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Gerçek Zamanlı Raporlama</h3>
                <p className="text-blue-100">Verilerinize anında ulaşın, hızlı kararlar alın</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Güvenli ve Hızlı</h3>
                <p className="text-blue-100">Kurumsal güvenlik standartlarında veri koruması</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Özelleştirilebilir Raporlar</h3>
                <p className="text-blue-100">İhtiyacınıza özel rapor tasarımları oluşturun</p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center space-x-6">
            <Smartphone className="w-8 h-8 text-blue-200" />
            <Tablet className="w-8 h-8 text-blue-200" />
            <Monitor className="w-8 h-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Sağ Taraf - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-2xl">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Giriş Yap
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Rapor sistemine erişmek için giriş yapın
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
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder="Kullanıcı adınızı girin"
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
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder="Şifrenizi girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>
            </div>
          </form>

          {/* Mobil için Özellikler */}
          <div className="lg:hidden pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
              Windows, Web, Android, iOS heryerden erişim
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <Tablet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
