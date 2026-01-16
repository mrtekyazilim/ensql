import { useState, useEffect } from 'react'
import axios from 'axios'

export function Settings() {
  const [connectorConfig, setConnectorConfig] = useState({
    clientId: '',
    clientPassword: ''
  })
  const [sqlConfig, setSqlConfig] = useState({
    server: '',
    database: '',
    user: '',
    password: '',
    port: 1433
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('clientToken')
      const response = await axios.get('http://localhost:13201/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success && response.data.user) {
        const user = response.data.user
        if (user.clientId) {
          setConnectorConfig({
            clientId: user.clientId,
            clientPassword: '******' // Şifreyi gösterme
          })
        }
        if (user.sqlServerConfig) {
          setSqlConfig({
            ...user.sqlServerConfig,
            password: user.sqlServerConfig.password ? '******' : ''
          })
        }
      }
    } catch (error) {
      console.error('Settings loading error:', error)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('clientToken')
      const userData = localStorage.getItem('clientUser')
      const user = userData ? JSON.parse(userData) : null

      if (!user?.id) {
        setMessage('Kullanıcı bilgisi bulunamadı')
        return
      }

      // SQL Server ayarlarını güncelle
      const updateData: any = {}

      // Sadece değişen şifreleri gönder
      if (connectorConfig.clientPassword && connectorConfig.clientPassword !== '******') {
        updateData.clientPassword = connectorConfig.clientPassword
      }

      // SQL config güncellemesi
      const sqlConfigToSave = { ...sqlConfig }
      if (sqlConfigToSave.password === '******') {
        delete sqlConfigToSave.password // Değişmemişse gönderme
      }
      updateData.sqlServerConfig = sqlConfigToSave

      const response = await axios.put(
        `http://localhost:13201/api/users/${user.id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        setMessage('Ayarlar başarıyla kaydedildi')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Ayarlar kaydedilemedi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Ayarlar</h2>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {message && (
          <div className={`rounded-md p-4 ${message.includes('başarı')
              ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}>
            <div className="text-sm">{message}</div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Connector Bilgileri
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client ID</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm"
                  value={connectorConfig.clientId}
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Client ID değiştirilemez</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client Password</label>
                <input
                  type="password"
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={connectorConfig.clientPassword}
                  onChange={(e) => setConnectorConfig({ ...connectorConfig, clientPassword: e.target.value })}
                  placeholder="Değiştirmek için yeni şifre girin"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              SQL Server Bağlantı Bilgileri
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Server</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={sqlConfig.server}
                  onChange={(e) => setSqlConfig({ ...sqlConfig, server: e.target.value })}
                  placeholder="localhost veya IP adresi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Database</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={sqlConfig.database}
                  onChange={(e) => setSqlConfig({ ...sqlConfig, database: e.target.value })}
                  placeholder="Veritabanı adı"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={sqlConfig.user}
                    onChange={(e) => setSqlConfig({ ...sqlConfig, user: e.target.value })}
                    placeholder="SQL kullanıcı adı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <input
                    type="password"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={sqlConfig.password}
                    onChange={(e) => setSqlConfig({ ...sqlConfig, password: e.target.value })}
                    placeholder="SQL şifresi"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Port</label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={sqlConfig.port}
                  onChange={(e) => setSqlConfig({ ...sqlConfig, port: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}
