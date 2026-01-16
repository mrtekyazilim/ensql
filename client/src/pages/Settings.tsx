import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, Copy, Database, Eye, EyeOff } from 'lucide-react'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface Connector {
  _id: string
  connectorName: string
  clientId: string
  sqlServerConfig: {
    server: string
    database: string
    user: string
    password: string
    port: number
  }
  aktif: boolean
}

export function Settings() {
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingConnector, setEditingConnector] = useState<Connector | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [connectorToDelete, setConnectorToDelete] = useState<string | null>(null)
  const [showClientPassword, setShowClientPassword] = useState(false)
  const [showSqlPassword, setShowSqlPassword] = useState(false)

  const [formData, setFormData] = useState({
    connectorName: '',
    clientId: '',
    clientPassword: '',
    sqlServer: '',
    sqlDatabase: '',
    sqlUser: '',
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
          connectorName: formData.connectorName, clientId: formData.clientId,
          clientPassword: formData.clientPassword, sqlServerConfig: {
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
        setShowModal(false)
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
      clientPassword: '',
      sqlServer: connector.sqlServerConfig.server,
      sqlDatabase: connector.sqlServerConfig.database,
      sqlUser: connector.sqlServerConfig.user,
      sqlPassword: connector.sqlServerConfig.password,
      sqlPort: connector.sqlServerConfig.port
    })
    setEditMode(true)
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      connectorName: '',
      clientId: '',
      clientPassword: '',
      sqlServer: '',
      sqlDatabase: '',
      sqlUser: '',
      sqlPassword: '',
      sqlPort: 1433
    })
    setEditMode(false)
    setEditingConnector(null)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} kopyalandı!`)
  }

  if (loading && connectors.length === 0) {
    return <div className="text-gray-900 dark:text-white">Yükleniyor...</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
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
                  onClick={() => handleEditConnector(connector)}
                  className="p-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setConnectorToDelete(connector._id)
                    setShowDeleteDialog(true)
                  }}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

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
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 transition-opacity"
              onClick={() => setShowModal(false)}
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
                          Client Password {!editMode && '*'}
                          {editMode && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(Değiştirmek için doldurun)</span>}
                        </label>
                        <div className="relative">
                          <input
                            type={showClientPassword ? "text" : "password"}
                            required={!editMode}
                            autoComplete="new-password"
                            value={formData.clientPassword}
                            onChange={(e) => setFormData({ ...formData, clientPassword: e.target.value })}
                            className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder={editMode ? "Boş bırakılabilir (mevcut korunu)" : "Client Password"}
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

                    <div className="grid grid-cols-2 gap-4">
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
                          className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
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
                    onClick={() => setShowModal(false)}
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
    </div>
  )
}
