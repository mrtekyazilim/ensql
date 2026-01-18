import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface Report {
  _id: string
  raporAdi: string
  aciklama: string
  icon: string
  raporTuru: 'dashboard-scalar' | 'dashboard-list' | 'dashboard-pie' | 'normal-report'
  sqlSorgusu: string
  aktif: boolean
  kullanimSayisi: number
  sonKullanimTarihi?: string
}

const REPORT_TYPES = [
  { value: 'normal-report', label: 'Normal Rapor' },
  { value: 'dashboard-scalar', label: 'Dashboard - Skalar Değer' },
  { value: 'dashboard-list', label: 'Dashboard - Liste' },
  { value: 'dashboard-pie', label: 'Dashboard - Pasta Grafik' }
]

export function ReportDesigns() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.get('http://localhost:13201/api/reports?includeInactive=true', {
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



  const handleDelete = async () => {
    if (!reportToDelete) return

    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.delete(
        `http://localhost:13201/api/reports/${reportToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        toast.success('Rapor silindi')
        loadReports()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Rapor silinemedi')
    } finally {
      setDeleteDialogOpen(false)
      setReportToDelete(null)
    }
  }

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.FileText
    return <IconComponent className="w-6 h-6" />
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rapor Tasarımları</h2>
        <button
          onClick={() => navigate('/report-designs/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          <LucideIcons.Plus className="w-4 h-4 mr-2" />
          Yeni Rapor
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div
            key={report._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                {renderIcon(report.icon)}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/report-designs/${report._id}`)}
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <LucideIcons.Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setReportToDelete(report)
                    setDeleteDialogOpen(true)
                  }}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <LucideIcons.Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {report.raporAdi}
            </h3>

            {report.aciklama && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {report.aciklama}
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tür:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {REPORT_TYPES.find(t => t.value === report.raporTuru)?.label}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Durum:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${report.aktif
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                  }`}>
                  {report.aktif ? 'Yayında' : 'Taslak'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Kullanım:</span>
                <span className="text-gray-900 dark:text-white">{report.kullanimSayisi} kez</span>
              </div>
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <div className="col-span-3 text-center py-12">
            <LucideIcons.FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Henüz rapor oluşturulmamış</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Rapor Sil"
        description={`"${reportToDelete?.raporAdi}" raporunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        onConfirm={handleDelete}
      />
    </div>
  )
}
