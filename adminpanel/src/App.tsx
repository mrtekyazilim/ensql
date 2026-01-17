import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Users } from './pages/Users'
import { Reports } from './pages/Reports'
import { Sessions } from './pages/Sessions'
import { Profile } from './pages/Profile'
import { AdminUsers } from './pages/AdminUsers'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ThemeProvider } from './components/ThemeProvider'
import { Toaster } from 'sonner'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="ensql-admin-theme">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="profile" element={<Profile />} />
            <Route
              path="admin-users"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
      <Toaster position="bottom-right" richColors />
    </ThemeProvider>
  )
}

export default App
