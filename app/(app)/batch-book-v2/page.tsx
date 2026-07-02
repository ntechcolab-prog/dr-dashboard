'use client'

import dynamic from 'next/dynamic'
import { MuiProvider } from '@/src/client/mui/MuiProvider'

// Like /batch-book, the app is fully client-side (localStorage hooks, charts,
// window-sized layout), so render it client-only. Wrapped in MuiProvider so the
// Emotion/theme layer is scoped to this route — v0/v1 stay on Tailwind.
const AppV2 = dynamic(() => import('@/src/v2/AppV2'), { ssr: false })

export default function BatchBookV2Page() {
  return (
    <MuiProvider>
      <AppV2 />
    </MuiProvider>
  )
}
