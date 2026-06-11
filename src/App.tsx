import { useState } from 'react'
import AppHeader from './components/AppHeader'
import Sidebar from './components/Sidebar'
import DashboardScreen from './screens/DashboardScreen'
import DashboardV2Screen from './screens/DashboardV2Screen'
import RegistryScreen from './screens/RegistryScreen'
import AnalysisScreen from './screens/AnalysisScreen'
import SettingsScreen from './screens/SettingsScreen'
import { useLocalStorage } from './lib/useLocalStorage'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeNav, setActiveNav] = useState('dashboard')

  // Branding (name + icon) — persisted; editable UI was removed with NameIdeas.
  const [appName] = useLocalStorage<string>('dr-name-current', 'Batch Book')
  const [appIcon] = useLocalStorage<string | null>('dr-app-icon', null)

  return (
    <div className="flex h-screen flex-col">
      <AppHeader name={appName} icon={appIcon} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} active={activeNav} onSelect={setActiveNav} onToggle={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 overflow-auto">
          {activeNav === 'dashboard' && <DashboardScreen onNavigate={setActiveNav} />}
          {activeNav === 'dashboard-v2' && <DashboardV2Screen />}
          {activeNav === 'registry' && <RegistryScreen />}
          {activeNav === 'analysis' && <AnalysisScreen />}
          {activeNav === 'settings' && <SettingsScreen />}
        </main>
      </div>
    </div>
  )
}
