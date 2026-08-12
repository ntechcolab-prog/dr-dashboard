'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import AppsIcon from '@mui/icons-material/Apps'
import MenuIcon from '@mui/icons-material/Menu'
import { IrisLogo } from '@/src/client/iris/IrisLogo'
import { BatchBookMark } from '@/src/components/BatchBookMark'
import { useSession, initialsOf } from '@/src/client/Session'
import { iris } from '@/src/client/mui/theme'
import { isLiveMode } from '@/src/data/mockData'
import { logout as irisLogout } from '@/src/api/auth'

// MUI counterpart of IrisTopBar — same IRIS Cloud chrome, dark #41414a bar.
export default function TopBarV2() {
  const user = useSession()
  const router = useRouter()
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)

  // In the live (IRIS) app, home is the app itself and auth is IRIS — never the
  // legacy launcher / cookie login.
  const live = isLiveMode()
  const home = live ? '/iris-app' : '/'

  async function logout() {
    if (live) {
      await irisLogout().catch(() => {})
      router.replace('/')
      return
    }
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const row = { display: 'flex', alignItems: 'center' } as const

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: iris.irisTopbar }}>
      <Toolbar sx={{ minHeight: 64, px: 3, justifyContent: 'space-between' }}>
        <Box sx={{ ...row, gap: 2.5 }}>
          <IconButton href={home} LinkComponent={Link} aria-label="Applications" sx={{ color: '#fff' }}>
            <AppsIcon />
          </IconButton>
          <Box component={Link} href={home} aria-label="Home" sx={{ ...row, textDecoration: 'none', color: '#fff' }}>
            {live ? (
              <Box sx={{ ...row, gap: 1.25 }}>
                <BatchBookMark size={30} />
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                  Batch&nbsp;Book
                </Typography>
              </Box>
            ) : (
              <IrisLogo size="sm" />
            )}
          </Box>
        </Box>

        <Box sx={{ ...row, gap: 2.5 }}>
          <Box component={Link} href={home} sx={{ ...row, gap: 1.25, color: '#fff', textDecoration: 'none' }}>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 500 }}>Hello,</Typography>
            <Avatar sx={{ width: 36, height: 36, bgcolor: iris.irisBlue, fontSize: '0.8rem', fontWeight: 600 }}>
              {initialsOf(user.name)}
            </Avatar>
          </Box>

          <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Menu" sx={{ color: '#fff' }}>
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { width: 208, mt: 1 } } }}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{user.name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {user.company.name}
              </Typography>
            </Box>
            <Divider />
            {!live && (
              <MenuItem href="/batch-book" LinkComponent={Link} onClick={() => setAnchor(null)}>
                Production Monitoring
              </MenuItem>
            )}
            {user.isAdmin && (
              <MenuItem href="/admin" LinkComponent={Link} onClick={() => setAnchor(null)}>
                Admin · Users
              </MenuItem>
            )}
            <MenuItem onClick={logout} sx={{ color: 'error.main' }}>Log out</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
