import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

  // Results
  const [results, setResults] = useState<any[]>([])

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

      if (report.showDate1) {
        sqlQuery = sqlQuery.replace(/@date1/g, date1 ? `'${date1}'` : "''")
      }

      if (report.showDate2) {
        sqlQuery = sqlQuery.replace(/@date2/g, date2 ? `'${date2}'` : "''")
      }

      if (report.showSearch) {
        const escapedSearch = search ? escapeSqlString(search) : ''
        sqlQuery = sqlQuery.replace(/@search/g, `'${escapedSearch}'`)
      }

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
        <div className="flex items-center mb-4">
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

        {/* Filtreler */}
        {(report.showDate1 || report.showDate2 || report.showSearch) && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Filtreler
              </h4>
              <button
                type="button"
                onClick={handleExecuteReport}
                disabled={executing}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {executing ? (
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
              {report.showDate1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={date1}
                    onChange={(e) => setDate1(e.target.value)}
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
                    onChange={(e) => setDate2(e.target.value)}
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
          </div>
        )}

        {!report.showDate1 && !report.showDate2 && !report.showSearch && (
          <div className="text-center py-4">
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
                  Raporu Listele
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Rapor Sonuçları ({results.length} kayıt)
            </h3>
            <button
              onClick={() => setResults([])}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Temizle
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {Object.keys(results[0]).map((key) => (
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
                {results.map((row, rowIndex) => (
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
