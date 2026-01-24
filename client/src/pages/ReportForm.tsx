import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import config from '../config.js'

interface PivotData {
  rows: string[]
  columns: string[]
  data: Record<string, Record<string, number>>
  rowTotals: Record<string, number>
  columnTotals: Record<string, number>
  grandTotal: number
}

// Pivot transformation function
function transformToPivot(
  rawData: any[],
  rowField: string,
  columnField: string,
  valueField: string,
  aggregationType: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'
): PivotData {
  const rows = new Set<string>()
  const columns = new Set<string>()
  const dataMap: Record<string, Record<string, number[]>> = {}

  // First pass: collect all unique rows and columns, group values
  rawData.forEach(row => {
    const rowValue = String(row[rowField] || '')
    const colValue = String(row[columnField] || '')
    const value = Number(row[valueField]) || 0

    rows.add(rowValue)
    columns.add(colValue)

    if (!dataMap[rowValue]) dataMap[rowValue] = {}
    if (!dataMap[rowValue][colValue]) dataMap[rowValue][colValue] = []

    dataMap[rowValue][colValue].push(value)
  })

  // Second pass: apply aggregation
  const aggregatedData: Record<string, Record<string, number>> = {}
  const rowTotals: Record<string, number> = {}
  const columnTotals: Record<string, number> = {}
  let grandTotal = 0

  const aggregate = (values: number[]): number => {
    if (values.length === 0) return 0
    switch (aggregationType) {
      case 'SUM':
        return values.reduce((sum, val) => sum + val, 0)
      case 'COUNT':
        return values.length
      case 'AVG':
        return values.reduce((sum, val) => sum + val, 0) / values.length
      case 'MIN':
        return Math.min(...values)
      case 'MAX':
        return Math.max(...values)
      default:
        return 0
    }
  }

  rows.forEach(rowValue => {
    aggregatedData[rowValue] = {}
    rowTotals[rowValue] = 0

    columns.forEach(colValue => {
      const values = dataMap[rowValue]?.[colValue] || []
      const aggregatedValue = values.length > 0 ? aggregate(values) : 0

      aggregatedData[rowValue][colValue] = aggregatedValue
      rowTotals[rowValue] += aggregatedValue
      columnTotals[colValue] = (columnTotals[colValue] || 0) + aggregatedValue
      grandTotal += aggregatedValue
    })
  })

  return {
    rows: Array.from(rows),
    columns: Array.from(columns),
    data: aggregatedData,
    rowTotals,
    columnTotals,
    grandTotal
  }
}

interface ReportFormData {
  raporAdi: string
  aciklama: string
  icon: string
  color: string
  raporTuru: 'dashboard-scalar' | 'dashboard-list' | 'dashboard-pie' | 'dashboard-chart' | 'normal-report' | 'pivot-report'
  sqlSorgusu: string
  showDate1: boolean
  showDate2: boolean
  showSearch: boolean
  aktif: boolean
  anahtarKelimeler: string[]
  kategori: string
  ornekSorular: string[]
  pivotSettings?: {
    rowField: string
    columnField: string
    valueField: string
    aggregationType: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'
    showRowTotals: boolean
    showColumnTotals: boolean
    showGrandTotal: boolean
  }
}

interface TestResult {
  [key: string]: any
}

const REPORT_TYPES = [
  { value: 'normal-report', label: 'Normal Rapor' },
  { value: 'dashboard-scalar', label: 'Dashboard - Skalar Değer' },
  { value: 'dashboard-list', label: 'Dashboard - Liste' },
  { value: 'dashboard-pie', label: 'Dashboard - Pasta Grafik' },
  { value: 'dashboard-chart', label: 'Dashboard - Bar Grafik' },
  { value: 'pivot-report', label: 'Pivot Tablo Raporu' }
]

