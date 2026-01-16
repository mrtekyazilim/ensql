import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

interface Report {
  _id: string
  raporAdi: string
  aciklama: string
  sqlSorgusu: string
  kullanimSayisi: number
  sonKullanimTarihi?: string
}

export function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

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
    } finally {
      setLoading(false)
    }
  }

  const handleRunReport = async (report: Report) => {
    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.post(
        `http://localhost:13201/api/reports/${report._id}/execute`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        toast.success('Rapor başarıyla çalıştırıldı')
        loadReports()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Rapor çalıştırılamadı')
    }
  }

  const filteredReports = reports.filter(report =>
    report.raporAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.aciklama && report.aciklama.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Raporlarım</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arama</label>
            <input
              type="text"
              placeholder="Rapor ara..."
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlangıç Tarihi</label>
            <input
              type="date"
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bitiş Tarihi</label>
            <input
              type="date"
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredReports.map((report) => (
            <li key={report._id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                      {report.raporAdi}
                    </p>
                    {report.aciklama && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {report.aciklama}
                      </p>
                    )}
                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span>Kullanım: {report.kullanimSayisi} kez</span>
                      {report.sonKullanimTarihi && (
                        <span className="ml-4">
                          Son: {new Date(report.sonKullanimTarihi).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedReport(report)
                        setShowModal(true)
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Detay
                    </button>
                    <button
                      onClick={() => handleRunReport(report)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      Çalıştır
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {filteredReports.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              Rapor bulunamadı
            </li>
          )}
        </ul>
      </div>

      {showModal && selectedReport && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 transition-opacity" onClick={() => setShowModal(false)}></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  {selectedReport.raporAdi}
                </h3>
                {selectedReport.aciklama && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{selectedReport.aciklama}</p>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SQL Sorgusu:</label>
                  <pre className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-3 text-xs overflow-x-auto text-gray-900 dark:text-gray-100">
                    {selectedReport.sqlSorgusu}
                  </pre>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
