import { useState, useEffect } from 'react'
import axios from 'axios'
import { TrendingUp, Clock, AlertCircle, Database } from 'lucide-react'
import config from '../config.js'

interface Stats {
  totalUsers: number
  activeUsers: number
  totalReports: number
  totalQueries: number
}

interface SystemMetrics {
  averageResponseTime: number
  activeSessions: number
  totalRequests24h: number
  serverStatus: string
}

interface Activity {
  _id: string
  customerName: string
  description: string
  createdAt: string
  type: 'success' | 'warning' | 'error' | 'info'
}

interface Customer {
  _id: string
  companyName: string
  username: string
  kullanimIstatistikleri: {
    toplamSorguSayisi: number
    sonGirisTarihi: Date
  }
  aktif: boolean
  hizmetBitisTarihi: Date
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalReports: 0,
    totalQueries: 0
  })
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [topCustomers, setTopCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    averageResponseTime: 0,
    activeSessions: 0,
    totalRequests24h: 0,
    serverStatus: 'online'
  })
  const [partnerInfo, setPartnerInfo] = useState<{
    partnerName: string
    username: string
    hizmetBitisTarihi: string
  } | null>(null)

  useEffect(() => {
    loadStats()
    loadActivities()
    loadSystemMetrics()
    loadPartnerInfo()

    // Sayfa focus olduğunda partner bilgisini yenile
    const handleFocus = () => {
      loadPartnerInfo()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadPartnerInfo = async () => {
    try {
      const token = localStorage.getItem('partnerToken')
      const response = await axios.get(`${config.API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        const user = response.data.user
        setPartnerInfo({
          partnerName: user.partnerName || user.partnerCode || 'Partner',
          username: user.username || '',
          hizmetBitisTarihi: user.hizmetBitisTarihi || ''
        })
        // LocalStorage'ı da güncelle
        localStorage.setItem('partnerUser', JSON.stringify(user))
      }
    } catch (error) {
      console.error('Partner bilgisi yüklenemedi:', error)
      // Hata durumunda localStorage'dan yükle
      const userStr = localStorage.getItem('partnerUser')
      if (userStr) {
        const user = JSON.parse(userStr)
        setPartnerInfo({
          partnerName: user.partnerName || user.partnerCode || 'Partner',
          username: user.username || '',
          hizmetBitisTarihi: user.hizmetBitisTarihi || ''
        })
      }
    }
  }

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('partnerToken')
      const response = await axios.get(`${config.API_URL}/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        const users = response.data.customers

        // Son 30 günlük sorgu sayısını hesapla
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const last30DaysQueries = users.reduce((sum: number, u: any) => {
          const userQueries = u.kullanimIstatistikleri?.son30GunSorguSayisi || 0
          return sum + userQueries
        }, 0)

        setStats({
          totalUsers: users.length,
          activeUsers: users.filter((u: any) => u.aktif).length,
          totalReports: 0, // TODO: API'den çekilecek
          totalQueries: last30DaysQueries
        })

        // En aktif müşterileri belirle
        const sortedCustomers = [...users]
          .sort((a: any, b: any) => {
            const aQueries = a.kullanimIstatistikleri?.toplamSorguSayisi || 0
            const bQueries = b.kullanimIstatistikleri?.toplamSorguSayisi || 0
            return bQueries - aQueries
          })
          .slice(0, 5)

        setTopCustomers(sortedCustomers)
      }
    } catch (error) {
      console.error('Stats loading error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async () => {
    try {
      const token = localStorage.getItem('partnerToken')
      const response = await axios.get(`${config.API_URL}/activities?limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setRecentActivities(response.data.activities)
      }
    } catch (error) {
      console.error('Activities loading error:', error)
    }
  }

  const loadSystemMetrics = async () => {
    try {
      const token = localStorage.getItem('partnerToken')
      const response = await axios.get(`${config.API_URL}/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setSystemMetrics(response.data.metrics)
      }
    } catch (error) {
      console.error('Metrics loading error:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Az önce'
    if (diffMins < 60) return `${diffMins} dakika önce`
    if (diffHours < 24) return `${diffHours} saat önce`
    if (diffDays < 7) return `${diffDays} gün önce`

    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
  }

  const getCustomerStatus = (customer: Customer): 'active' | 'expiring' | 'inactive' => {
    if (!customer.aktif) return 'inactive'

    const now = new Date()
    const serviceEnd = new Date(customer.hizmetBitisTarihi)
    const daysUntilExpiry = Math.floor((serviceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) return 'inactive'
    if (daysUntilExpiry <= 7) return 'expiring'
    return 'active'
  }

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        {partnerInfo && (
          <div className="text-left sm:text-right">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {partnerInfo.partnerName}
            </p>
            {(partnerInfo.username || partnerInfo.hizmetBitisTarihi) && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {partnerInfo.hizmetBitisTarihi && (() => {
                  const bitisTarihi = new Date(partnerInfo.hizmetBitisTarihi)
                  const bugun = new Date()
                  const gunFarki = Math.ceil((bitisTarihi.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24))

                  if (gunFarki <= 60 && gunFarki > 0) {
                    return (
                      <>
                        Hizmet Bitisi: <span className="font-semibold text-red-600 dark:text-red-400">{gunFarki} Gün kaldı</span>
                        {partnerInfo.username ? ' • ' : ''}
                      </>
                    )
                  } else if (gunFarki <= 0) {
                    return (
                      <>
                        Hizmet Bitisi: <span className="font-semibold text-red-600 dark:text-red-400">Süresi doldu</span>
                        {partnerInfo.username ? ' • ' : ''}
                      </>
                    )
                  } else {
                    return (
                      <>
                        Hizmet Bitisi: {bitisTarihi.toLocaleDateString('tr-TR')}
                        {partnerInfo.username ? ' • ' : ''}
                      </>
                    )
                  }
                })()}
                {partnerInfo.username}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 overflow-hidden shadow-lg rounded-lg transform hover:scale-105 transition-transform">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-blue-100 truncate">Toplam Müşteri</dt>
                  <dd className="text-3xl font-bold text-white">{stats.totalUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 overflow-hidden shadow-lg rounded-lg transform hover:scale-105 transition-transform">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-green-100 truncate">Aktif Müşteri</dt>
                  <dd className="text-3xl font-bold text-white">{stats.activeUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 overflow-hidden shadow-lg rounded-lg transform hover:scale-105 transition-transform">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-indigo-100 truncate">Toplam Rapor</dt>
                  <dd className="text-3xl font-bold text-white">{stats.totalReports}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 overflow-hidden shadow-lg rounded-lg transform hover:scale-105 transition-transform">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-purple-100 truncate">Son 30 Gün Sorgu</dt>
                  <dd className="text-3xl font-bold text-white">{stats.totalQueries}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sistem Durumu Kartları */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Sunucu Durumu */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-3 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                <Database className="h-6 w-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Sunucu Durumu</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {systemMetrics.serverStatus === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Ortalama Yanıt Süresi */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                <Clock className="h-6 w-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Ortalama Yanıt Süresi</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {systemMetrics.averageResponseTime > 0 ? `${systemMetrics.averageResponseTime}ms` : 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Aktif Oturumlar */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-3 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Aktif Oturumlar</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {systemMetrics.activeSessions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Toplam İstek (24 saat) */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Toplam İstek (24s)</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {systemMetrics.totalRequests24h}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alt Bölüm: Son Aktiviteler ve En Çok Kullanan Müşteriler */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Son Aktiviteler */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Son Aktiviteler
            </h3>
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                {recentActivities.map((activity) => (
                  <li key={activity._id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${activity.type === 'success' ? 'bg-green-100 dark:bg-green-900' :
                          activity.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' :
                            'bg-red-100 dark:bg-red-900'
                          }`}>
                          <span className={`h-2 w-2 rounded-full ${activity.type === 'success' ? 'bg-green-600 dark:bg-green-400' :
                            activity.type === 'warning' ? 'bg-yellow-600 dark:bg-yellow-400' :
                              'bg-red-600 dark:bg-red-400'
                            }`}></span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.customerName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {activity.description}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <a
                href="/reports"
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Tümünü Görüntüle
              </a>
            </div>
          </div>
        </div>

        {/* En Çok Kullanan Müşteriler */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              En Aktif Müşteriler
            </h3>
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                {topCustomers.map((customer) => {
                  const status = getCustomerStatus(customer)
                  const lastActive = customer.kullanimIstatistikleri?.sonGirisTarihi
                    ? formatDate(customer.kullanimIstatistikleri.sonGirisTarihi.toString())
                    : 'Hiç giriş yapmadı'

                  return (
                    <li key={customer._id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {customer.companyName || customer.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.kullanimIstatistikleri?.toplamSorguSayisi || 0} sorgu • {lastActive}
                          </p>
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                            status === 'expiring' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            }`}>
                            {status === 'active' ? 'Aktif' :
                              status === 'expiring' ? 'Süresi Doluyor' :
                                'Pasif'}
                          </span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="mt-6">
              <a
                href="/users"
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Tüm Müşterileri Görüntüle
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
