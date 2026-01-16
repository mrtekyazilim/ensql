import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { Sessions } from './pages/Sessions'
import { Layout } from './components/Layout'
import { ThemeProvider } from './components/ThemeProvider'
import { Toaster } from 'sonner'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="ensql-client-theme">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="sessions" element={<Sessions />} />
          </Route>
        </Routes>
      </Router>
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  )
}

export default App
