import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

export function Profile() {
  const [loading, setLoading] = useState(false)
  const [partnerInfo, setPartnerInfo] = useState<any>(null)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    loadPartnerInfo()
  }, [])

  const loadPartnerInfo = async () => {
    try {
      const token = localStorage.getItem('partnerToken')
      const response = await axios.get('http://localhost:13201/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setPartnerInfo(response.data.user)
      }
    } catch (error) {
      console.error('Partner bilgisi yüklenemedi:', error)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('partnerToken')
      const response = await axios.put(
        'http://localhost:13201/api/auth/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        toast.success('Şifre başarıyla değiştirildi')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Şifre değiştirilemedi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Partner Bilgileri */}
      {partnerInfo && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Partner Bilgileri
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Partner İsmi</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-semibold">{partnerInfo.partnerName || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Partner Kodu</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-semibold">{partnerInfo.partnerCode || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Kullanıcı Adı</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{partnerInfo.username || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Şehir</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{partnerInfo.sehir || '-'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Hizmet Bitiş Tarihi</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {partnerInfo.hizmetBitisTarihi ? (() => {
                    const bitisTarihi = new Date(partnerInfo.hizmetBitisTarihi)
                    const bugun = new Date()
                    const gunFarki = Math.ceil((bitisTarihi.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24))

                    if (gunFarki <= 60 && gunFarki > 0) {
                      return (
                        <>
                          {bitisTarihi.toLocaleDateString('tr-TR')} - <span className="font-semibold text-red-600 dark:text-red-400">{gunFarki} Gün kaldı</span>
                        </>
                      )
                    } else if (gunFarki <= 0) {
                      return (
                        <>
                          {bitisTarihi.toLocaleDateString('tr-TR')} - <span className="font-semibold text-red-600 dark:text-red-400">Süresi doldu</span>
                        </>
                      )
                    } else {
                      return bitisTarihi.toLocaleDateString('tr-TR')
                    }
                  })() : '-'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Şifre Değiştirme */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-6">
            Şifre Değiştir
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mevcut Şifre
              </label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Yeni Şifre
              </label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Yeni Şifre (Tekrar)
              </label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
