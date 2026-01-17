import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

export function AutoLogin() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    const userStr = searchParams.get('user')
    const deviceId = searchParams.get('deviceId')

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr))

        // Token ve user bilgilerini kaydet
        localStorage.setItem('clientToken', token)
        localStorage.setItem('clientUser', JSON.stringify(user))
        if (deviceId) {
          localStorage.setItem('deviceId', deviceId)
        }

        // Admin panelden geldiğini işaretle (PWA install prompt'ları gösterilmeyecek)
        localStorage.setItem('isFromAdminPanel', 'true')

        toast.success(`${user.companyName || user.username} olarak giriş yapıldı`)

        // Ana sayfaya yönlendir
        navigate('/dashboard', { replace: true })
      } catch (error) {
        console.error('Auto login error:', error)
        toast.error('Otomatik giriş başarısız')
        navigate('/login', { replace: true })
      }
    } else {
      toast.error('Geçersiz giriş linki')
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Giriş yapılıyor...</p>
      </div>
    </div>
  )
}
