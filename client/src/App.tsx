import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { Layout } from './components/Layout'
import { ThemeProvider } from './components/ThemeProvider'

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
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
