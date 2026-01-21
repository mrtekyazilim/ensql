import { useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

export function Profile() {
  const [loading, setLoading] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

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
    <div className="max-w-2xl mx-auto">
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
