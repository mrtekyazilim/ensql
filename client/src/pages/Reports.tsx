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
  raporTuru: 'dashboard-scalar' | 'dashboard-list' | 'dashboard-pie' | 'dashboard-chart' | 'normal-report'
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
  const [user, setUser] = useState<any>(null)
  const [serviceExpired, setServiceExpired] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('clientUser')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Hizmet bitiş tarihi kontrolü
      if (parsedUser.hizmetBitisTarihi) {
        const bitisTarihi = new Date(parsedUser.hizmetBitisTarihi)
        const bugun = new Date()
        if (bugun > bitisTarihi) {
          setServiceExpired(true)
        }
      }
    }
    loadReports()
  }, [])

  const loadReports = async () => {
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
        // Sadece normal-report türündeki raporları göster
        const normalReports = response.data.reports.filter(
          (r: Report) => r.raporTuru === 'normal-report'
        )
        setReports(normalReports)
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
      <div className="flex items-center gap-3 mb-6">
        <LucideIcons.BarChart3 className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Raporlar</h2>
      </div>

      {/* Hizmet Süresi Dolmuş Uyarısı */}
      {serviceExpired ? (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
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
      ) : (
        <>
          {/* Reports Grid */}
          {reports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <div
                  key={report._id}
                  onClick={() => navigate(`/reports/${report._id}`)}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Kullanım:</span>
                      <span className="text-gray-900 dark:text-white">{report.kullanimSayisi} kez</span>
                    </div>
                    {report.sonKullanimTarihi && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Son Kullanım:</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(report.sonKullanimTarihi).toLocaleString('tr-TR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <LucideIcons.FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Henüz rapor bulunamadı</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Ayarlar → Rapor Tasarımları'ndan yeni rapor oluşturabilirsiniz
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
