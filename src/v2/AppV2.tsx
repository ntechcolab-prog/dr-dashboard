'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import TopBarV2 from './TopBarV2'
import SidebarV2 from './SidebarV2'
import DashboardV2 from './screens/DashboardV2'
import RegistryV2 from './screens/registry/RegistryV2'
import AnalysisV2 from './screens/analysis/AnalysisV2'
import SettingsV2 from './screens/settings/SettingsV2'
import PlaceholderScreen from './screens/PlaceholderScreen'
import { isRestricted, isScreenGated, initialScreen } from '@/src/shared/versionGate'

const SCREENS = ['dashboard', 'registry', 'analysis', 'settings']

// MUI counterpart of src/v1/App.tsx. Same version model: ?v=0 = restricted
// (Registry only), otherwise the full app. v1 (Tailwind) serves /batch-book;
// this one is /batch-book-v2, reached with ?v=2 from the launcher.
// The v0 rules come from src/shared/versionGate.ts — both versions obey the
// same list.
export default function AppV2() {
  const [restricted] = useState(() => isRestricted('2'))

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeNav, setActiveNav] = useState(() => initialScreen(restricted, 'dashboard', SCREENS))

  const gated = isScreenGated(activeNav, restricted)
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
          {gated ? (
            <PlaceholderScreen name="coming soon" />
          ) : activeNav === 'dashboard' ? (
            <DashboardV2 />
          ) : activeNav === 'registry' ? (
            <RegistryV2 restricted={restricted} />
          ) : activeNav === 'analysis' ? (
            <AnalysisV2 />
          ) : activeNav === 'settings' ? (
            <SettingsV2 />
          ) : (
            <PlaceholderScreen name={screen} />
          )}
        </Box>
      </Box>
    </Box>
  )
}
