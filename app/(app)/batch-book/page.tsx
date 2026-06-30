'use client'

import dynamic from 'next/dynamic'

// The dashboard is a fully client-side app (localStorage-era hooks, charts,
// window-sized layout). Render it client-only to avoid SSR of browser APIs.
const App = dynamic(() => import('@/src/App'), { ssr: false })

export default function BatchBookPage() {
  return <App />
}
