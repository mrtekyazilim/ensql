import { useState, useEffect } from 'react'
import axios from 'axios'

interface User {
  _id: string
  username: string
  clientId: string
  hizmetBitisTarihi: string
  aktif: boolean
  kullanimIstatistikleri?: {
    toplamSorguSayisi: number
    sonGirisTarihi?: string
  }
}

export function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    clientId: '',
    clientPassword: '',
    hizmetBitisTarihi: ''
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:13201/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setUsers(response.data.users)
      }
    } catch (error) {
      console.error('Users loading error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('http://localhost:13201/api/users', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setShowModal(false)
        setFormData({
          username: '',
          password: '',
          clientId: '',
          clientPassword: '',
          hizmetBitisTarihi: ''
        })
        loadUsers()
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Kullanıcı oluşturulamadı')
    }
  }

  const handleConnectToClient = (clientId: string) => {
    // Client uygulamasına admin olarak bağlan
    window.open(`http://localhost:13203?admin=${clientId}`, '_blank')
  }

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Kullanıcılar</h2>
        <button
          onClick={() => setShowModal(true)}
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Yeni Kullanıcı
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user._id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {user.username}
                    </p>
                    <p className="text-sm text-gray-500">
                      Client ID: {user.clientId}
                    </p>
                    <p className="text-sm text-gray-500">
                      Hizmet Bitiş: {new Date(user.hizmetBitisTarihi).toLocaleDateString('tr-TR')}
                    </p>
                    <p className="text-sm text-gray-500">
                      Sorgu Sayısı: {user.kullanimIstatistikleri?.toplamSorguSayisi || 0}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {user.aktif ? 'Aktif' : 'Pasif'}
                    </span>
                    <button
                      onClick={() => handleConnectToClient(user.clientId)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Bağlan
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateUser}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Yeni Kullanıcı Oluştur
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Kullanıcı Adı</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Şifre</label>
                      <input
                        type="password"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client ID</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.clientId}
                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client Password</label>
                      <input
                        type="password"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.clientPassword}
                        onChange={(e) => setFormData({ ...formData, clientPassword: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hizmet Bitiş Tarihi</label>
                      <input
                        type="date"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.hizmetBitisTarihi}
                        onChange={(e) => setFormData({ ...formData, hizmetBitisTarihi: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Oluştur
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
