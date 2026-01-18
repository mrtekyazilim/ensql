import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'

interface Report {
  _id: string
  raporAdi: string
  aciklama: string
  icon: string
  raporTuru: 'dashboard-scalar' | 'dashboard-list' | 'dashboard-pie' | 'normal-report'
  sqlSorgusu: string
  showDate1?: boolean
  showDate2?: boolean
  showSearch?: boolean
  kullanimSayisi: number
  sonKullanimTarihi?: string
}

export function Reports() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.get('http://localhost:13201/api/reports', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setReports(response.data.reports)
      }
    } catch (error) {
      console.error('Reports loading error:', error)
      toast.error('Raporlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.FileText
    return <IconComponent className="w-5 h-5" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LucideIcons.Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Raporlarım</h2>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div
            key={report._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 mr-3">
                {renderIcon(report.icon)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {report.raporAdi}
              </h3>
            </div>

            {report.aciklama && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {report.aciklama}
              </p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Kullanım:</span>
                <span className="text-gray-900 dark:text-white">{report.kullanimSayisi} kez</span>
              </div>
              {report.sonKullanimTarihi && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Son Kullanım:</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(report.sonKullanimTarihi).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate(`/reports/${report._id}`)}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              <LucideIcons.Play className="w-4 h-4 mr-2" />
              Çalıştır
            </button>
          </div>
        ))}

        {reports.length === 0 && (
          <div className="col-span-3 text-center py-12">
            <LucideIcons.FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Henüz rapor bulunamadı</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Ayarlar → Rapor Tasarımları'ndan yeni rapor oluşturabilirsiniz
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
