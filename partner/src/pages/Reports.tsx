import { useState, useEffect } from 'react'
import axios from 'axios'
import { Activity, Clock, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react'
import config from '../config.js'

interface ActivityItem {
  _id: string
  customerName: string
  action: string
  description: string
  reportName?: string
  type: 'success' | 'warning' | 'error' | 'info'
  createdAt: string
}

export function Reports() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${config.API_URL}/activities?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setActivities(response.data.activities)
      }
    } catch (error) {
      console.error('Activities loading error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: 'Giriş Yapıldı',
      logout: 'Çıkış Yapıldı',
      report_executed: 'Rapor Çalıştırıldı',
      report_created: 'Rapor Oluşturuldu',
      report_updated: 'Rapor Güncellendi',
      report_deleted: 'Rapor Silindi',
      query_executed: 'Sorgu Çalıştırıldı',
      connection_test: 'Bağlantı Testi',
      connection_error: 'Bağlantı Hatası',
      service_renewed: 'Hizmet Yenilendi'
    }
    return labels[action] || action
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900'
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900'
      case 'error':
        return 'bg-red-100 dark:bg-red-900'
      default:
        return 'bg-blue-100 dark:bg-blue-900'
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

    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.type === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Son Aktiviteler</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sistem genelinde gerçekleşen tüm aktiviteler
          </p>
        </div>
        <button
          onClick={loadActivities}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <Activity className="h-4 w-4 mr-2" />
          Yenile
        </button>
      </div>

      {/* Filtre Butonları */}
      <div className="mb-6 flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'all'
            ? 'bg-blue-600 text-white dark:bg-blue-500'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
        >
          Tümü ({activities.length})
        </button>
        <button
          onClick={() => setFilter('success')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'success'
            ? 'bg-green-600 text-white dark:bg-green-500'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
        >
          Başarılı ({activities.filter(a => a.type === 'success').length})
        </button>
        <button
          onClick={() => setFilter('warning')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'warning'
            ? 'bg-yellow-600 text-white dark:bg-yellow-500'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
        >
          Uyarı ({activities.filter(a => a.type === 'warning').length})
        </button>
        <button
          onClick={() => setFilter('error')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'error'
            ? 'bg-red-600 text-white dark:bg-red-500'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
        >
          Hata ({activities.filter(a => a.type === 'error').length})
        </button>
      </div>

      {/* Aktivite Listesi */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredActivities.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aktivite Bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Henüz herhangi bir aktivite kaydı bulunmuyor.
              </p>
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div key={activity._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getTypeColor(activity.type)}`}>
                      {getTypeIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.customerName}
                        </p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          {getActionLabel(activity.action)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {activity.description}
                        </p>
                        {activity.reportName && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            • {activity.reportName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(activity.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* İstatistikler */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Toplam Aktivite
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {activities.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Başarılı
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {activities.filter(a => a.type === 'success').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Uyarı
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {activities.filter(a => a.type === 'warning').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Hata
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {activities.filter(a => a.type === 'error').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
