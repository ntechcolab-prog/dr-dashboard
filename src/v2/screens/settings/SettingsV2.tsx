'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Typography from '@mui/material/Typography'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { SETTINGS_TABS } from '@/src/data/appData'
import { GeneralSettingsV2, DataExportSettingsV2 } from './MiscSettingsV2'
import AvailabilitySettingsV2 from './AvailabilitySettingsV2'

// MUI-native Settings screen. Mirrors the Tailwind SettingsScreen (tabbed:
// General / Availability / Data Export) and reuses every bit of business logic —
// the availability hooks/services and the same localStorage keys — so v0/v1 and
// v2 read and write the same settings.
export default function SettingsV2() {
  const [tab, setTab] = useState('General')

  return (
    <Box sx={{ maxWidth: '80rem', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2, p: 2.5 }}>
      {/* Sub-header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsOutlinedIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Settings</Typography>
      </Box>

      {/* Tabs */}
      <Card sx={{ px: 1, py: 0.5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          {SETTINGS_TABS.map((t) => (
            <Tab key={t} value={t} label={t} />
          ))}
        </Tabs>
      </Card>

      {tab === 'General' ? (
        <GeneralSettingsV2 />
      ) : tab === 'Availability' ? (
        <AvailabilitySettingsV2 />
      ) : tab === 'Data Export' ? (
        <DataExportSettingsV2 />
      ) : (
        <Card sx={{ display: 'grid', placeItems: 'center', p: 10, textAlign: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>{tab}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
              This settings section isn&apos;t built out yet.
            </Typography>
          </Box>
        </Card>
      )}
    </Box>
  )
}
