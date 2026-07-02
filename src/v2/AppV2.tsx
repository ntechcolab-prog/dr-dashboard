'use client'

import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import TopBarV2 from './TopBarV2'
import SidebarV2 from './SidebarV2'
import DashboardV2 from './screens/DashboardV2'
import PlaceholderScreen from './screens/PlaceholderScreen'

const SCREENS = ['dashboard', 'registry', 'analysis', 'settings']

// MUI counterpart of src/App.tsx. Same version model: ?v=0 = restricted
// (Registry only), otherwise the full app. v0/v1 keep using the Tailwind App;
// this one is reached via ?v=2 from the launcher.
export default function AppV2() {
  const restricted = useMemo(() => {
    if (typeof window === 'undefined') return false
    return new URLSearchParams(window.location.search).get('v') === '0'
  }, [])

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeNav, setActiveNav] = useState(() => {
    if (restricted) return 'registry'
    if (typeof window !== 'undefined') {
      const view = new URLSearchParams(window.location.search).get('view')
      if (view && SCREENS.includes(view)) return view
    }
    return 'dashboard'
  })

  const gated = restricted && activeNav !== 'registry'
  const screen = gated ? 'coming soon' : activeNav

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBarV2 />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <SidebarV2
          open={sidebarOpen}
          active={activeNav}
          onSelect={setActiveNav}
          onToggle={() => setSidebarOpen((v) => !v)}
          restricted={restricted}
        />
        <Box component="main" sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.default' }}>
          {screen === 'dashboard' ? <DashboardV2 /> : <PlaceholderScreen name={screen} />}
        </Box>
      </Box>
    </Box>
  )
}
