import { useNavigate } from 'react-router-dom'
import { Database, ChevronRight, FileText } from 'lucide-react'

export function Settings() {
  const navigate = useNavigate()

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Ayarlar</h2>

      <div className="space-y-4">
        {/* Connector Yönetimi Kartı */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => navigate('/connectors')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Connector Yönetimi
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  SQL Server bağlantılarınızı yönetin
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        {/* Rapor Tasarımları Kartı */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => navigate('/report-designs')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Rapor Tasarımları
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Rapor tanımlarınızı oluşturun ve yönetin
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        {/* Diğer ayarlar için placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            Diğer ayarlar yakında eklenecek...
          </p>
        </div>
      </div>
    </div>
  )
}
