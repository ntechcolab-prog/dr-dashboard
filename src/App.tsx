import { useState } from 'react'
import AppHeader from './components/AppHeader'
import Sidebar from './components/Sidebar'
import DashboardScreen from './screens/DashboardScreen'
import RegistryScreen from './screens/RegistryScreen'
import AnalysisScreen from './screens/AnalysisScreen'
import SettingsScreen from './screens/SettingsScreen'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeNav, setActiveNav] = useState('dashboard')

  return (
    <div className="flex h-screen flex-col">
      <AppHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} onNavigate={setActiveNav} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} active={activeNav} onSelect={setActiveNav} />

        <main className="flex-1 overflow-auto">
          {activeNav === 'dashboard' && <DashboardScreen />}
          {activeNav === 'registry' && <RegistryScreen />}
          {activeNav === 'analysis' && <AnalysisScreen />}
          {activeNav === 'settings' && <SettingsScreen />}
        </main>
      </div>
    </div>
  )
}
