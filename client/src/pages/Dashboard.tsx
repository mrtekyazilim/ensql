import { useState, useEffect } from 'react'
import axios from 'axios'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface DashboardReport {
  _id: string
  raporAdi: string
  aciklama: string
  icon: string
  color: string
  raporTuru: 'dashboard-scalar' | 'dashboard-list' | 'dashboard-pie'
  sqlSorgusu: string
}

const COLOR_THEMES: Record<string, { from: string; to: string; darkFrom: string; darkTo: string }> = {
  'blue-indigo': { from: 'from-blue-500', to: 'to-indigo-600', darkFrom: 'dark:from-blue-600', darkTo: 'dark:to-indigo-950' },
  'green-teal': { from: 'from-green-500', to: 'to-teal-600', darkFrom: 'dark:from-green-600', darkTo: 'dark:to-teal-950' },
  'purple-pink': { from: 'from-purple-500', to: 'to-pink-600', darkFrom: 'dark:from-purple-600', darkTo: 'dark:to-pink-950' },
  'orange-red': { from: 'from-orange-500', to: 'to-red-600', darkFrom: 'dark:from-orange-600', darkTo: 'dark:to-red-950' },
  'gray-slate': { from: 'from-gray-500', to: 'to-slate-600', darkFrom: 'dark:from-gray-600', darkTo: 'dark:to-slate-950' },
  'cyan-blue': { from: 'from-cyan-500', to: 'to-blue-600', darkFrom: 'dark:from-cyan-600', darkTo: 'dark:to-blue-950' },
  'amber-orange': { from: 'from-amber-500', to: 'to-orange-600', darkFrom: 'dark:from-amber-600', darkTo: 'dark:to-orange-950' },
  'rose-red': { from: 'from-rose-500', to: 'to-red-600', darkFrom: 'dark:from-rose-600', darkTo: 'dark:to-red-950' }
}

export function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [dashboardReports, setDashboardReports] = useState<DashboardReport[]>([])
  const [reportData, setReportData] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [listPages, setListPages] = useState<Record<string, number>>({})
  const [serviceExpired, setServiceExpired] = useState(false)

  useEffect(() => {
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.get('http://localhost:13201/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        const userData = response.data.user
        setUser(userData)

        // LocalStorage'daki kullanıcı bilgisini güncelle
        localStorage.setItem('clientUser', JSON.stringify(userData))

        // Hizmet bitiş tarihi kontrolü
        if (userData.hizmetBitisTarihi) {
          const bitisTarihi = new Date(userData.hizmetBitisTarihi)
          const bugun = new Date()
          if (bugun > bitisTarihi) {
            setServiceExpired(true)
          } else {
            setServiceExpired(false)
          }
        }

        loadDashboardReports()
      }
    } catch (error) {
      console.error('Load current user error:', error)
      // Hata durumunda localStorage'daki veriyi kullan
      const userData = localStorage.getItem('clientUser')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        if (parsedUser.hizmetBitisTarihi) {
          const bitisTarihi = new Date(parsedUser.hizmetBitisTarihi)
          const bugun = new Date()
          if (bugun > bitisTarihi) {
            setServiceExpired(true)
          }
        }
      }
      loadDashboardReports()
    }
  }

  const loadDashboardReports = async () => {
    // Hizmet süresi dolmuşsa raporları yükleme
    if (serviceExpired) {
      setLoading(false)
      return
    }

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
      const colorTheme = COLOR_THEMES[report.color || 'blue-indigo'] || COLOR_THEMES['blue-indigo']
      return (
        <div key={report._id} className={`bg-gradient-to-br ${colorTheme.from} ${colorTheme.to} ${colorTheme.darkFrom} ${colorTheme.darkTo} rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow`}>
          <div className="flex items-center mb-4">
            <div className="p-2 bg-white/20 rounded-lg text-white mr-3">
              {renderIcon(report.icon)}
            </div>
            <h4 className="text-white text-lg font-semibold">{report.raporAdi}</h4>
          </div>
          <p className="text-3xl font-bold text-white">{value}</p>
          {report.aciklama && (
            <p className="text-white/80 text-xs mt-2">{report.aciklama}</p>
          )}
        </div>
      )
    }

    if (report.raporTuru === 'dashboard-list') {
      const columns = data.length > 0 ? Object.keys(data[0]) : []
      const currentPage = listPages[report._id] || 1
      const pageSize = 10
      const totalPages = Math.ceil(data.length / pageSize)
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      const currentData = data.slice(startIndex, endIndex)

      const handlePageChange = (newPage: number) => {
        setListPages(prev => ({ ...prev, [report._id]: newPage }))
      }

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
          <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {columns.map((column, idx) => (
                    <th
                      key={idx}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {columns.map((column, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                      >
                        {row[column] !== null && row[column] !== undefined ? String(row[column]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {startIndex + 1}-{Math.min(endIndex, data.length)} / {data.length} kayıt
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <LucideIcons.ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <LucideIcons.ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )
    }

    if (report.raporTuru === 'dashboard-pie') {
      // Veriyi pie chart formatına dönüştür: [{ name: string, value: number }]
      let chartData = data.map(row => {
        const entries = Object.entries(row)
        const name = entries[0] ? String(entries[0][1]) : '-'
        const value = entries[1] ? Number(entries[1][1]) || 0 : 0
        return { name, value }
      })

      // Büyükten küçüğe sırala
      chartData.sort((a, b) => b.value - a.value)

      // İlk 5'i al, geri kalanları "Diğer" olarak topla
      if (chartData.length > 5) {
        const top5 = chartData.slice(0, 5)
        const others = chartData.slice(5)
        const othersTotal = others.reduce((sum, item) => sum + item.value, 0)

        if (othersTotal > 0) {
          chartData = [...top5, { name: 'Diğer', value: othersTotal }]
        } else {
          chartData = top5
        }
      }

      const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4', '#f97316']

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
          <div className="h-[20rem] sm:h-[22rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="35%"
                  labelLine={false}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem'
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ paddingTop: '0px', marginTop: '-40px', bottom: 'auto', top: '75%' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
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
              <div className="text-sm mt-1 flex items-end justify-end gap-3">
                {user.hizmetBitisTarihi && (
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    Hizmet Bitiş: {new Date(user.hizmetBitisTarihi).toLocaleDateString('tr-TR')}
                  </span>
                )}
                <span className="text-gray-600 dark:text-gray-400">@{user.username}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hizmet Süresi Dolmuş Uyarısı */}
      {serviceExpired && (
        <div className="mb-8 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <LucideIcons.AlertCircle className="w-6 h-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
                Hizmet Süreniz Dolmuştur
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {user?.hizmetBitisTarihi && (
                  <>Hizmet bitiş tarihiniz: {new Date(user.hizmetBitisTarihi).toLocaleDateString('tr-TR')}</>
                )}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                Hizmetinize devam etmek için lütfen yöneticinizle iletişime geçiniz.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Raporları */}
      {!serviceExpired && (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LucideIcons.Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : dashboardReports.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 mb-8">
              {dashboardReports.map(report => renderDashboardReport(report))}
            </div>
          ) : null}
        </>
      )}

      {/* Hızlı Erişim Kartları */}
      {!serviceExpired && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <a
            href="/reports"
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer block"
          >
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
                <span className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                  Görüntüle
                </span>
              </div>
            </div>
          </a>
        </div>
      )}
    </div>
  )
}