const POPULAR_ICONS = [
  'FileText', 'BarChart', 'PieChart', 'LineChart', 'TrendingUp', 'Activity',
  'Database', 'Table', 'List', 'Grid', 'Layers', 'Package',
  'ShoppingCart', 'Users', 'User', 'UserCheck', 'DollarSign', 'CreditCard',
  'Calendar', 'Clock', 'AlertCircle', 'CheckCircle', 'XCircle', 'Info',
  'Settings', 'Filter', 'Search', 'Download', 'Upload', 'FileSpreadsheet',
  'BookOpen', 'Briefcase', 'Building', 'Clipboard', 'Code', 'Cpu',
  'Edit', 'Eye', 'FolderOpen', 'Globe', 'Hash', 'Heart', 'Home',
  'Inbox', 'Key', 'Link', 'Lock', 'Mail', 'Map', 'MessageSquare',
  'Monitor', 'Moon', 'Paperclip', 'Phone', 'Plus', 'Printer', 'RefreshCw',
  'Save', 'Send', 'Server', 'Share', 'Shield', 'Star', 'Sun',
  'Tag', 'Target', 'Terminal', 'Trash', 'TrendingDown', 'Truck', 'Unlock',
  'Video', 'Volume2', 'Wifi', 'Zap', 'Archive', 'Award', 'Bell',
  'Bookmark', 'Box', 'Camera', 'Folder', 'ArrowUp', 'ArrowDown'
]

const KATEGORI_OPTIONS = [
  '',
  'Satış',
  'Stok',
  'Finans',
  'İnsan Kaynakları',
  'Müşteri',
  'Üretim',
  'Lojistik',
  'Diğer'
]

const COLOR_THEMES = [
  { value: 'blue-indigo', label: 'Mavi - İndigo', from: 'from-blue-500', to: 'to-indigo-600', darkFrom: 'dark:from-blue-600', darkTo: 'dark:to-indigo-950' },
  { value: 'green-teal', label: 'Yeşil - Turkuaz', from: 'from-green-500', to: 'to-teal-600', darkFrom: 'dark:from-green-600', darkTo: 'dark:to-teal-950' },
  { value: 'purple-pink', label: 'Mor - Pembe', from: 'from-purple-500', to: 'to-pink-600', darkFrom: 'dark:from-purple-600', darkTo: 'dark:to-pink-950' },
  { value: 'orange-red', label: 'Turuncu - Kırmızı', from: 'from-orange-500', to: 'to-red-600', darkFrom: 'dark:from-orange-600', darkTo: 'dark:to-red-950' },
  { value: 'gray-slate', label: 'Gri - Kurşuni', from: 'from-gray-500', to: 'to-slate-600', darkFrom: 'dark:from-gray-600', darkTo: 'dark:to-slate-950' },
  { value: 'cyan-blue', label: 'Cyan - Mavi', from: 'from-cyan-500', to: 'to-blue-600', darkFrom: 'dark:from-cyan-600', darkTo: 'dark:to-blue-950' },
  { value: 'amber-orange', label: 'Amber - Turuncu', from: 'from-amber-500', to: 'to-orange-600', darkFrom: 'dark:from-amber-600', darkTo: 'dark:to-orange-950' },
  { value: 'rose-red', label: 'Gül - Kırmızı', from: 'from-rose-500', to: 'to-red-600', darkFrom: 'dark:from-rose-600', darkTo: 'dark:to-red-950' }
]

