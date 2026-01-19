import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import * as XLSX from 'xlsx'

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

export function ReportExecute() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)

  // Parameters
  const [date1, setDate1] = useState('')
  const [date2, setDate2] = useState('')
  const [search, setSearch] = useState('')
  const [quickDate, setQuickDate] = useState('ozel')

  // Results
  const [results, setResults] = useState<any[]>([])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const totalPages = Math.ceil(results.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentResults = results.slice(startIndex, endIndex)

  useEffect(() => {
    loadReport()
  }, [id])

  const loadReport = async () => {
    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.get(`http://localhost:13201/api/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setReport(response.data.report)
      }
    } catch (error) {
      console.error('Report loading error:', error)
      toast.error('Rapor yüklenemedi')
      navigate('/reports')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDateChange = (value: string) => {
    setQuickDate(value)

    const today = new Date()
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    switch (value) {
      case 'bugun':
        setDate1(formatDate(today))
        setDate2(formatDate(today))
        break

      case 'dun':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        setDate1(formatDate(yesterday))
        setDate2(formatDate(yesterday))
        break

      case 'bu-hafta':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay() + 1) // Pazartesi
        setDate1(formatDate(weekStart))
        setDate2(formatDate(today))
        break

      case 'bu-ay':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        setDate1(formatDate(monthStart))
        setDate2(formatDate(today))
        break

      case 'gecen-ay':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
        setDate1(formatDate(lastMonthStart))
        setDate2(formatDate(lastMonthEnd))
        break

      case 'son-3-ay':
        const threeMonthsAgo = new Date(today)
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        setDate1(formatDate(threeMonthsAgo))
        setDate2(formatDate(today))
        break

      case 'son-6-ay':
        const sixMonthsAgo = new Date(today)
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        setDate1(formatDate(sixMonthsAgo))
        setDate2(formatDate(today))
        break

      case 'bu-yil':
        const yearStart = new Date(today.getFullYear(), 0, 1)
        setDate1(formatDate(yearStart))
        setDate2(formatDate(today))
        break

      case 'son-1-yil':
        const oneYearAgo = new Date(today)
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        setDate1(formatDate(oneYearAgo))
        setDate2(formatDate(today))
        break

      case 'ozel':
      default:
        // Özel seçildiğinde tarihleri değiştirme
        break
    }
  }

  const handleExecuteReport = async () => {
    if (!report) return

    setExecuting(true)

    try {
      const token = localStorage.getItem('clientToken')

      // SQL Injection koruması: tek tırnak karakterini iki tırnak yap
      const escapeSqlString = (str: string) => {
        return str.replace(/'/g, "''")
      }

      // Replace parameters in SQL query
      let sqlQuery = report.sqlSorgusu

      // Always replace all parameters, even if not shown in form
      // Date1
      sqlQuery = sqlQuery.replace(/@date1/g, date1 ? `'${date1}'` : "''")

      // Date2
      sqlQuery = sqlQuery.replace(/@date2/g, date2 ? `'${date2}'` : "''")

      // Search
      const escapedSearch = search ? escapeSqlString(search) : ''
      sqlQuery = sqlQuery.replace(/@search/g, `'${escapedSearch}'`)

      const response = await axios.post(
        `http://localhost:13201/api/reports/${report._id}/execute`,
        {
          date1,
          date2,
          search,
          sqlQuery
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        setResults(response.data.data || [])
        setCurrentPage(1) // Reset to first page on new results
        toast.success('Rapor başarıyla çalıştırıldı')
      }
    } catch (error: any) {
      console.error('Execute report error:', error)
      toast.error(error.response?.data?.message || 'Rapor çalıştırılamadı')
    } finally {
      setExecuting(false)
    }
  }

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.FileText
    return <IconComponent className="w-6 h-6" />
  }

  const handleExportExcel = () => {
    if (results.length === 0) {
      toast.error('Dışa aktarılacak veri yok')
      return
    }

    // Worksheet oluştur
    const worksheet = XLSX.utils.json_to_sheet(results)

    // Workbook oluştur
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, report?.raporAdi || 'Rapor')

    // Dosya adı
    const fileName = `${report?.raporAdi || 'rapor'}_${new Date().toISOString().split('T')[0]}.xlsx`

    // Excel dosyasını indir
    XLSX.writeFile(workbook, fileName)

    toast.success('Excel dosyası indirildi')
  }

  const handleExportCSV = () => {
    if (results.length === 0) {
      toast.error('Dışa aktarılacak veri yok')
      return
    }

    // CSV oluştur
    const headers = Object.keys(results[0])
    const csvContent = [
      headers.join(','),
      ...results.map(row =>
        headers.map(header => {
          const value = row[header]
          const stringValue = value !== null && value !== undefined ? String(value) : ''
          // CSV için tırnak içine al (virgül veya tırnak varsa)
          return stringValue.includes(',') || stringValue.includes('"')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue
        }).join(',')
      )
    ].join('\n')

    // Download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${report?.raporAdi || 'rapor'}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('CSV dosyası indirildi')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LucideIcons.Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <LucideIcons.AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Rapor bulunamadı</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/reports')}
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <LucideIcons.ArrowLeft className="w-4 h-4 mr-2" />
          Geri
        </button>
      </div>

      {/* Report Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="mb-4">
          {/* Başlık ve Export Butonları */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 mr-3">
                {renderIcon(report.icon)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {report.raporAdi}
                </h2>
                {report.aciklama && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {report.aciklama}
                  </p>
                )}
              </div>
            </div>

            {/* Export & Page Size - Geniş ekranda sağda */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportExcel}
                disabled={results.length === 0}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Excel'e Aktar"
              >
                <LucideIcons.FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </button>
              <button
                onClick={handleExportCSV}
                disabled={results.length === 0}
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
        </div>

        {/* Filtreler */}
        {(report.showDate1 || report.showDate2 || report.showSearch) && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Filtreler
            </h4>

            <div className={`grid grid-cols-1 gap-4 ${report.showDate1 && report.showDate2 && report.showSearch
              ? 'md:grid-cols-4'
              : report.showDate1 && report.showDate2
                ? 'md:grid-cols-3'
                : 'md:grid-cols-3'
              }`}>
              {/* Kolay Tarih Seçimi - Sadece her iki tarih de aktifse göster */}
              {report.showDate1 && report.showDate2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kolay Tarih Seçimi
                  </label>
                  <select
                    value={quickDate}
                    onChange={(e) => handleQuickDateChange(e.target.value)}
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="bugun">Bugün</option>
                    <option value="dun">Dün</option>
                    <option value="bu-hafta">Bu Hafta</option>
                    <option value="bu-ay">Bu Ay</option>
                    <option value="gecen-ay">Geçen Ay</option>
                    <option value="son-3-ay">Son 3 Ay</option>
                    <option value="son-6-ay">Son 6 Ay</option>
                    <option value="bu-yil">Bu Yıl</option>
                    <option value="son-1-yil">Son 1 Yıl</option>
                    <option value="ozel">Özel</option>
                  </select>
                </div>
              )}

              {report.showDate1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={date1}
                    onChange={(e) => {
                      setDate1(e.target.value)
                      setQuickDate('ozel')
                    }}
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}

              {report.showDate2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={date2}
                    onChange={(e) => {
                      setDate2(e.target.value)
                      setQuickDate('ozel')
                    }}
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}

              {report.showSearch && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Arama
                  </label>
                  <input
                    type="text"
                    placeholder="Arama metni..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}
            </div>

            {/* Listele Butonu */}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleExecuteReport}
                disabled={executing}
                className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {executing ? (
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
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {Object.keys(currentResults[0]).map((key) => (
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
                {currentResults.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {Object.values(row).map((value: any, colIndex) => (
                      <td
                        key={colIndex}
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

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Sol: Export Butonları */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportExcel}
                disabled={results.length === 0}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Excel'e Aktar"
              >
                <LucideIcons.FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </button>
              <button
                onClick={handleExportCSV}
                disabled={results.length === 0}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="CSV'ye Aktar"
              >
                <LucideIcons.FileText className="w-4 h-4 mr-2" />
                CSV
              </button>

              <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {startIndex + 1}-{Math.min(endIndex, results.length)} / {results.length}
              </span>
            </div>

            {/* Sağ: Pagination Kontrolleri */}
            <div className="flex flex-wrap items-center gap-2">
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
      )}

      {/* Empty State */}
      {results.length === 0 && !executing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
          <LucideIcons.Database className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Raporu çalıştırmak için {report.showDate1 || report.showDate2 || report.showSearch ? 'filtreleri doldurun ve' : ''} "Listele" butonuna tıklayın
          </p>
        </div>
      )}
    </div>
  )
}
