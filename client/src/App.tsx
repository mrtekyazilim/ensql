import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Reports } from './pages/Reports'
import { ReportExecute } from './pages/ReportExecute'
import { ReportDesigns } from './pages/ReportDesigns'
import { ReportForm } from './pages/ReportForm'
import { Settings } from './pages/Settings'
import { Sessions } from './pages/Sessions'
import { Profile } from './pages/Profile'
import { Connectors } from './pages/Connectors'
import { AutoLogin } from './pages/AutoLogin'
import ChatReports from './pages/ChatReports'
import { Layout } from './components/Layout'
import { ThemeProvider } from './components/ThemeProvider'
import { Toaster } from 'sonner'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="ensql-client-theme">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auto-login" element={<AutoLogin />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/:id" element={<ReportExecute />} />
            <Route path="chat-reports" element={<ChatReports />} />
            <Route path="report-designs" element={<ReportDesigns />} />
            <Route path="report-designs/new" element={<ReportForm />} />
            <Route path="report-designs/:id" element={<ReportForm />} />
            <Route path="connectors" element={<Connectors />} />
            <Route path="settings" element={<Settings />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
      <Toaster position="bottom-right" richColors />
    </ThemeProvider>
  )
}

export default App
