'use client'

import { useMemo, useState } from 'react'
import AppHeader from './components/AppHeader'
import Sidebar from './components/Sidebar'
import ComingSoon from './components/ComingSoon'
import DashboardScreen from './screens/DashboardScreen'
import DashboardV2Screen from './screens/DashboardV2Screen'
import RegistryScreen from './screens/RegistryScreen'
import AnalysisScreen from './screens/AnalysisScreen'
import SettingsScreen from './screens/SettingsScreen'
import { useLocalStorage } from './lib/useLocalStorage'

const SCREENS = ['dashboard', 'dashboard-v2', 'registry', 'analysis', 'settings']

export default function App() {
  // Version comes from the launcher: ?v=0 = restricted (Registry only, the rest
  // "coming soon"); ?v=1 (default) = full app.
  const version = useMemo(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('v') === '0') return '0'
    return '1'
  }, [])
  const restricted = version === '0'

  const [sidebarOpen, setSidebarOpen] = useState(true)
  // Initial screen: v0 always lands on Registry; v1 can be set via ?view=.
  const [activeNav, setActiveNav] = useState(() => {
    if (restricted) return 'registry'
    if (typeof window !== 'undefined') {
      const v = new URLSearchParams(window.location.search).get('view')
      if (v && SCREENS.includes(v)) return v
    }
    return 'dashboard'
  })

  // Branding (name + icon) — persisted; editable UI was removed with NameIdeas.
  const [appName] = useLocalStorage<string>('dr-name-current', 'Batch Book')
  const [appIcon] = useLocalStorage<string | null>('dr-app-icon', null)

  const gated = restricted && activeNav !== 'registry'

  return (
    <div className="flex h-screen flex-col">
      <AppHeader name={appName} icon={appIcon} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          active={activeNav}
          onSelect={setActiveNav}
          onToggle={() => setSidebarOpen((v) => !v)}
          restricted={restricted}
        />

        <main className="flex-1 overflow-auto">
          {gated ? (
            <div className="p-6">
              <ComingSoon />
            </div>
          ) : (
            <>
              {activeNav === 'dashboard' && <DashboardScreen onNavigate={setActiveNav} />}
              {activeNav === 'dashboard-v2' && <DashboardV2Screen />}
              {activeNav === 'registry' && <RegistryScreen />}
              {activeNav === 'analysis' && <AnalysisScreen />}
              {activeNav === 'settings' && <SettingsScreen />}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
