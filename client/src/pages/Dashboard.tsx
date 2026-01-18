import { useState, useEffect } from 'react'
import axios from 'axios'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'

interface DashboardReport {
  _id: string
  raporAdi: string
  aciklama: string
  icon: string
  raporTuru: 'dashboard-scalar' | 'dashboard-list' | 'dashboard-pie'
  sqlSorgusu: string
}

export function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [dashboardReports, setDashboardReports] = useState<DashboardReport[]>([])
  const [reportData, setReportData] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('clientUser')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    loadDashboardReports()
  }, [])

  const loadDashboardReports = async () => {
    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.get('http://localhost:13201/api/reports', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        // Sadece dashboard türündeki aktif raporları filtrele
        const dashboardReports = response.data.reports.filter(
          (r: any) => r.aktif && (r.raporTuru === 'dashboard-scalar' || r.raporTuru === 'dashboard-list' || r.raporTuru === 'dashboard-pie')
        )
        setDashboardReports(dashboardReports)

        // Her rapor için veri yükle
        dashboardReports.forEach((report: DashboardReport) => {
          loadReportData(report._id)
        })
      }
    } catch (error) {
      console.error('Dashboard reports loading error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReportData = async (reportId: string) => {
    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.post(
        `http://localhost:13201/api/reports/${reportId}/execute`,
        { date1: '', date2: '', search: '' },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success && response.data.data) {
        setReportData(prev => ({ ...prev, [reportId]: response.data.data }))
      }
    } catch (error) {
      console.error(`Report ${reportId} data loading error:`, error)
    }
  }

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.FileText
    return <IconComponent className="w-6 h-6" />
  }

  const renderDashboardReport = (report: DashboardReport) => {
    const data = reportData[report._id] || []

    if (report.raporTuru === 'dashboard-scalar') {
      const value = data[0] && Object.values(data[0])[0] !== null ? String(Object.values(data[0])[0]) : '0'
      return (
        <div key={report._id} className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-950 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-white/20 rounded-lg text-white">
              {renderIcon(report.icon)}
            </div>
          </div>
          <h4 className="text-white text-sm font-medium mb-2">{report.raporAdi}</h4>
          <p className="text-3xl font-bold text-white">{value}</p>
          {report.aciklama && (
            <p className="text-white/80 text-xs mt-2">{report.aciklama}</p>
          )}
        </div>
      )
    }

    if (report.raporTuru === 'dashboard-list') {
      return (
        <div key={report._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 mr-3">
              {renderIcon(report.icon)}
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{report.raporAdi}</h4>
          </div>
          {report.aciklama && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{report.aciklama}</p>
          )}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.slice(0, 5).map((row, idx) => (
              <div key={idx} className="text-sm border-b border-gray-200 dark:border-gray-700 pb-2">
                {Object.entries(row).map(([key, value], i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {value !== null && value !== undefined ? String(value) : '-'}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {data.length > 5 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">+{data.length - 5} daha...</p>
          )}
        </div>
      )
    }

    if (report.raporTuru === 'dashboard-pie') {
      return (
        <div key={report._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 mr-3">
              {renderIcon(report.icon)}
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{report.raporAdi}</h4>
          </div>
          {report.aciklama && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{report.aciklama}</p>
          )}
          <div className="space-y-2">
            {data.slice(0, 5).map((row, idx) => {
              const entries = Object.entries(row)
              const label = entries[0] ? String(entries[0][1]) : '-'
              const value = entries[1] ? String(entries[1][1]) : '0'
              return (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{label}</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">{value}</span>
                </div>
              )
            })}
          </div>
          {data.length > 5 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">+{data.length - 5} daha...</p>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hoş Geldiniz</h2>
          {user && (
            <div className="text-right">
              <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                {user.companyName}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                @{user.username}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Raporları */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LucideIcons.Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : dashboardReports.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {dashboardReports.map(report => renderDashboardReport(report))}
        </div>
      ) : null}

      {/* Hızlı Erişim Kartları */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Raporlarım</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">Raporları Görüntüle</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <a href="/reports" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                Görüntüle
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600 dark:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Ayarlar</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">Connector Ayarları</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <a href="/settings" className="font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300">
                Düzenle
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600 dark:text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Hizmet Bilgisi</dt>
                  {user?.hizmetBitisTarihi && (
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      Bitiş: {new Date(user.hizmetBitisTarihi).toLocaleDateString('tr-TR')}
                    </dd>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
