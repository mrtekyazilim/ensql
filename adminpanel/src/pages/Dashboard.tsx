import { useState, useEffect } from 'react'
import axios from 'axios'
import { TrendingUp, Clock, AlertCircle, Database } from 'lucide-react'

interface Stats {
  totalUsers: number
  activeUsers: number
  totalReports: number
  totalQueries: number
}

interface Activity {
  id: number
  user: string
  action: string
  time: string
  type: 'success' | 'warning' | 'error'
}

interface Customer {
  id: number
  name: string
  lastActive: string
  queries: number
  status: 'active' | 'expiring' | 'inactive'
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalReports: 0,
    totalQueries: 0
  })
  const [loading, setLoading] = useState(true)

  // Dummy data - gerçek API'ye bağlanacak
  const recentActivities: Activity[] = [
    { id: 1, user: 'Acme Corp', action: 'Satış raporu çalıştırıldı', time: '5 dakika önce', type: 'success' },
    { id: 2, user: 'Tech Solutions', action: 'Yeni sorgu oluşturuldu', time: '15 dakika önce', type: 'success' },
    { id: 3, user: 'Global Trade', action: 'Hizmet süresi yenilendi', time: '1 saat önce', type: 'warning' },
    { id: 4, user: 'Digital Agency', action: 'Bağlantı hatası', time: '2 saat önce', type: 'error' },
    { id: 5, user: 'Retail Plus', action: 'Dashboard görüntülendi', time: '3 saat önce', type: 'success' },
  ]

  const topCustomers: Customer[] = [
    { id: 1, name: 'Acme Corporation', lastActive: '5 dk önce', queries: 2847, status: 'active' },
    { id: 2, name: 'Tech Solutions Inc', lastActive: '15 dk önce', queries: 1923, status: 'active' },
    { id: 3, name: 'Global Trade Ltd', lastActive: '1 saat önce', queries: 1456, status: 'expiring' },
    { id: 4, name: 'Digital Agency', lastActive: '2 saat önce', queries: 982, status: 'active' },
    { id: 5, name: 'Retail Plus', lastActive: '1 gün önce', queries: 654, status: 'inactive' },
  ]

  const systemStats = [
    { label: 'Sunucu Durumu', value: 'Çevrimiçi', color: 'green', icon: Database },
    { label: 'Ortalama Yanıt Süresi', value: '142ms', color: 'blue', icon: Clock },
    { label: 'Aktif Oturumlar', value: '23', color: 'purple', icon: TrendingUp },
    { label: 'Bekleyen İşlemler', value: '0', color: 'gray', icon: AlertCircle },
  ]

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:13201/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        const users = response.data.users
        setStats({
          totalUsers: users.length,
          activeUsers: users.filter((u: any) => u.aktif).length,
          totalReports: 0, // TODO: API'den çekilecek
          totalQueries: users.reduce((sum: number, u: any) => sum + (u.kullanimIstatistikleri?.toplamSorguSayisi || 0), 0)
        })
      }
    } catch (error) {
      console.error('Stats loading error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h2>

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
                  <dt className="text-sm font-medium text-blue-100 truncate">Toplam Kullanıcı</dt>
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
                  <dt className="text-sm font-medium text-green-100 truncate">Aktif Kullanıcı</dt>
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
                  <dt className="text-sm font-medium text-purple-100 truncate">Toplam Sorgu</dt>
                  <dd className="text-3xl font-bold text-white">{stats.totalQueries}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sistem Durumu Kartları */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {systemStats.map((stat, index) => {
          const Icon = stat.icon
          const colorClasses = {
            green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
            blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
            purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
            gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
          }
          return (
            <div key={index} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{stat.label}</dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-white">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
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
                  <li key={activity.id} className="py-4">
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
                          {activity.user}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {activity.action}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <a
                href="#"
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
                {topCustomers.map((customer) => (
                  <li key={customer.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {customer.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.queries} sorgu • {customer.lastActive}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                            customer.status === 'expiring' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                          {customer.status === 'active' ? 'Aktif' :
                            customer.status === 'expiring' ? 'Süresi Doluyor' :
                              'Pasif'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
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
