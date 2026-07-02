'use client'

import type { ReactNode } from 'react'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'

// Wraps the MUI v2 app. AppRouterCacheProvider keeps Emotion's style injection
// SSR-safe on the Next 15 App Router (no flash / hydration mismatch). Scoped to
// the v2 route only, so v0/v1 (Tailwind) are untouched.
export function MuiProvider({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}
