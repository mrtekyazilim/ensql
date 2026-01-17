import { useState, useEffect } from 'react'
import axios from 'axios'
import { Building2, Filter } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  _id: string
  companyName?: string
  username: string
  hizmetBitisTarihi: string
  aktif: boolean
  kullanimIstatistikleri?: {
    toplamSorguSayisi: number
    sonGirisTarihi?: string
  }
}

export function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [filter, setFilter] = useState<'all' | '1month' | '3months' | '6months' | '1year'>('all')

  // Default hizmet bitiş tarihi: 2 ay sonrası
  const getDefaultBitisTarihi = () => {
    const date = new Date()
    date.setMonth(date.getMonth() + 2)
    return date.toISOString().split('T')[0]
  }

  // Metni Title Case'e çevir (Her kelimenin baş harfi büyük)
  const toTitleCase = (text: string) => {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Hizmet bitiş tarihine göre aktif/pasif kontrolü
  const isUserActive = (hizmetBitisTarihi: string) => {
    return new Date(hizmetBitisTarihi) > new Date()
  }

  // Kullanıcıları filtrele
  const getFilteredUsers = () => {
    const now = new Date()
    const filtered = users.filter(user => {
      const bitisTarihi = new Date(user.hizmetBitisTarihi)
      const diffTime = bitisTarihi.getTime() - now.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)

      switch (filter) {
        case '1month':
          return diffDays > 0 && diffDays <= 30
        case '3months':
          return diffDays > 0 && diffDays <= 90
        case '6months':
          return diffDays > 0 && diffDays <= 180
        case '1year':
          return diffDays > 0 && diffDays <= 365
        default:
          return true
      }
    })
    return filtered
  }

  const [formData, setFormData] = useState({
    companyName: '',
    username: '',
    password: '',
    hizmetBitisTarihi: getDefaultBitisTarihi()
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:13201/api/customers', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setUsers(response.data.customers)
      }
    } catch (error) {
      console.error('Users loading error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')

      // Company name'i Title Case'e çevir
      const formattedData = {
        ...formData,
        companyName: formData.companyName ? toTitleCase(formData.companyName) : ''
      }

      const response = await axios.post('http://localhost:13201/api/customers', formattedData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setShowModal(false)
        setFormData({
          companyName: '',
          username: '',
          password: '',
          hizmetBitisTarihi: getDefaultBitisTarihi()
        })
        toast.success('Müşteri başarıyla oluşturuldu!')
        loadUsers()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Müşteri oluşturulamadı')
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setFormData({
      companyName: user.companyName || '',
      username: user.username,
      password: '', // Şifre değiştirilmeyecekse boş bırak
      hizmetBitisTarihi: new Date(user.hizmetBitisTarihi).toISOString().split('T')[0]
    })
    setEditMode(true)
    setShowModal(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const token = localStorage.getItem('token')

      // Company name'i Title Case'e çevir
      const formattedData = {
        companyName: formData.companyName ? toTitleCase(formData.companyName) : '',
        username: formData.username,
        hizmetBitisTarihi: formData.hizmetBitisTarihi,
        ...(formData.password && { password: formData.password }) // Şifre varsa ekle
      }

      const response = await axios.put(
        `http://localhost:13201/api/customers/${editingUser._id}`,
        formattedData,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        setShowModal(false)
        setEditMode(false)
        setEditingUser(null)
        setFormData({
          companyName: '',
          username: '',
          password: '',
          hizmetBitisTarihi: getDefaultBitisTarihi()
        })
        toast.success('Müşteri başarıyla güncellendi!')
        loadUsers()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Müşteri güncellenemedi')
    }
  }

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Müşteriler</h2>
        <div className="flex items-center gap-3 mt-3 sm:mt-0">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tüm Müşteriler</option>
              <option value="1month">1 Ay İçinde Dolacak</option>
              <option value="3months">3 Ay İçinde Dolacak</option>
              <option value="6months">6 Ay İçinde Dolacak</option>
              <option value="1year">1 Yıl İçinde Dolacak</option>
            </select>
          </div>
          <button
            onClick={() => {
              setFormData({
                companyName: '',
                username: '',
                password: '',
                hizmetBitisTarihi: getDefaultBitisTarihi()
              })
              setShowModal(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Yeni Müşteri
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {getFilteredUsers().map((user) => (
            <li key={user._id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {user.companyName && (
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {user.companyName}
                        </p>
                      </div>
                    )}
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate mb-2">
                      {user.username}
                    </p>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Hizmet Bitiş: {new Date(user.hizmetBitisTarihi).toLocaleDateString('tr-TR')}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sorgu Sayısı: {user.kullanimIstatistikleri?.toplamSorguSayisi || 0}
                      </p>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isUserActive(user.hizmetBitisTarihi)
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                        {isUserActive(user.hizmetBitisTarihi) ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                    >
                      Düzenle
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={editMode ? handleUpdateUser : handleCreateUser} autoComplete="off">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                    {editMode ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Oluştur'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Müşteri/Şirket İsmi</label>
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Örn: Acme Corporation"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kullanıcı Adı</label>
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Giriş için kullanılacak"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şifre{editMode && ' (Değiştirmek istemiyorsanız boş bırakın)'}</label>
                      <input
                        type="password"
                        required={!editMode}
                        autoComplete="new-password"
                        placeholder={editMode ? 'Değiştirmek için yeni şifre girin' : ''}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hizmet Bitiş Tarihi</label>
                      <input
                        type="date"
                        required
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.hizmetBitisTarihi}
                        onChange={(e) => setFormData({ ...formData, hizmetBitisTarihi: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editMode ? 'Güncelle' : 'Oluştur'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditMode(false)
                      setEditingUser(null)
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
