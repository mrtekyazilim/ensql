import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface Report {
  showDate1: any
  showDate2: any
  showSearch: any
  _id: string
  raporAdi: string
  aciklama: string
  icon: string
  raporTuru: 'dashboard-scalar' | 'dashboard-list' | 'dashboard-pie' | 'dashboard-chart' | 'normal-report'
  sqlSorgusu: string
  aktif: boolean
  kullanimSayisi: number
  sonKullanimTarihi?: string
}

const REPORT_TYPES = [
  { value: 'normal-report', label: 'Normal Rapor' },
  { value: 'dashboard-scalar', label: 'Dashboard - Skalar Değer' },
  { value: 'dashboard-list', label: 'Dashboard - Liste' },
  { value: 'dashboard-pie', label: 'Dashboard - Pasta Grafik' },
  { value: 'dashboard-chart', label: 'Dashboard - Bar Grafik' }
]

export function ReportDesigns() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null)
  const [showCopyDialog, setShowCopyDialog] = useState(false)
  const [reportToCopy, setReportToCopy] = useState<Report | null>(null)
  const [copyName, setCopyName] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [selectedExportReports, setSelectedExportReports] = useState<Set<string>>(new Set())
  const [selectedImportReports, setSelectedImportReports] = useState<Set<string>>(new Set())
  const [importedReports, setImportedReports] = useState<Report[]>([])
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleCopy = (report: Report) => {
    setReportToCopy(report)
    setCopyName(`${report.raporAdi} - Kopya`)
    setShowCopyDialog(true)
  }

  const handleCopyConfirm = async () => {
    if (!reportToCopy || !copyName.trim()) {
      toast.error('Rapor adı boş olamaz')
      return
    }

    try {
      const token = localStorage.getItem('clientToken')

      const copyData = {
        raporAdi: copyName.trim(),
        aciklama: reportToCopy.aciklama,
        icon: reportToCopy.icon,
        raporTuru: reportToCopy.raporTuru,
        sqlSorgusu: reportToCopy.sqlSorgusu,
        showDate1: reportToCopy.showDate1,
        showDate2: reportToCopy.showDate2,
        showSearch: reportToCopy.showSearch,
        aktif: false
      }

      const response = await axios.post(
        'http://localhost:13201/api/reports',
        copyData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        toast.success('Rapor kopyalandı')
        setShowCopyDialog(false)
        setReportToCopy(null)
        setCopyName('')
        loadReports()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kopya oluşturulamadı')
    }
  }

  const handleReorder = async (reportId: string, direction: 'up' | 'down') => {
    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.put(
        `http://localhost:13201/api/reports/${reportId}/reorder`,
        { direction },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        toast.success('Sıralama güncellendi')
        loadReports()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Sıralama güncellenemedi')
    }
  }

  const handleExportClick = () => {
    setSelectedExportReports(new Set())
    setExportDialogOpen(true)
  }

  const handleExportToggle = (reportId: string) => {
    const newSelected = new Set(selectedExportReports)
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId)
    } else {
      newSelected.add(reportId)
    }
    setSelectedExportReports(newSelected)
  }

  const handleExportToggleAll = () => {
    if (selectedExportReports.size === reports.length) {
      setSelectedExportReports(new Set())
    } else {
      setSelectedExportReports(new Set(reports.map(r => r._id)))
    }
  }

  const handleExportConfirm = () => {
    if (selectedExportReports.size === 0) {
      toast.error('Lütfen en az bir rapor seçin')
      return
    }

    const selectedReportData = reports
      .filter(r => selectedExportReports.has(r._id))
      .map(r => ({
        raporAdi: r.raporAdi,
        aciklama: r.aciklama,
        icon: r.icon,
        raporTuru: r.raporTuru,
        sqlSorgusu: r.sqlSorgusu,
        showDate1: r.showDate1,
        showDate2: r.showDate2,
        showSearch: r.showSearch,
        aktif: r.aktif
      }))

    const jsonString = JSON.stringify(selectedReportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ensql-raporlar-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(`${selectedExportReports.size} rapor dışa aktarıldı`)
    setExportDialogOpen(false)
  }

  const handleImportClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: any) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          if (!Array.isArray(data)) {
            toast.error('Geçersiz dosya formatı')
            return
          }
          setImportedReports(data)
          setSelectedImportReports(new Set(data.map((_, i) => i.toString())))
          setImportDialogOpen(true)
        } catch (error) {
          toast.error('Dosya okunamadı')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleImportToggle = (index: string) => {
    const newSelected = new Set(selectedImportReports)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedImportReports(newSelected)
  }

  const handleImportToggleAll = () => {
    if (selectedImportReports.size === importedReports.length) {
      setSelectedImportReports(new Set())
    } else {
      setSelectedImportReports(new Set(importedReports.map((_, i) => i.toString())))
    }
  }

  const handleImportConfirm = async () => {
    if (selectedImportReports.size === 0) {
      toast.error('Lütfen en az bir rapor seçin')
      return
    }

    try {
      const token = localStorage.getItem('clientToken')
      let successCount = 0

      for (const index of Array.from(selectedImportReports)) {
        const report = importedReports[parseInt(index)]
        try {
          const response = await axios.post(
            'http://localhost:13201/api/reports',
            report,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          )
          if (response.data.success) {
            successCount++
          }
        } catch (error) {
          console.error(`Import error for ${report.raporAdi}:`, error)
        }
      }

      toast.success(`${successCount} rapor içe aktarıldı`)
      setImportDialogOpen(false)
      loadReports()
    } catch (error: any) {
      toast.error('İçe aktarma sırasında hata oluştu')
    }
  }

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.FileText
    return <IconComponent className="w-6 h-6" />
  }

  // Filtreleme
  const filteredReports = reports.filter(report => {
    // Tip filtreleme
    if (filterType !== 'all' && report.raporTuru !== filterType) {
      return false
    }
    // İsim filtreleme
    if (searchQuery && !report.raporAdi.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredReports.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentReports = filteredReports.slice(startIndex, endIndex)

  // Reset to page 1 when page size changes
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
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
      <div className="mb-6">
        <button
          onClick={() => navigate('/settings')}
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <LucideIcons.ArrowLeft className="w-4 h-4 mr-2" />
          Geri
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rapor Tasarımları</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* Export/Import Buttons */}
          <button
            onClick={handleImportClick}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <LucideIcons.Upload className="w-4 h-4 mr-2" />
            İçe Aktar
          </button>
          <button
            onClick={handleExportClick}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <LucideIcons.Download className="w-4 h-4 mr-2" />
            Dışa Aktar
          </button>
          {/* Page Size Selector */}
          <div className="flex items-center space-x-2">
            <LucideIcons.Rows className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <button
            onClick={() => navigate('/report-designs/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            <LucideIcons.Plus className="w-4 h-4 mr-2" />
            Yeni Rapor
          </button>
        </div>
      </div>

      {/* Filtre Paneli */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Filtreler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rapor Türü
            </label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value)
                setCurrentPage(1)
              }}
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">Tüm Türler</option>
              {REPORT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rapor Adı
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Rapor adı ara..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 pl-10 pr-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <LucideIcons.Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
        {(filterType !== 'all' || searchQuery) && (
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {filteredReports.length} rapor bulundu
            </span>
            <button
              onClick={() => {
                setFilterType('all')
                setSearchQuery('')
                setCurrentPage(1)
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentReports.map((report) => (
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {report.aciklama}
              </p>
            )}

            <div className="space-y-2 mb-4">
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

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleReorder(report._id, 'up')}
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  title="Yukarı Taşı"
                >
                  <LucideIcons.ArrowUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleReorder(report._id, 'down')}
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  title="Aşağı Taşı"
                >
                  <LucideIcons.ArrowDown className="w-5 h-5" />
                </button>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleCopy(report)}
                  className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                  title="Kopyala"
                >
                  <LucideIcons.Copy className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate(`/report-designs/${report._id}`)}
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  title="Düzenle"
                >
                  <LucideIcons.Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setReportToDelete(report)
                    setDeleteDialogOpen(true)
                  }}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Sil"
                >
                  <LucideIcons.Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredReports.length === 0 && (
          <div className="col-span-3 text-center py-12">
            <LucideIcons.FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {reports.length === 0 ? 'Henüz rapor oluşturulmamış' : 'Filtreye uygun rapor bulunamadı'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredReports.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4 gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {startIndex + 1}-{Math.min(endIndex, filteredReports.length)} / {filteredReports.length} rapor
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <LucideIcons.ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <LucideIcons.ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
              Sayfa {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <LucideIcons.ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <LucideIcons.ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Rapor Sil"
        description={`"${reportToDelete?.raporAdi}" raporunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        onConfirm={handleDelete}
      />

      {/* Export Dialog */}
      {exportDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Raporları Dışa Aktar</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Select All */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
                <span className="font-medium text-gray-900 dark:text-white">Tümünü Seç</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedExportReports.size === reports.length}
                    onChange={handleExportToggleAll}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Report List */}
              <div className="space-y-2">
                {reports.map((report) => (
                  <div
                    key={report._id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{report.raporAdi}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {REPORT_TYPES.find(t => t.value === report.raporTuru)?.label}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedExportReports.has(report._id)}
                        onChange={() => handleExportToggle(report._id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedExportReports.size} rapor seçildi
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={() => setExportDialogOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500"
                >
                  İptal
                </button>
                <button
                  onClick={handleExportConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Dışa Aktar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {importDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Raporları İçe Aktar</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Select All */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
                <span className="font-medium text-gray-900 dark:text-white">Tümünü Seç</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedImportReports.size === importedReports.length}
                    onChange={handleImportToggleAll}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Report List */}
              <div className="space-y-2">
                {importedReports.map((report, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{report.raporAdi}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {REPORT_TYPES.find(t => t.value === report.raporTuru)?.label}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedImportReports.has(index.toString())}
                        onChange={() => handleImportToggle(index.toString())}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedImportReports.size} rapor seçildi
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={() => setImportDialogOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500"
                >
                  İptal
                </button>
                <button
                  onClick={handleImportConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  İçe Aktar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Dialog */}
      {showCopyDialog && reportToCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rapor Kopyala</h3>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                "{reportToCopy.raporAdi}" raporunun kopyası oluşturulacak. Yeni rapor adını girin:
              </p>
              <input
                type="text"
                value={copyName}
                onChange={(e) => setCopyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCopyConfirm()
                  } else if (e.key === 'Escape') {
                    setShowCopyDialog(false)
                  }
                }}
                placeholder="Yeni rapor adı"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 bg-gray-50 dark:bg-gray-700">
              <button
                onClick={() => {
                  setShowCopyDialog(false)
                  setReportToCopy(null)
                  setCopyName('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500"
              >
                İptal
              </button>
              <button
                onClick={handleCopyConfirm}
                disabled={!copyName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kopyala
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
