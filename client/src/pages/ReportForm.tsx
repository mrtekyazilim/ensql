import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'

interface ReportFormData {
  raporAdi: string
  aciklama: string
  icon: string
  raporTuru: 'dashboard-scalar' | 'dashboard-list' | 'dashboard-pie' | 'normal-report'
  sqlSorgusu: string
  showDate1: boolean
  showDate2: boolean
  showSearch: boolean
  aktif: boolean
}

interface TestResult {
  [key: string]: any
}

const REPORT_TYPES = [
  { value: 'normal-report', label: 'Normal Rapor' },
  { value: 'dashboard-scalar', label: 'Dashboard - Skalar Değer' },
  { value: 'dashboard-list', label: 'Dashboard - Liste' },
  { value: 'dashboard-pie', label: 'Dashboard - Pasta Grafik' }
]

const POPULAR_ICONS = [
  'FileText', 'BarChart', 'PieChart', 'LineChart', 'TrendingUp', 'Activity',
  'Database', 'Table', 'List', 'Grid', 'Layers', 'Package',
  'ShoppingCart', 'Users', 'User', 'UserCheck', 'DollarSign', 'CreditCard',
  'Calendar', 'Clock', 'AlertCircle', 'CheckCircle', 'XCircle', 'Info',
  'Settings', 'Filter', 'Search', 'Download', 'Upload', 'FileSpreadsheet'
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

  const [formData, setFormData] = useState<ReportFormData>({
    raporAdi: '',
    aciklama: '',
    icon: 'FileText',
    raporTuru: 'normal-report',
    sqlSorgusu: '',
    showDate1: false,
    showDate2: false,
    showSearch: false,
    aktif: true
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
      const response = await axios.get(`http://localhost:13201/api/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        const report = response.data.report
        setFormData({
          raporAdi: report.raporAdi,
          aciklama: report.aciklama || '',
          icon: report.icon || 'FileText',
          raporTuru: report.raporTuru,
          sqlSorgusu: report.sqlSorgusu,
          showDate1: report.showDate1 || false,
          showDate2: report.showDate2 || false,
          showSearch: report.showSearch || false,
          aktif: report.aktif !== undefined ? report.aktif : true
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

      if (formData.showDate1 && previewDate1) {
        processedQuery = processedQuery.replace(/@date1/g, `'${previewDate1}'`)
      }

      if (formData.showDate2 && previewDate2) {
        processedQuery = processedQuery.replace(/@date2/g, `'${previewDate2}'`)
      }

      if (formData.showSearch && previewSearch) {
        const escapedSearch = escapeSqlString(previewSearch)
        processedQuery = processedQuery.replace(/@search/g, `'${escapedSearch}'`)
      }

      // Test query via customer/mssql endpoint (uses JWT auth + active session)
      const response = await axios.post(
        'http://localhost:13201/api/connector-proxy/customer/mssql',
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
      toast.error(error.response?.data?.message || 'Sorgu testi başarısız')
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
          `http://localhost:13201/api/reports/${id}`,
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
          'http://localhost:13201/api/reports',
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
    <div className="max-w-4xl mx-auto">
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
                    <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
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
        <div className="flex items-center mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 mr-3">
            {renderIcon(formData.icon)}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {formData.raporAdi || 'Rapor Önizleme'}
          </h3>
        </div>

        {/* Filtre Paneli */}
        {(formData.showDate1 || formData.showDate2 || formData.showSearch) && (
          <div className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Filtreler
              </h4>
              <button
                type="button"
                onClick={handleTestQuery}
                disabled={testing || loading || !formData.sqlSorgusu}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? (
                  <>
                    <LucideIcons.Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <LucideIcons.List className="w-4 h-4 mr-2" />
                    Listele
                  </>
                )}
              </button>
            </div>
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
          </div>
        )}

        {/* Test Sonuçları */}
        {testResults.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Sorgu Sonuçları ({testResults.length} kayıt)
              </h4>
              <button
                onClick={() => setTestResults([])}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Temizle
              </button>
            </div>
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {Object.keys(testResults[0]).map((key) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {testResults.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {Object.values(row).map((value, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                        >
                          {value !== null && value !== undefined ? String(value) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {testResults.length > 50 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                İlk 50 kayıt gösteriliyor. Toplam: {testResults.length}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <LucideIcons.Database className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sorguyu test edin ve sonuçları burada görün
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