export function ReportForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [showIconPicker, setShowIconPicker] = useState(false)

  // Preview parametreleri
  const [previewDate1, setPreviewDate1] = useState('')
  const [previewDate2, setPreviewDate2] = useState('')
  const [previewSearch, setPreviewSearch] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const totalPages = Math.ceil(testResults.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentResults = testResults.slice(startIndex, endIndex)

  const [formData, setFormData] = useState<ReportFormData>({
    raporAdi: '',
    aciklama: '',
    icon: 'FileText',
    color: 'blue-indigo',
    raporTuru: 'normal-report',
    sqlSorgusu: '',
    showDate1: false,
    showDate2: false,
    showSearch: false,
    aktif: true,
    anahtarKelimeler: [],
    kategori: '',
    ornekSorular: [],
    pivotSettings: {
      rowField: '',
      columnField: '',
      valueField: '',
      aggregationType: 'SUM',
      showRowTotals: true,
      showColumnTotals: true,
      showGrandTotal: true
    }
  })

  useEffect(() => {
    if (isEdit) {
      loadReport()
    }
  }, [id])

  const loadReport = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('clientToken')
      const response = await axios.get(`${config.API_URL}/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        const report = response.data.report
        setFormData({
          raporAdi: report.raporAdi,
          aciklama: report.aciklama || '',
          icon: report.icon || 'FileText',
          color: report.color || 'blue-indigo',
          raporTuru: report.raporTuru,
          sqlSorgusu: report.sqlSorgusu,
          showDate1: report.showDate1 || false,
          showDate2: report.showDate2 || false,
          showSearch: report.showSearch || false,
          aktif: report.aktif !== undefined ? report.aktif : true,
          anahtarKelimeler: report.anahtarKelimeler || [],
          kategori: report.kategori || '',
          ornekSorular: report.ornekSorular || [],
          pivotSettings: report.pivotSettings || {
            rowField: '',
            columnField: '',
            valueField: '',
            aggregationType: 'SUM',
            showRowTotals: true,
            showColumnTotals: true,
            showGrandTotal: true
          }
        })
      }
    } catch (error) {
      console.error('Report loading error:', error)
      toast.error('Rapor yüklenemedi')
      navigate('/report-designs')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (testResults.length === 0) return

    const headers = Object.keys(testResults[0])
    const csvContent = [
      headers.join(','),
      ...testResults.map(row =>
        headers.map(header => {
          const value = row[header]
          const stringValue = value !== null && value !== undefined ? String(value) : ''
          return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rapor-onizleme-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('CSV dosyası indirildi')
  }

  const handleExportExcel = () => {
    toast.info('Excel export özelliği yakında eklenecek')
  }

  const handleTestQuery = async () => {
    if (!formData.sqlSorgusu) {
      toast.error('SQL sorgusu gereklidir')
      return
    }

    try {
      setTesting(true)
      const token = localStorage.getItem('clientToken')

      // SQL Injection koruması: tek tırnak karakterini iki tırnak yap
      const escapeSqlString = (str: string) => {
        return str.replace(/'/g, "''")
      }

      // Parametreleri replace et
      let processedQuery = formData.sqlSorgusu

      // Always replace all parameters, even if not shown in form
      // Date1
      processedQuery = processedQuery.replace(/@date1/g, previewDate1 ? `'${previewDate1}'` : "''")

      // Date2
      processedQuery = processedQuery.replace(/@date2/g, previewDate2 ? `'${previewDate2}'` : "''")

      // Search
      const escapedSearch = previewSearch ? escapeSqlString(previewSearch) : ''
      processedQuery = processedQuery.replace(/@search/g, `'${escapedSearch}'`)

      // Test query via customer/mssql endpoint (uses JWT auth + active session)
      const response = await axios.post(
        `${config.API_URL}/connector-proxy/customer/mssql`,
        {
          query: processedQuery
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        const results = response.data.data?.recordsets?.[0] || []
        setTestResults(results)
        toast.success(`Sorgu başarılı! ${results.length} kayıt bulundu`)
      }
    } catch (error: any) {
      console.error('Query test error:', error)
      console.error('Error response:', error.response?.data)

      // Detaylı hata mesajı göster
      let errorMessage = 'Sorgu çalıştırılamadı'

      // Backend'den gelen tüm olası hata yapılarını kontrol et
      if (error.response?.data?.error?.message) {
        // Backend SQL hatası: { error: { message: "..." } }
        errorMessage = error.response.data.error.message
      } else if (error.response?.data?.message) {
        // Genel backend hatası: { message: "..." }
        errorMessage = error.response.data.message
      } else if (error.response?.data?.error) {
        // Hata string olabilir
        errorMessage = typeof error.response.data.error === 'string'
          ? error.response.data.error
          : JSON.stringify(error.response.data.error)
      } else if (error.message) {
        // Network hatası
        errorMessage = error.message
      }

      setTestResults([])
      toast.error(errorMessage, {
        duration: 5000,
        style: { maxWidth: '600px' }
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.raporAdi || !formData.sqlSorgusu) {
      toast.error('Rapor adı ve SQL sorgusu gereklidir')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('clientToken')

      if (isEdit) {
        // Update existing report
        const response = await axios.put(
          `${config.API_URL}/reports/${id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )

        if (response.data.success) {
          toast.success('Rapor güncellendi')
          navigate('/report-designs')
        }
      } else {
        // Create new report
        const response = await axios.post(
          `${config.API_URL}/reports`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )

        if (response.data.success) {
          toast.success('Rapor oluşturuldu')
          navigate('/report-designs')
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'İşlem başarısız')
    } finally {
      setLoading(false)
    }
  }

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.FileText
    return <IconComponent className="w-6 h-6" />
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/report-designs')}
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <LucideIcons.ArrowLeft className="w-4 h-4 mr-2" />
          Geri
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Rapor Düzenle' : 'Yeni Rapor Oluştur'}
        </h2>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Rapor Adı ve Icon */}
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rapor Adı *
                </label>
                <input
                  type="text"
                  required
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.raporAdi}
                  onChange={(e) => setFormData({ ...formData, raporAdi: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Icon
                </label>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors border border-gray-300 dark:border-gray-600"
                  disabled={loading}
                >
                  {renderIcon(formData.icon)}
                </button>

                {/* Icon Picker Dropdown */}
                {showIconPicker && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">İkon Seç</h4>
                      <button
                        type="button"
                        onClick={() => setShowIconPicker(false)}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      >
                        <LucideIcons.X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
                      {POPULAR_ICONS.map((iconName) => {
                        const IconComponent = (LucideIcons as any)[iconName]
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, icon: iconName })
                              setShowIconPicker(false)
                            }}
                            className={`p-3 rounded-lg transition-colors ${formData.icon === iconName
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                              }`}
                            title={iconName}
                          >
                            <IconComponent className="w-5 h-5" />
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <input
                        type="text"
                        placeholder="veya ikon adı yazın..."
                        className="block w-full text-xs border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Renk Seçici (Dashboard Scalar için) */}
            {formData.raporTuru === 'dashboard-scalar' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Renk Teması
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {COLOR_THEMES.map((theme) => {
                    const isSelected = formData.color === theme.value
                    return (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: theme.value })}
                        className={`relative p-4 rounded-lg border-2 transition-all ${isSelected
                          ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                      >
                        <div className={`h-12 rounded-md bg-gradient-to-br ${theme.from} ${theme.to} ${theme.darkFrom} ${theme.darkTo} mb-2`}></div>
                        <p className="text-xs font-medium text-gray-900 dark:text-white text-center">
                          {theme.label}
                        </p>
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-blue-600 dark:bg-blue-400 rounded-full p-1">
                            <LucideIcons.Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Açıklama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Açıklama
              </label>
              <input
                type="text"
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.aciklama}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                disabled={loading}
              />
            </div>

            {/* Rapor Türü ve Yayınla Toggle */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rapor Türü */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rapor Türü *
                </label>
                <select
                  required
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.raporTuru}
                  onChange={(e) => setFormData({ ...formData, raporTuru: e.target.value as ReportFormData['raporTuru'] })}
                  disabled={loading}
                >
                  {REPORT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Yayınla Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Durum
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.aktif}
                      onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                      disabled={loading}
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${formData.aktif
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.aktif ? 'transform translate-x-5' : ''
                        }`}></div>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Raporu Yayınla
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.aktif ? 'Rapor kullanıcılara görünür' : 'Rapor gizli'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Chat Özelliği İçin */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Chat Rapor Özellikleri
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Kullanıcıların doğal dil ile bu raporu bulabilmesi için anahtar kelimeler ve kategori ekleyin
              </p>

              <div className="space-y-4">
                {/* Kategori */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    {KATEGORI_OPTIONS.map((kat) => (
                      <option key={kat} value={kat}>
                        {kat || 'Kategori Seçin'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Anahtar Kelimeler */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Anahtar Kelimeler
                  </label>
                  <input
                    type="text"
                    value={formData.anahtarKelimeler.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      anahtarKelimeler: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                    })}
                    placeholder="Örn: satış, ciro, günlük (virgülle ayırın)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Kullanıcıların bu raporu bulmasına yardımcı olacak kelimeler
                  </p>
                </div>

                {/* Örnek Sorular */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Örnek Sorular
                  </label>
                  <textarea
                    value={formData.ornekSorular.join('\n')}
                    onChange={(e) => setFormData({
                      ...formData,
                      ornekSorular: e.target.value.split('\n').filter(s => s.trim())
                    })}
                    placeholder="Örn:&#10;Bugünkü satışlar nedir?&#10;Bu ayki cirom ne kadar?"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Her satıra bir örnek soru yazın (kullanıcıya ipucu olarak gösterilecek)
                  </p>
                </div>
              </div>
            </div>

            {/* Pivot Settings - Only show when raporTuru is 'pivot-report' */}
            {formData.raporTuru === 'pivot-report' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <LucideIcons.Table2 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Pivot Tablo Ayarları
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Row Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Satır Alanı *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: KategoriAdi"
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.pivotSettings?.rowField || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        pivotSettings: {
                          ...formData.pivotSettings!,
                          rowField: e.target.value
                        }
                      })}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Satırlarda gösterilecek sütun adı
                    </p>
                  </div>

                  {/* Column Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sütun Alanı *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Ay"
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.pivotSettings?.columnField || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        pivotSettings: {
                          ...formData.pivotSettings!,
                          columnField: e.target.value
                        }
                      })}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Sütunlarda gösterilecek sütun adı
                    </p>
                  </div>

                  {/* Value Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Değer Alanı *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: SatisTutari"
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.pivotSettings?.valueField || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        pivotSettings: {
                          ...formData.pivotSettings!,
                          valueField: e.target.value
                        }
                      })}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Toplanacak/hesaplanacak sütun adı
                    </p>
                  </div>
                </div>

                {/* Aggregation Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Toplama Türü *
                  </label>
                  <select
                    className="block w-full md:w-1/2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.pivotSettings?.aggregationType || 'SUM'}
                    onChange={(e) => setFormData({
                      ...formData,
                      pivotSettings: {
                        ...formData.pivotSettings!,
                        aggregationType: e.target.value as 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'
                      }
                    })}
                  >
                    <option value="SUM">Toplam (SUM)</option>
                    <option value="COUNT">Sayım (COUNT)</option>
                    <option value="AVG">Ortalama (AVG)</option>
                    <option value="MIN">Minimum (MIN)</option>
                    <option value="MAX">Maximum (MAX)</option>
                  </select>
                </div>

                {/* Display Options */}
                <div className="space-y-2 mb-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={formData.pivotSettings?.showRowTotals ?? true}
                      onChange={(e) => setFormData({
                        ...formData,
                        pivotSettings: {
                          ...formData.pivotSettings!,
                          showRowTotals: e.target.checked
                        }
                      })}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Satır toplamlarını göster
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={formData.pivotSettings?.showColumnTotals ?? true}
                      onChange={(e) => setFormData({
                        ...formData,
                        pivotSettings: {
                          ...formData.pivotSettings!,
                          showColumnTotals: e.target.checked
                        }
                      })}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Sütun toplamlarını göster
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={formData.pivotSettings?.showGrandTotal ?? true}
                      onChange={(e) => setFormData({
                        ...formData,
                        pivotSettings: {
                          ...formData.pivotSettings!,
                          showGrandTotal: e.target.checked
                        }
                      })}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Genel toplamı göster
                    </span>
                  </label>
                </div>

                {/* Help Text */}
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    <strong>SQL Sorgu Formatı:</strong> Sorgunuz şu 3 sütunu içermelidir:
                    <code className="px-1 mx-1 bg-yellow-100 dark:bg-yellow-900/40 rounded">{formData.pivotSettings?.rowField || '[SatırAlanı]'}</code>,
                    <code className="px-1 mx-1 bg-yellow-100 dark:bg-yellow-900/40 rounded">{formData.pivotSettings?.columnField || '[SütunAlanı]'}</code>,
                    <code className="px-1 mx-1 bg-yellow-100 dark:bg-yellow-900/40 rounded">{formData.pivotSettings?.valueField || '[DeğerAlanı]'}</code>
                  </p>
                  <p className="text-xs text-yellow-800 dark:text-yellow-300 mt-2">
                    <strong>Örnek:</strong> <code className="text-xs bg-yellow-100 dark:bg-yellow-900/40 rounded px-1">SELECT KategoriAdi, Ay, SUM(Tutar) AS Tutar FROM Satislar GROUP BY KategoriAdi, Ay</code>
                  </p>
                </div>
              </div>
            )}

            {/* Parametre Ayarları */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Rapor Parametreleri
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Rapor çalıştırılırken kullanıcıya gösterilecek parametreleri seçin
              </p>

              <div className="space-y-3">
                {/* Tarih 1 */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.showDate1}
                      onChange={(e) => setFormData({ ...formData, showDate1: e.target.checked })}
                      disabled={loading}
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${formData.showDate1
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.showDate1 ? 'transform translate-x-5' : ''
                        }`}></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Başlangıç Tarihi (@date1)
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      SQL sorgusunda @date1 parametresi kullanılabilir
                    </p>
                  </div>
                </label>

                {/* Tarih 2 */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.showDate2}
                      onChange={(e) => setFormData({ ...formData, showDate2: e.target.checked })}
                      disabled={loading}
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${formData.showDate2
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.showDate2 ? 'transform translate-x-5' : ''
                        }`}></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Bitiş Tarihi (@date2)
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      SQL sorgusunda @date2 parametresi kullanılabilir
                    </p>
                  </div>
                </label>

                {/* Arama */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.showSearch}
                      onChange={(e) => setFormData({ ...formData, showSearch: e.target.checked })}
                      disabled={loading}
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${formData.showSearch
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.showSearch ? 'transform translate-x-5' : ''
                        }`}></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Arama Kutusu (@search)
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      SQL sorgusunda @search parametresi kullanılabilir
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* SQL Sorgusu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SQL Sorgusu *
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Parametreler: <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">@date1</code>,{' '}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">@date2</code>,{' '}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">@search</code>
              </p>
              <textarea
                required
                rows={12}
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                placeholder="SELECT * FROM Tablo WHERE Tarih >= '@date1' AND Tarih <= '@date2'"
                value={formData.sqlSorgusu}
                onChange={(e) => setFormData({ ...formData, sqlSorgusu: e.target.value })}
                disabled={loading}
              />
            </div >
          </div >

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/report-designs')}
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LucideIcons.Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? 'Güncelleniyor...' : 'Oluşturuluyor...'}
                </>
              ) : (
                isEdit ? 'Güncelle' : 'Oluştur'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Rapor Önizleme - Preview */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 mr-3">
              {renderIcon(formData.icon)}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {formData.raporAdi || 'Rapor Önizleme'}
            </h3>
          </div>

          {/* Export & Page Size */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={testResults.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Excel'e Aktar"
            >
              <LucideIcons.FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </button>
            <button
              onClick={handleExportCSV}
              disabled={testResults.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="CSV'ye Aktar"
            >
              <LucideIcons.FileText className="w-4 h-4 mr-2" />
              CSV
            </button>

            <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2"></div>

            <LucideIcons.Rows className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
          </div>
        </div>

        {/* Filtre Paneli */}
        {
          (formData.showDate1 || formData.showDate2 || formData.showSearch) && (
            <div className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Filtreler
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {formData.showDate1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      value={previewDate1}
                      onChange={(e) => setPreviewDate1(e.target.value)}
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                )}

                {formData.showDate2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={previewDate2}
                      onChange={(e) => setPreviewDate2(e.target.value)}
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                )}

                {formData.showSearch && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Arama
                    </label>
                    <input
                      type="text"
                      placeholder="Arama metni..."
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Listele Butonu */}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleTestQuery}
                  disabled={testing || loading || !formData.sqlSorgusu}
                  className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testing ? (
                    <>
                      <LucideIcons.Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Yükleniyor...
                    </>
                  ) : (
                    <>
                      <LucideIcons.List className="w-5 h-5 mr-2" />
                      Listele
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        }

        {/* Test Sonuçları */}
        {
          testResults.length > 0 ? (
            <div>
              {/* Dashboard Skalar Değer - Card Preview */}
              {formData.raporTuru === 'dashboard-scalar' && (
                <div className="mb-6">
                  <div className={`bg-gradient-to-br ${COLOR_THEMES.find(t => t.value === formData.color)?.from || 'from-blue-500'} ${COLOR_THEMES.find(t => t.value === formData.color)?.to || 'to-indigo-600'} ${COLOR_THEMES.find(t => t.value === formData.color)?.darkFrom || 'dark:from-blue-600'} ${COLOR_THEMES.find(t => t.value === formData.color)?.darkTo || 'dark:to-indigo-950'} rounded-lg shadow-lg p-6`}>
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-white/20 rounded-lg text-white mr-3">
                        {renderIcon(formData.icon)}
                      </div>
                      <h4 className="text-white text-lg font-semibold">
                        {formData.raporAdi || 'Skalar Değer'}
                      </h4>
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {testResults[0] && Object.values(testResults[0])[0] !== null
                        ? String(Object.values(testResults[0])[0])
                        : '0'}
                    </p>
                    {formData.aciklama && (
                      <p className="text-white/80 text-xs mt-2">
                        {formData.aciklama}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <strong>Not:</strong> Dashboard'da bu görünümde gösterilecek. İlk satırın ilk sütunu kullanılır.
                  </div>
                </div>
              )}

              {/* Dashboard Pasta Grafik - Pie Chart Preview */}
              {formData.raporTuru === 'dashboard-pie' && (() => {
                // Veriyi pie chart formatına dönüştür: [{ name: string, value: number }]
                let chartData = testResults.map(row => {
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
                  <div className="mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 mr-3">
                          {renderIcon(formData.icon)}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formData.raporAdi || 'Pasta Grafik'}
                        </h4>
                      </div>
                      {formData.aciklama && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{formData.aciklama}</p>
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
                              {chartData.map((_, index) => (
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
                              wrapperStyle={{ paddingTop: '0px', marginTop: '-40px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      <strong>Not:</strong> Dashboard'da bu görünümde gösterilecek. İlk sütun etiket (string), ikinci sütun değer (sayısal) olmalıdır. En büyük 5 değer gösterilir, geri kalanlar "Diğer" olarak toplanır.
                    </div>
                  </div>
                )
              })()}

              {/* Pivot Rapor - Pivot Table */}
              {formData.raporTuru === 'pivot-report' && formData.pivotSettings && (() => {
                const { rowField, columnField, valueField, aggregationType, showRowTotals, showColumnTotals, showGrandTotal } = formData.pivotSettings

                if (!rowField || !columnField || !valueField || testResults.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      {!rowField || !columnField || !valueField
                        ? 'Pivot ayarlarını tamamlayın ve sorgu testini çalıştırın'
                        : 'Sorgu sonucu boş'
                      }
                    </div>
                  )
                }

                try {
                  const pivotData = transformToPivot(testResults, rowField, columnField, valueField, aggregationType)

                  if (pivotData.rows.length === 0 || pivotData.columns.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Pivot tablo oluşturulamadı. Sorgu sonuçlarını kontrol edin.
                      </div>
                    )
                  }

                  return (
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                          <tr>
                            {/* Empty corner cell */}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider bg-gray-100 dark:bg-gray-800">
                              {rowField}
                            </th>

                            {/* Column headers */}
                            {pivotData.columns.map(col => (
                              <th key={col} className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                {col}
                              </th>
                            ))}

                            {/* Row totals header */}
                            {showRowTotals && (
                              <th className="px-6 py-3 text-right text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30">
                                Toplam
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {/* Data rows */}
                          {pivotData.rows.map(row => (
                            <tr key={row} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              {/* Row label */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900">
                                {row}
                              </td>

                              {/* Data cells */}
                              {pivotData.columns.map(col => (
                                <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                                  {(pivotData.data[row]?.[col] || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                                </td>
                              ))}

                              {/* Row total */}
                              {showRowTotals && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20">
                                  {(pivotData.rowTotals[row] || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                                </td>
                              )}
                            </tr>
                          ))}

                          {/* Column totals row */}
                          {showColumnTotals && (
                            <tr className="bg-blue-50 dark:bg-blue-900/30 font-semibold">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                Toplam
                              </td>

                              {pivotData.columns.map(col => (
                                <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-900 dark:text-blue-300">
                                  {(pivotData.columnTotals[col] || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                                </td>
                              ))}

                              {/* Grand total */}
                              {showGrandTotal && showRowTotals && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-900 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40">
                                  {pivotData.grandTotal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                                </td>
                              )}
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                        <p className="text-xs text-green-800 dark:text-green-300">
                          <strong>Pivot Tablo Özeti:</strong> {pivotData.rows.length} satır × {pivotData.columns.length} sütun |
                          Toplama: {aggregationType} |
                          Toplam Değer: {pivotData.grandTotal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  )
                } catch (error) {
                  console.error('Pivot transformation error:', error)
                  return (
                    <div className="text-center py-8 text-red-500 dark:text-red-400">
                      Pivot tablo oluşturulurken hata oluştu. Sütun isimlerini kontrol edin.
                      <br />
                      <span className="text-sm">Sorgunuz: {rowField}, {columnField}, {valueField} sütunlarını içermeli.</span>
                    </div>
                  )
                }
              })()}

              {/* Normal Rapor / Liste - Tablo Görünümü */}
              {(formData.raporTuru === 'normal-report' || formData.raporTuru === 'dashboard-list') && (
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {Object.keys(testResults[0]).map((key) => (
                          <th
                            key={key}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {currentResults.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {Object.values(row).map((value, cellIdx) => (
                            <td
                              key={cellIdx}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                            >
                              {value !== null && value !== undefined ? String(value) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Sol: Export Butonları */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportExcel}
                    disabled={testResults.length === 0}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Excel'e Aktar"
                  >
                    <LucideIcons.FileSpreadsheet className="w-4 h-4 mr-2" />
                    Excel
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={testResults.length === 0}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="CSV'ye Aktar"
                  >
                    <LucideIcons.FileText className="w-4 h-4 mr-2" />
                    CSV
                  </button>

                  <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {startIndex + 1}-{Math.min(endIndex, testResults.length)} / {testResults.length}
                  </span>
                </div>

                {/* Sağ: Pagination Kontrolleri */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="İlk Sayfa"
                  >
                    <LucideIcons.ChevronsLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Önceki Sayfa"
                  >
                    <LucideIcons.ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Sonraki Sayfa"
                  >
                    <LucideIcons.ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Son Sayfa"
                  >
                    <LucideIcons.ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <LucideIcons.Database className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sorguyu test edin ve sonuçları burada görün
              </p>
            </div>
          )
        }
      </div >
    </div >
  )
}
