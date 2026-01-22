import { useState, useEffect } from 'react'
import axios from 'axios'
import { Building2, Search, Edit2, ExternalLink, Users as UsersIcon, CheckCircle, XCircle, Key, PlayCircle, PauseCircle } from 'lucide-react'
import { toast } from 'sonner'
import config from '../config.js'

interface Partner {
  _id: string
  partnerCode: string
  partnerName: string
  hizmetBitisTarihi: string
  aktif: boolean
  customerCount?: number
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

interface Customer {
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

export function Partners() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [filter, setFilter] = useState<'all' | '1month' | '3months' | '6months' | '1year'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCustomersModal, setShowCustomersModal] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [activatingPartner, setActivatingPartner] = useState<Partner | null>(null)
  const [activatePartnerCode, setActivatePartnerCode] = useState('')
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [deactivatingPartner, setDeactivatingPartner] = useState<Partner | null>(null)
  const [deactivatePartnerCode, setDeactivatePartnerCode] = useState('')

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

  // Partner kod input'u temizle (sadece lowercase, rakam ve tire)
  const handlePartnerCodeChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (value !== cleaned) {
      toast.warning('Partner kodu sadece küçük harf, rakam ve tire (-) içerebilir')
    }
    return cleaned
  }

  // Hizmet bitiş tarihine göre aktif/pasif kontrolü
  const isPartnerActive = (hizmetBitisTarihi: string, aktif: boolean) => {
    return aktif && new Date(hizmetBitisTarihi) > new Date()
  }

  // Partnerleri filtrele
  const getFilteredPartners = () => {
    const now = new Date()
    let filtered = partners.filter(partner => {
      const bitisTarihi = new Date(partner.hizmetBitisTarihi)
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
      filtered = filtered.filter(partner =>
        partner.partnerCode.toLowerCase().includes(query) ||
        partner.partnerName?.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  const [formData, setFormData] = useState({
    partnerCode: '',
    partnerName: '',
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
    loadPartners()
  }, [])

  const loadPartners = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.get(`${config.API_URL}/partners`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setPartners(response.data.partners)
      }
    } catch (error) {
      console.error('Partners loading error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPartnerCustomers = async (partnerId: string) => {
    setLoadingCustomers(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.get(`${config.API_URL}/partners/${partnerId}/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setCustomers(response.data.customers)
      }
    } catch (error) {
      console.error('Customers loading error:', error)
      toast.error('Müşteriler yüklenemedi')
    } finally {
      setLoadingCustomers(false)
    }
  }

  const handleViewCustomers = (partner: Partner) => {
    setSelectedPartner(partner)
    setShowCustomersModal(true)
    loadPartnerCustomers(partner._id)
  }

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('adminToken')

      const formattedData = {
        partnerCode: formData.partnerCode,
        partnerName: formData.partnerName ? toTitleCase(formData.partnerName) : '',
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

      const response = await axios.post(`${config.API_URL}/partners`, formattedData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setShowModal(false)
        setFormData({
          partnerCode: '',
          partnerName: '',
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
        loadPartners()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Partner oluşturulamadı')
    }
  }

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner)
    setFormData({
      partnerCode: partner.partnerCode,
      partnerName: partner.partnerName || '',
      username: '',
      password: '',
      hizmetBitisTarihi: new Date(partner.hizmetBitisTarihi).toISOString().split('T')[0],
      yetkiliKisi: partner.iletisimBilgileri?.yetkiliKisi || '',
      cepTelefonu: partner.iletisimBilgileri?.cepTelefonu || '',
      email: partner.iletisimBilgileri?.email || '',
      faturaAdresi: partner.iletisimBilgileri?.faturaAdresi || '',
      sehir: partner.iletisimBilgileri?.sehir || ''
    })
    setEditMode(true)
    setShowModal(true)
  }

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPartner) return

    try {
      const token = localStorage.getItem('adminToken')

      const formattedData: any = {
        partnerCode: formData.partnerCode,
        partnerName: formData.partnerName ? toTitleCase(formData.partnerName) : '',
        hizmetBitisTarihi: formData.hizmetBitisTarihi,
        iletisimBilgileri: {
          yetkiliKisi: formData.yetkiliKisi || undefined,
          cepTelefonu: formData.cepTelefonu || undefined,
          email: formData.email || undefined,
          faturaAdresi: formData.faturaAdresi || undefined,
          sehir: formData.sehir || undefined
        }
      }

      // Username varsa ekle (ilk kullanıcı için)
      if (formData.username) {
        formattedData.username = formData.username
      }

      // Şifre varsa ekle
      if (formData.password) {
        formattedData.password = formData.password
      }

      const response = await axios.put(
        `${config.API_URL}/partners/${editingPartner._id}`,
        formattedData,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        setShowModal(false)
        setEditMode(false)
        setEditingPartner(null)
        setFormData({
          partnerCode: '',
          partnerName: '',
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
        loadPartners()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Partner güncellenemedi')
    }
  }

  const handleTogglePartnerStatus = async (partner: Partner) => {
    if (partner.aktif) {
      // Pasifleştirmek için modal aç
      setDeactivatingPartner(partner)
      setDeactivatePartnerCode('')
      setShowDeactivateModal(true)
    } else {
      // Aktifleştirmek için modal aç
      setActivatingPartner(partner)
      setActivatePartnerCode('')
      setShowActivateModal(true)
    }
  }

  const handleActivatePartner = async () => {
    if (!activatingPartner) return

    if (activatePartnerCode !== activatingPartner.partnerCode) {
      toast.error('Partner kodu eşleşmiyor!')
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.put(
        `${config.API_URL}/partners/${activatingPartner._id}/activate`,
        { partnerCode: activatePartnerCode },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        setShowActivateModal(false)
        setActivatingPartner(null)
        setActivatePartnerCode('')
        toast.success(`${activatingPartner.partnerName} aktifleştirildi!`)
        loadPartners()
        // Form açıksa güncelle
        if (editingPartner && editingPartner._id === activatingPartner._id) {
          setEditingPartner({ ...activatingPartner, aktif: true })
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Partner aktifleştirilemedi')
    }
  }

  const handleDeactivatePartner = async () => {
    if (!deactivatingPartner) return

    if (deactivatePartnerCode !== deactivatingPartner.partnerCode) {
      toast.error('Partner kodu eşleşmiyor!')
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.put(
        `${config.API_URL}/partners/${deactivatingPartner._id}`,
        { aktif: false },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        setShowDeactivateModal(false)
        setDeactivatingPartner(null)
        setDeactivatePartnerCode('')
        toast.success(`${deactivatingPartner.partnerName} pasifleştirildi. Tüm müşteri oturumları kapatıldı.`)
        loadPartners()
        // Form açıksa güncelle
        if (editingPartner && editingPartner._id === deactivatingPartner._id) {
          setEditingPartner({ ...deactivatingPartner, aktif: false })
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Partner pasifleştirilemedi')
    }
  }

  const handleConnectToPartner = async (partner: Partner) => {
    try {
      const token = localStorage.getItem('adminToken')
      const deviceId = `admin-panel-${Date.now()}`

      const response = await axios.post(
        `${config.API_URL}/auth/admin-login-as-partner/${partner._id}`,
        {
          deviceId,
          deviceName: 'Admin Panel',
          browserInfo: navigator.userAgent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        const partnerUrl = `${config.PARTNER_URL}/auto-login?token=${encodeURIComponent(response.data.token)}&user=${encodeURIComponent(JSON.stringify(response.data.user))}&deviceId=${encodeURIComponent(deviceId)}`
        window.open(partnerUrl, '_blank')
        toast.success(`${partner.partnerName} hesabına bağlanıldı`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bağlantı başarısız')
    }
  }

  const filteredPartners = getFilteredPartners()
  const totalPartners = partners.length
  const activePartners = partners.filter(p => isPartnerActive(p.hizmetBitisTarihi, p.aktif)).length
  const inactivePartners = totalPartners - activePartners

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600 dark:text-gray-400">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="sm:flex sm:items-center sm:justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Partnerler</h2>
          <button
            onClick={() => {
              setFormData({
                partnerCode: '',
                partnerName: '',
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
              setEditingPartner(null)
              setShowModal(true)
            }}
            className="mt-3 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            <Building2 className="h-4 w-4" />
            Yeni Partner
          </button>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg p-6 text-white shadow-lg">
            <dl>
              <dt className="text-sm font-medium text-blue-100 truncate">Toplam Partner</dt>
              <dd className="mt-1 text-3xl font-semibold">{totalPartners}</dd>
            </dl>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg p-6 text-white shadow-lg">
            <dl>
              <dt className="text-sm font-medium text-green-100 truncate">Aktif Partner</dt>
              <dd className="mt-1 text-3xl font-semibold">{activePartners}</dd>
            </dl>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-lg p-6 text-white shadow-lg">
            <dl>
              <dt className="text-sm font-medium text-red-100 truncate">Pasif Partner</dt>
              <dd className="mt-1 text-3xl font-semibold">{inactivePartners}</dd>
            </dl>
          </div>
        </div>

        {/* Arama ve Filtreleme */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Partner kodu veya ismi ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tüm Partnerler</option>
              <option value="1month">1 Ay İçinde Bitenler</option>
              <option value="3months">3 Ay İçinde Bitenler</option>
              <option value="6months">6 Ay İçinde Bitenler</option>
              <option value="1year">1 Yıl İçinde Bitenler</option>
            </select>
          </div>
        </div>
      </div>

      {/* Partner Listesi */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Partner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Partner Kodu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Müşteriler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hizmet Bitiş
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPartners.map((partner) => {
                const active = isPartnerActive(partner.hizmetBitisTarihi, partner.aktif)
                const bitisTarihi = new Date(partner.hizmetBitisTarihi)
                const kalanGun = Math.ceil((bitisTarihi.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

                return (
                  <tr key={partner._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {partner.partnerName || partner.partnerCode}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {partner.iletisimBilgileri?.yetkiliKisi || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm font-mono text-gray-900 dark:text-white">{partner.partnerCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewCustomers(partner)}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <UsersIcon className="h-4 w-4" />
                        {partner.customerCount || 0} müşteri
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {bitisTarihi.toLocaleDateString('tr-TR')}
                      </div>
                      {kalanGun > 0 && kalanGun <= 30 && (
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          {kalanGun} gün kaldı
                        </div>
                      )}
                      {kalanGun < 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400">
                          Süresi doldu
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                          <XCircle className="h-3 w-3" />
                          Pasif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleConnectToPartner(partner)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded text-sm font-medium"
                          title="Partner Paneline Bağlan"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Bağlan
                        </button>
                        <button
                          onClick={() => handleEditPartner(partner)}
                          className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded"
                          title="Düzenle"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredPartners.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Partner bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Arama kriterlerine uygun partner bulunamadı' : 'Henüz partner eklenmemiş'}
            </p>
          </div>
        )}
      </div>

      {/* Partner Oluştur/Düzenle Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editMode ? 'Partner Düzenle' : 'Yeni Partner Oluştur'}
              </h3>
              <form onSubmit={editMode ? handleUpdatePartner : handleCreatePartner} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Partner Kodu *</label>
                    <input
                      type="text"
                      required
                      disabled={editMode}
                      value={formData.partnerCode}
                      onChange={(e) => setFormData({ ...formData, partnerCode: handlePartnerCodeChange(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500"
                      placeholder="ornek-partner"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Küçük harf, rakam ve tire (-) kullanın</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Partner İsmi *</label>
                    <input
                      type="text"
                      required
                      value={formData.partnerName}
                      onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Örnek Şirket A.Ş."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {editMode ? 'Kullanıcı Adı (Yeni kullanıcı için)' : 'İlk Kullanıcı Adı *'}
                    </label>
                    <input
                      type="text"
                      required={!editMode}
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="admin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {editMode ? 'Şifre (Değiştirmek için)' : 'Şifre *'}
                    </label>
                    <input
                      type="password"
                      required={!editMode}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hizmet Bitiş Tarihi *</label>
                    <input
                      type="date"
                      required
                      value={formData.hizmetBitisTarihi}
                      onChange={(e) => setFormData({ ...formData, hizmetBitisTarihi: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Yetkili Kişi</label>
                    <input
                      type="text"
                      value={formData.yetkiliKisi}
                      onChange={(e) => setFormData({ ...formData, yetkiliKisi: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Ahmet Yılmaz"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cep Telefonu</label>
                    <input
                      type="tel"
                      value={formData.cepTelefonu}
                      onChange={(e) => setFormData({ ...formData, cepTelefonu: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="0555 123 45 67"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-posta</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="info@ornek.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şehir</label>
                    <input
                      type="text"
                      value={formData.sehir}
                      onChange={(e) => setFormData({ ...formData, sehir: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="İstanbul"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fatura Adresi</label>
                    <textarea
                      rows={2}
                      value={formData.faturaAdresi}
                      onChange={(e) => setFormData({ ...formData, faturaAdresi: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Adres bilgisi..."
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                  {/* Sol taraf - Durum butonları (sadece edit modunda) */}
                  {editMode && editingPartner && (
                    <div className="flex gap-2">
                      {editingPartner.aktif ? (
                        <button
                          type="button"
                          onClick={() => handleTogglePartnerStatus(editingPartner)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md hover:bg-orange-100 dark:hover:bg-orange-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          <PauseCircle className="h-4 w-4" />
                          Pasifleştir
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTogglePartnerStatus(editingPartner)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Aktifleştir
                        </button>
                      )}
                    </div>
                  )}

                  {/* Sağ taraf - İptal ve Kaydet butonları */}
                  <div className="flex gap-3 ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        setEditMode(false)
                        setEditingPartner(null)
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {editMode ? 'Güncelle' : 'Oluştur'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Müşteriler Modal */}
      {showCustomersModal && selectedPartner && (
        <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {selectedPartner.partnerName} - Müşteriler ({customers.length})
                </h3>
                <button
                  onClick={() => {
                    setShowCustomersModal(false)
                    setSelectedPartner(null)
                    setCustomers([])
                  }}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {loadingCustomers ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">Yükleniyor...</div>
              ) : customers.length === 0 ? (
                <div className="text-center py-8">
                  <UsersIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Henüz müşteri eklenmemiş</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Müşteri</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Kullanıcı Adı</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Hizmet Bitiş</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Durum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sorgu Sayısı</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {customers.map((customer) => {
                        const bitisTarihi = new Date(customer.hizmetBitisTarihi)
                        const active = customer.aktif && bitisTarihi > new Date()

                        return (
                          <tr key={customer._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {customer.companyName || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {customer.username}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {bitisTarihi.toLocaleDateString('tr-TR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {active ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                  <CheckCircle className="h-3 w-3" />
                                  Aktif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                                  <XCircle className="h-3 w-3" />
                                  Pasif
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {customer.kullanimIstatistikleri?.toplamSorguSayisi || 0}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aktifleştirme Onay Modal */}
      {showActivateModal && activatingPartner && (
        <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Partner Aktifleştir
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              <strong className="text-gray-900 dark:text-white">{activatingPartner.partnerName}</strong> partnerini aktifleştirmek için partner kodunu yazın:
            </p>
            <input
              type="text"
              value={activatePartnerCode}
              onChange={(e) => setActivatePartnerCode(e.target.value)}
              placeholder={activatingPartner.partnerCode}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowActivateModal(false)
                  setActivatingPartner(null)
                  setActivatePartnerCode('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleActivatePartner}
                disabled={activatePartnerCode !== activatingPartner.partnerCode}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aktifleştir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pasifleştirme Onay Modal */}
      {showDeactivateModal && deactivatingPartner && (
        <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Partner Pasifleştir
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <strong className="text-gray-900 dark:text-white">{deactivatingPartner.partnerName}</strong> partnerini pasifleştirmek için partner kodunu yazın:
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mb-4">
              ⚠️ Partnere ait tüm müşteri oturumları kapatılacaktır!
            </p>
            <input
              type="text"
              value={deactivatePartnerCode}
              onChange={(e) => setDeactivatePartnerCode(e.target.value)}
              placeholder={deactivatingPartner.partnerCode}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeactivateModal(false)
                  setDeactivatingPartner(null)
                  setDeactivatePartnerCode('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleDeactivatePartner}
                disabled={deactivatePartnerCode !== deactivatingPartner.partnerCode}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pasifleştir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
