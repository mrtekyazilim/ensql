import { useState, useEffect } from 'react'
import axios from 'axios'
import { Monitor, Smartphone, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface Session {
  _id: string
  deviceId: string
  deviceName: string
  browserInfo: string
  ipAddress: string
  createdAt: string
  lastActivity: string
  aktif: boolean
}

export function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const currentDeviceId = localStorage.getItem('deviceId')

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:13201/api/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setSessions(response.data.sessions)
      }
    } catch (error) {
      console.error('Sessions loading error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSession = async (sessionId: string) => {
    setSessionToDelete(sessionId)
    setShowConfirmDialog(true)
  }

  const confirmCloseSession = async () => {
    if (!sessionToDelete) return

    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(`http://localhost:13201/api/sessions/${sessionToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        toast.success('Oturum başarıyla kapatıldı')
        loadSessions()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Oturum kapatılamadı')
    } finally {
      setShowConfirmDialog(false)
      setSessionToDelete(null)
    }
  }

  if (loading) {
    return <div className="text-gray-900 dark:text-white">Yükleniyor...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Aktif Oturumlar</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Hesabınızın aktif oturumlarını görüntüleyin ve yönetin
        </p>
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => {
          const isCurrentDevice = session.deviceId === currentDeviceId

          return (
            <div
              key={session._id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 ${isCurrentDevice
                ? 'border-green-500 dark:border-green-600'
                : 'border-gray-200 dark:border-gray-700'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {session.browserInfo?.includes('Mobile') || session.browserInfo?.includes('Android') || session.browserInfo?.includes('iPhone') ? (
                      <Smartphone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Monitor className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {session.deviceName || 'Bilinmeyen Cihaz'}
                      </h3>
                      {isCurrentDevice && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                          Mevcut Cihaz
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {session.browserInfo}
                    </p>

                    <div className="mt-3 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                      <p>
                        <span className="font-medium">IP Adresi:</span> {session.ipAddress}
                      </p>
                      <p>
                        <span className="font-medium">İlk Giriş:</span>{' '}
                        {new Date(session.createdAt).toLocaleString('tr-TR')}
                      </p>
                      <p>
                        <span className="font-medium">Son Aktivite:</span>{' '}
                        {new Date(session.lastActivity).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>

                {!isCurrentDevice && (
                  <button
                    onClick={() => handleCloseSession(session._id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Kapat</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {sessions.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Monitor className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Aktif oturum bulunamadı</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={confirmCloseSession}
        title="Oturumu Kapat"
        description="Bu oturumu kapatmak istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Kapat"
        cancelText="İptal"
      />
    </div>
  )
}
