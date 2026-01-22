import { useState, useEffect } from 'react'
import axios from 'axios'
import { Building2, Filter, Search, Edit2, Trash2, ExternalLink, Users as UsersIcon, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import config from '../config.js'

interface User {
  _id: string
  companyName?: string
  username: string
  hizmetBitisTarihi: string
  aktif: boolean
  iletisimBilgileri?: {
    yetkiliKisi?: string
    cepTelefonu?: string
    email?: string
    faturaAdresi?: string
    sehir?: string
  }
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
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

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
    let filtered = users.filter(user => {
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

    // Arama filtresi
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user =>
        user.companyName?.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  const [formData, setFormData] = useState({
    companyName: '',
    username: '',
    password: '',
    hizmetBitisTarihi: getDefaultBitisTarihi(),
    yetkiliKisi: '',
    cepTelefonu: '',
    email: '',
    faturaAdresi: '',
    sehir: ''
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.get(`${config.API_URL}/customers`, {
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
      const token = localStorage.getItem('adminToken')

      // Company name'i Title Case'e çevir
      const formattedData = {
        companyName: formData.companyName ? toTitleCase(formData.companyName) : '',
        username: formData.username,
        password: formData.password,
        hizmetBitisTarihi: formData.hizmetBitisTarihi,
        iletisimBilgileri: {
          yetkiliKisi: formData.yetkiliKisi || undefined,
          cepTelefonu: formData.cepTelefonu || undefined,
          email: formData.email || undefined,
          faturaAdresi: formData.faturaAdresi || undefined,
          sehir: formData.sehir || undefined
        }
      }

      const response = await axios.post(`${config.API_URL}/customers`, formattedData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setShowModal(false)
        setFormData({
          companyName: '',
          username: '',
          password: '',
          hizmetBitisTarihi: getDefaultBitisTarihi(),
          yetkiliKisi: '',
          cepTelefonu: '',
          email: '',
          faturaAdresi: '',
          sehir: ''
        })
        toast.success('Partner başarıyla oluşturuldu!')
        loadUsers()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Partner oluşturulamadı')
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setFormData({
      companyName: user.companyName || '',
      username: user.username,
      password: '', // Şifre değiştirilmeyecekse boş bırak
      hizmetBitisTarihi: new Date(user.hizmetBitisTarihi).toISOString().split('T')[0],
      yetkiliKisi: user.iletisimBilgileri?.yetkiliKisi || '',
      cepTelefonu: user.iletisimBilgileri?.cepTelefonu || '',
      email: user.iletisimBilgileri?.email || '',
      faturaAdresi: user.iletisimBilgileri?.faturaAdresi || '',
      sehir: user.iletisimBilgileri?.sehir || ''
    })
    setEditMode(true)
    setShowModal(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const token = localStorage.getItem('adminToken')

      // Company name'i Title Case'e çevir
      const formattedData: any = {
        companyName: formData.companyName ? toTitleCase(formData.companyName) : '',
        username: formData.username,
        hizmetBitisTarihi: formData.hizmetBitisTarihi,
        iletisimBilgileri: {
          yetkiliKisi: formData.yetkiliKisi || undefined,
          cepTelefonu: formData.cepTelefonu || undefined,
          email: formData.email || undefined,
          faturaAdresi: formData.faturaAdresi || undefined,
          sehir: formData.sehir || undefined
        }
      }

      // Şifre varsa ekle
      if (formData.password) {
        formattedData.password = formData.password
      }

      const response = await axios.put(
        `${config.API_URL}/customers/${editingUser._id}`,
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
          hizmetBitisTarihi: getDefaultBitisTarihi(),
          yetkiliKisi: '',
          cepTelefonu: '',
          email: '',
          faturaAdresi: '',
          sehir: ''
        })
        toast.success('Partner başarıyla güncellendi!')
        loadUsers()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Partner güncellenemedi')
    }
  }

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user)
    setDeleteConfirmText('')
    setShowDeleteModal(true)
  }

  const confirmDeleteUser = async () => {
    if (!deletingUser) return

    if (deleteConfirmText !== deletingUser.username) {
      toast.error('Kullanıcı adı eşleşmiyor!')
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.delete(
        `${config.API_URL}/customers/${deletingUser._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        setShowDeleteModal(false)
        setDeletingUser(null)
        setDeleteConfirmText('')
        toast.success('Partner başarıyla silindi!')
        loadUsers()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Partner silinemedi')
    }
  }

  const handleConnectToClient = async (user: User) => {
    try {
      const token = localStorage.getItem('adminToken')
      const deviceId = `admin-panel-${Date.now()}`

      const response = await axios.post(
        `${config.API_URL}/auth/admin-login-as-customer/${user._id}`,
        {
          deviceId,
          deviceName: 'Admin Panel',
          browserInfo: navigator.userAgent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        // Client token'ı URL parametresi olarak gönder
        const clientUrl = `${config.CLIENT_URL}/auto-login?token=${encodeURIComponent(response.data.token)}&user=${encodeURIComponent(JSON.stringify(response.data.user))}&deviceId=${encodeURIComponent(deviceId)}`

        // Client uygulamasını aç
        window.open(clientUrl, '_blank')
        toast.success(`${user.companyName || user.username} hesabına bağlanıldı`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bağlantı başarısız')
    }
  }

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  // İstatistikleri hesapla
  const now = new Date()
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const totalUsers = users.length
  const activeUsers = users.filter(u => isUserActive(u.hizmetBitisTarihi)).length
  const inactiveUsers = totalUsers - activeUsers
  const expiringSoon = users.filter(u => {
    const bitisTarihi = new Date(u.hizmetBitisTarihi)
    return bitisTarihi > now && bitisTarihi <= oneMonthFromNow
  }).length

  return (
    <div>
      <div className="mb-6">
        <div className="sm:flex sm:items-center sm:justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Partnerler</h2>
          <button
            onClick={() => {
              setFormData({
                companyName: '',
                username: '',
                password: '',
                hizmetBitisTarihi: getDefaultBitisTarihi(),
                yetkiliKisi: '',
                cepTelefonu: '',
                email: '',
                faturaAdresi: '',
                sehir: ''
              })
              setEditMode(false)
              setEditingUser(null)
              setShowModal(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 mt-3 sm:mt-0"
          >
            Yeni Partner
          </button>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 overflow-hidden shadow-lg rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-8 w-8 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-blue-100 truncate">Toplam Partner</dt>
                    <dd className="text-3xl font-bold text-white">{totalUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 overflow-hidden shadow-lg rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-green-100 truncate">Aktif Partner</dt>
                    <dd className="text-3xl font-bold text-white">{activeUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 overflow-hidden shadow-lg rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-red-100 truncate">Pasif Partner</dt>
                    <dd className="text-3xl font-bold text-white">{inactiveUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 overflow-hidden shadow-lg rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-yellow-100 truncate">1 Ay İçinde Dolacak</dt>
                    <dd className="text-3xl font-bold text-white">{expiringSoon}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Partner kodu veya ismi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full sm:w-auto pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tüm Partnerler</option>
              <option value="1month">1 Ay İçinde Dolacak</option>
              <option value="3months">3 Ay İçinde Dolacak</option>
              <option value="6months">6 Ay İçinde Dolacak</option>
              <option value="1year">1 Yıl İçinde Dolacak</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {getFilteredUsers().map((user) => (
            <li key={user._id} className="mt-2 first:mt-0">
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

                    {/* İletişim Bilgileri - Daima görünsün */}
                    <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Yetkili:</span>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          {user.iletisimBilgileri?.yetkiliKisi || '-'}
                        </span>
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Telefon:</span>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          {user.iletisimBilgileri?.cepTelefonu || '-'}
                        </span>
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Email:</span>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          {user.iletisimBilgileri?.email || '-'}
                        </span>
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Şehir:</span>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          {user.iletisimBilgileri?.sehir || '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Hizmet Bitiş: {new Date(user.hizmetBitisTarihi).toLocaleDateString('tr-TR')}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sorgu Sayısı: {user.kullanimIstatistikleri?.toplamSorguSayisi || 0}
                      </p>
                      {user.kullanimIstatistikleri?.sonGirisTarihi && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Son Aktivite: {new Date(user.kullanimIstatistikleri.sonGirisTarihi).toLocaleDateString('tr-TR')} {new Date(user.kullanimIstatistikleri.sonGirisTarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isUserActive(user.hizmetBitisTarihi)
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                        {isUserActive(user.hizmetBitisTarihi) ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleConnectToClient(user)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                      title="Client uygulamasına bağlan"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Bağlan
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1.5 border border-transparent rounded-md text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                        title="Düzenle"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-1.5 border border-transparent rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        title="Sil"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
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
                    {editMode ? 'Partner Düzenle' : 'Yeni Partner Oluştur'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Partner İsmi</label>
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

                    {/* İletişim Bilgileri */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">İletişim Bilgileri (Opsiyonel)</h4>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Yetkili Kişi</label>
                          <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Örn: Ahmet Yılmaz"
                            value={formData.yetkiliKisi}
                            onChange={(e) => setFormData({ ...formData, yetkiliKisi: e.target.value })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cep Telefonu</label>
                            <input
                              type="tel"
                              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="0532 123 4567"
                              value={formData.cepTelefonu}
                              onChange={(e) => setFormData({ ...formData, cepTelefonu: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                              type="email"
                              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="ornek@firma.com"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fatura Adresi</label>
                          <textarea
                            rows={2}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Cadde, sokak, mahalle..."
                            value={formData.faturaAdresi}
                            onChange={(e) => setFormData({ ...formData, faturaAdresi: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şehir</label>
                          <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Örn: İstanbul"
                            value={formData.sehir}
                            onChange={(e) => setFormData({ ...formData, sehir: e.target.value })}
                          />
                        </div>
                      </div>
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

      {showDeleteModal && deletingUser && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 transition-opacity" onClick={() => setShowDeleteModal(false)}></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Partner Sil
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-white">{deletingUser.companyName || deletingUser.username}</strong> partnerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Onaylamak için aşağıdaki kullanıcı adını yazın:
                      </p>
                      <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded mb-3">
                        {deletingUser.username}
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Kullanıcı adını buraya yazın"
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDeleteUser}
                  disabled={deleteConfirmText !== deletingUser.username}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sil
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeletingUser(null)
                    setDeleteConfirmText('')
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
