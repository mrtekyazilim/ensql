import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthorization()
  }, [])

  const checkAuthorization = async () => {
    try {
      const token = localStorage.getItem('adminToken')

      if (!token) {
        setIsAuthorized(false)
        setLoading(false)
        return
      }

      const response = await axios.get('http://localhost:13201/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        const user = response.data.user

        if (requireAdmin && user.role !== 'admin') {
          setIsAuthorized(false)
        } else {
          setIsAuthorized(true)
        }
      } else {
        setIsAuthorized(false)
      }
    } catch (error) {
      setIsAuthorized(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>
  }

  if (isAuthorized === false) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
