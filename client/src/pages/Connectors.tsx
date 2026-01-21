import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, Copy, Database, Eye, EyeOff, Plug, CheckCircle, ArrowLeft } from 'lucide-react'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface Connector {
  _id: string
  connectorName: string
  clientId: string
  clientPassword?: string
  sqlServerConfig: {
    server: string
    database: string
    user: string
    password: string
    port: number
  }
  aktif: boolean
}

export function Connectors() {
  const navigate = useNavigate()
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingConnector, setEditingConnector] = useState<Connector | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [connectorToDelete, setConnectorToDelete] = useState<string | null>(null)
  const [showCopyDialog, setShowCopyDialog] = useState(false)
  const [connectorToCopy, setConnectorToCopy] = useState<Connector | null>(null)
  const [copyName, setCopyName] = useState('')
  const [showClientPassword, setShowClientPassword] = useState(false)
  const [showSqlPassword, setShowSqlPassword] = useState(false)
  const [testingConnector, setTestingConnector] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({})
  const [formTestLoading, setFormTestLoading] = useState(false)
  const [formTestResult, setFormTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [sqlTestLoading, setSqlTestLoading] = useState(false)
  const [sqlTestResult, setSqlTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [formData, setFormData] = useState({
    connectorName: '',
    clientId: '',
    clientPassword: '',
    sqlServer: 'localhost',
    sqlDatabase: '',
    sqlUser: 'sa',
    sqlPassword: '',
    sqlPort: 1433
  })

  useEffect(() => {
    loadConnectors()
  }, [])

  const loadConnectors = async () => {
    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.get('http://localhost:13201/api/connectors', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setConnectors(response.data.connectors)
      }
    } catch (error) {
      console.error('Connectors loading error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateConnector = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.post(
        'http://localhost:13201/api/connectors',
        {
          connectorName: formData.connectorName,
          clientId: formData.clientId,
          clientPassword: formData.clientPassword,
          sqlServerConfig: {
            server: formData.sqlServer,
            database: formData.sqlDatabase,
            user: formData.sqlUser,
            password: formData.sqlPassword,
            port: formData.sqlPort
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        toast.success('Connector başarıyla oluşturuldu!')
        loadConnectors()
        resetForm()
        setShowModal(false)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Connector oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateConnector = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingConnector) return

    setLoading(true)
    try {
      const token = localStorage.getItem('clientToken')

      const updateData: any = {
        connectorName: formData.connectorName,
        clientId: formData.clientId,
        sqlServerConfig: {
          server: formData.sqlServer,
          database: formData.sqlDatabase,
          user: formData.sqlUser,
          password: formData.sqlPassword,
          port: formData.sqlPort
        }
      }

      // Eğer clientPassword doldurulmuşsa ekle
      if (formData.clientPassword) {
        updateData.clientPassword = formData.clientPassword
      }

      const response = await axios.put(
        `http://localhost:13201/api/connectors/${editingConnector._id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        toast.success('Connector başarıyla güncellendi!')
        loadConnectors()
        resetForm()
        setShowModal(false)        // Layout'taki connector listesini güncelle
        window.dispatchEvent(new Event('connectors-refresh'))        // Layout'taki connector listesini güncelle
        window.dispatchEvent(new Event('connectors-refresh'))
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Connector güncellenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConnector = async () => {
    if (!connectorToDelete) return

    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.delete(
        `http://localhost:13201/api/connectors/${connectorToDelete}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        toast.success('Connector başarıyla silindi!')
        loadConnectors()
        // Layout'taki connector listesini güncelle
        window.dispatchEvent(new Event('connectors-refresh'))
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Connector silinemedi')
    } finally {
      setShowDeleteDialog(false)
      setConnectorToDelete(null)
    }
  }

  const handleEditConnector = (connector: Connector) => {
    setEditingConnector(connector)
    setFormData({
      connectorName: connector.connectorName,
      clientId: connector.clientId,
      clientPassword: connector.clientPassword || '',
      sqlServer: connector.sqlServerConfig.server,
      sqlDatabase: connector.sqlServerConfig.database,
      sqlUser: connector.sqlServerConfig.user,
      sqlPassword: connector.sqlServerConfig.password,
      sqlPort: connector.sqlServerConfig.port
    })
    setEditMode(true)
    setShowModal(true)
  }

  const handleCopyConnector = (connector: Connector) => {
    setConnectorToCopy(connector)
    setCopyName(`${connector.connectorName} - Kopya`)
    setShowCopyDialog(true)
  }

  const handleCopyConfirm = async () => {
    if (!connectorToCopy || !copyName.trim()) {
      toast.error('Connector adı gereklidir')
      return
    }

    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.post(
        'http://localhost:13201/api/connectors',
        {
          connectorName: copyName.trim(),
          clientId: connectorToCopy.clientId,
          clientPassword: connectorToCopy.clientPassword,
          sqlServerConfig: connectorToCopy.sqlServerConfig
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        toast.success('Connector başarıyla kopyalandı!')
        loadConnectors()
        setShowCopyDialog(false)
        setConnectorToCopy(null)
        setCopyName('')
        // Layout'taki connector listesini güncelle
        window.dispatchEvent(new Event('connectors-refresh'))
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Connector kopyalanamadı')
    }
  }

  const resetForm = () => {
    setFormData({
      connectorName: '',
      clientId: '',
      clientPassword: '',
      sqlServer: 'localhost',
      sqlDatabase: '',
      sqlUser: 'sa',
      sqlPassword: '',
      sqlPort: 1433
    })
    setEditMode(false)
    setEditingConnector(null)
    setFormTestResult(null)
    setSqlTestResult(null)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} kopyalandı!`)
  }

  const handleTestConnector = async (connectorId: string) => {
    setTestingConnector(connectorId)
    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.post(
        `http://localhost:13201/api/connectors/${connectorId}/test`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        setTestResults({
          ...testResults,
          [connectorId]: {
            success: true,
            message: response.data.message
          }
        })
        toast.success('Connector bağlantısı başarılı!')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Bağlantı testi başarısız'
      setTestResults({
        ...testResults,
        [connectorId]: {
          success: false,
          message: errorMessage
        }
      })
      toast.error(errorMessage)
    } finally {
      setTestingConnector(null)
    }
  }

  const handleTestFormConnector = async () => {
    if (!formData.clientId || !formData.clientPassword) {
      toast.error('Client ID ve Client Password gereklidir')
      return
    }

    setFormTestLoading(true)
    setFormTestResult(null)

    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.post(
        'http://localhost:13201/api/connector-proxy/test/datetime',
        {
          clientId: formData.clientId,
          clientPass: formData.clientPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        setFormTestResult({
          success: true,
          message: 'Connector bağlantısı başarılı!'
        })
        toast.success('Connector bağlantısı başarılı!')
      }
    } catch (error: any) {
      let errorMessage = 'Connector bağlantısı başarısız'
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.statusText
      }

      setFormTestResult({
        success: false,
        message: errorMessage
      })
      toast.error(errorMessage)
    } finally {
      setFormTestLoading(false)
    }
  }

  const handleTestSqlConnection = async () => {
    if (!formData.clientId || !formData.clientPassword) {
      toast.error('Client ID ve Client Password gereklidir')
      return
    }

    if (!formData.sqlServer || !formData.sqlDatabase || !formData.sqlUser || !formData.sqlPassword) {
      toast.error('Tüm SQL bağlantı bilgileri gereklidir')
      return
    }

    setSqlTestLoading(true)
    setSqlTestResult(null)

    try {
      const sqlQuery = `SELECT COUNT(*) as TableCount FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`
      const token = localStorage.getItem('clientToken')

      const response = await axios.post(
        'http://localhost:13201/api/connector-proxy/test/mssql',
        {
          clientId: formData.clientId,
          clientPass: formData.clientPassword,
          config: {
            user: formData.sqlUser,
            password: formData.sqlPassword,
            database: formData.sqlDatabase,
            server: formData.sqlServer,
            port: formData.sqlPort
          },
          query: sqlQuery
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      // Backend'den gelen response: { success: true, data: { data: { recordsets: [...] } } }
      if (response.data.success && response.data.data?.data?.recordsets && response.data.data.data.recordsets.length > 0) {
        const tableCount = response.data.data.data.recordsets[0][0].TableCount
        setSqlTestResult({
          success: true,
          message: `SQL Server bağlantısı başarılı! Database'de ${tableCount} tablo bulundu.`
        })
        toast.success(`SQL Server bağlantısı başarılı! Database'de ${tableCount} tablo bulundu.`)
      } else {
        setSqlTestResult({
          success: true,
          message: 'SQL Server bağlantısı başarılı!'
        })
        toast.success('SQL Server bağlantısı başarılı!')
      }
    } catch (error: any) {
      let errorMessage = 'SQL Server bağlantısı başarısız'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }

      setSqlTestResult({
        success: false,
        message: errorMessage
      })
      toast.error(errorMessage)
    } finally {
      setSqlTestLoading(false)
    }
  }

  if (loading && connectors.length === 0) {
    return <div className="text-gray-900 dark:text-white">Yükleniyor...</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/settings')}
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connector Yönetimi</h2>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Connector
        </button>
      </div>

      {/* Connector Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {connectors.map((connector) => (
          <div
            key={connector._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {connector.connectorName}
                </h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleTestConnector(connector._id)}
                  disabled={testingConnector === connector._id}
                  className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded disabled:opacity-50"
                  title="Connector Test"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCopyConnector(connector)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                  title="Kopyala"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditConnector(connector)}
                  className="p-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded"
                  title="Düzenle"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setConnectorToDelete(connector._id)
                    setShowDeleteDialog(true)
                  }}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Test Result */}
            {testResults[connector._id] && (
              <div className={`mb-3 p-3 rounded-md text-sm ${testResults[connector._id].success
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                }`}>
                <div className="flex items-start gap-2">
                  <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${testResults[connector._id].success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`} />
                  <span className="font-medium">{testResults[connector._id].message}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Client ID
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={connector.clientId}
                    readOnly
                    className="flex-1 text-sm font-mono bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-2 rounded border border-gray-200 dark:border-gray-600"
                  />
                  <button
                    onClick={() => copyToClipboard(connector.clientId, 'Client ID')}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  SQL Server
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                  {connector.sqlServerConfig.server}:{connector.sqlServerConfig.port}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Database
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                  {connector.sqlServerConfig.database}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {connectors.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Database className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Henüz connector oluşturulmadı</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            İlk Connector'ı Oluştur
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto" onKeyDown={(e) => {
          if (e.key === 'Escape') {
            resetForm()
            setShowModal(false)
          }
        }}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 transition-opacity"
            ></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={editMode ? handleUpdateConnector : handleCreateConnector}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                    {editMode ? 'Connector Düzenle' : 'Yeni Connector Oluştur'}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Connector Adı *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.connectorName}
                        onChange={(e) => setFormData({ ...formData, connectorName: e.target.value })}
                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Örn: Ana Sunucu, Test Ortamı"
                      />
                    </div>

                    {/* Client Bilgileri Card */}
                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Plug className="w-4 h-4" />
                        EnSQL Connector
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Client ID *
                          </label>
                          <input
                            type="text"
                            required
                            autoComplete="off"
                            value={formData.clientId}
                            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                            className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Connector Client ID"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Client Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showClientPassword ? "text" : "password"}
                              required
                              autoComplete="new-password"
                              value={formData.clientPassword}
                              onChange={(e) => setFormData({ ...formData, clientPassword: e.target.value })}
                              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="Client Password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowClientPassword(!showClientPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                            >
                              {showClientPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Connector Bağlantı Testi */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Connector Bağlantı Testi</h5>
                          <button
                            type="button"
                            onClick={handleTestFormConnector}
                            disabled={formTestLoading || !formData.clientId || !formData.clientPassword}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {formTestLoading ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
                          </button>
                        </div>
                        {formTestResult && (
                          <div className={`p-3 rounded-md text-sm ${formTestResult.success
                            ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700'
                            : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
                            }`}>
                            <div className="flex items-start gap-2">
                              <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${formTestResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`} />
                              <span className="font-medium">{formTestResult.message}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SQL Server Bilgileri Card */}
                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        SQL Server Bağlantı Bilgileri
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              SQL Server *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.sqlServer}
                              onChange={(e) => setFormData({ ...formData, sqlServer: e.target.value })}
                              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="localhost"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Port *
                            </label>
                            <input
                              type="number"
                              required
                              value={formData.sqlPort}
                              onChange={(e) => setFormData({ ...formData, sqlPort: parseInt(e.target.value) })}
                              className="block w-24 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="1433"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Database *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.sqlDatabase}
                              onChange={(e) => setFormData({ ...formData, sqlDatabase: e.target.value })}
                              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="Veritabanı adı"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              SQL User *
                            </label>
                            <input
                              type="text"
                              required
                              autoComplete="off"
                              value={formData.sqlUser}
                              onChange={(e) => setFormData({ ...formData, sqlUser: e.target.value })}
                              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              SQL Password *
                            </label>
                            <div className="relative">
                              <input
                                type={showSqlPassword ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                value={formData.sqlPassword}
                                onChange={(e) => setFormData({ ...formData, sqlPassword: e.target.value })}
                                className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => setShowSqlPassword(!showSqlPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                              >
                                {showSqlPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* SQL Server Bağlantı Testi */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-semibold text-gray-900 dark:text-white">SQL Server Bağlantı Testi</h5>
                            <button
                              type="button"
                              onClick={handleTestSqlConnection}
                              disabled={sqlTestLoading || !formData.clientId || !formData.clientPassword || !formData.sqlServer || !formData.sqlDatabase || !formData.sqlUser || !formData.sqlPassword}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {sqlTestLoading ? 'Test Ediliyor...' : 'SQL Bağlantıyı Test Et'}
                            </button>
                          </div>
                          {sqlTestResult && (
                            <div className={`p-3 rounded-md text-sm ${sqlTestResult.success
                              ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700'
                              : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
                              }`}>
                              <div className="flex items-start gap-2">
                                <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${sqlTestResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                  }`} />
                                <span className="font-medium">{sqlTestResult.message}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 dark:bg-blue-500 text-base font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {loading ? 'Kaydediliyor...' : (editMode ? 'Güncelle' : 'Oluştur')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm()
                      setShowModal(false)
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConnector}
        title="Connector Sil"
        description="Bu connector'ı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Sil"
        cancelText="İptal"
      />

      {/* Copy Dialog */}
      {showCopyDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connector Kopyala</h3>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                "{connectorToCopy?.connectorName}" connector'ının kopyası için yeni bir isim girin:
              </p>
              <input
                type="text"
                value={copyName}
                onChange={(e) => setCopyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCopyConfirm()
                  }
                }}
                placeholder="Connector adı"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 bg-gray-50 dark:bg-gray-700">
              <button
                onClick={() => {
                  setShowCopyDialog(false)
                  setConnectorToCopy(null)
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
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
