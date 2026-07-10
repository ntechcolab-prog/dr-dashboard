'use client'

// Renders the EXACT v2 app (TopBar + Sidebar + all screens) with REAL backend
// data injected before mount. Secondary path — /batch-book-v2 (mock) untouched.

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { isAuthenticated } from '@/src/api/tokenStore'
import { activeOrganizationId, currentClaims } from '@/src/api/auth'
import { SessionProvider, type SessionUser } from '@/src/client/Session'
import AppV2 from '@/src/v2/AppV2'
import { loadLiveApp } from './loadLiveApp'

export default function LiveApp() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const user = useMemo<SessionUser>(() => {
    const c = currentClaims()
    const name = `${c?.first_name ?? ''} ${c?.last_name ?? ''}`.trim()
    return {
      id: c?.id ?? '',
      name: name || c?.['e-mail'] || 'User',
      email: c?.['e-mail'] ?? '',
      isAdmin: false,
      company: { id: activeOrganizationId() ?? '', name: 'Notify / IRIS' },
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/iris-login')
      return
    }
    loadLiveApp()
      .then(() => setReady(true))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [router])

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">Failed to load live data: {error}</Typography>
      </Box>
    )
  }
  if (!ready) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }
  return (
    <SessionProvider user={user}>
      <AppV2 />
    </SessionProvider>
  )
}
