'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { addBasePath } from 'next/dist/client/add-base-path'
import { parseRoute, routePath, type AppRoute } from './routes'

export interface AppLocation {
  route: AppRoute
  /** Go to a route. `replace` swaps the current history entry (tabs do this). */
  navigate: (route: AppRoute, opts?: { replace?: boolean }) => void
}

/**
 * Where the app is, and how it moves — see routes.ts for the URL tree.
 *
 * With a `root` ('/batch-book-v2' in the real app, '' in the MIRA build) the
 * location IS the URL: the route is read from the pathname below the root, and
 * navigation is `history.pushState`/`replaceState`. Next.js hooks those two and
 * updates `usePathname()`, so the shell re-renders without any server round
 * trip — the whole tree is one client page, nothing has to be fetched. That is
 * also why it is not `router.push`: in the static export the router would ask
 * for the RSC payload of the new URL, and a batch created during the session
 * has no file there (it would hard-navigate into a 404). Back/forward work
 * the same way, through Next's popstate handling.
 *
 * Without a root (the live /iris-app, a single URL) the location lives in
 * React state and behaves exactly as the old `activeNav` did.
 *
 * `?v=` (the version model, shared/versionGate.ts) travels along on every
 * navigation so a `?v=0` session stays restricted after a reload.
 */
export function useAppLocation(root: string | undefined, initial: () => AppRoute): AppLocation {
  const pathname = usePathname()
  const [statePath, setStatePath] = useState(() => routePath(initial()))
  const urlMode = root !== undefined

  const path = urlMode ? pathBelowRoot(pathname, root) : statePath
  const route = useMemo(() => parseRoute(path), [path])

  const navigate = useCallback(
    (next: AppRoute, opts?: { replace?: boolean }) => {
      const to = routePath(next)
      if (!urlMode) {
        setStatePath(to)
        return
      }
      if (to === pathBelowRoot(window.location.pathname, root, true)) return
      // addBasePath also settles the trailing slash the way next.config asks.
      const url = addBasePath(`${root}${to}${keepVersion(window.location.search)}`)
      if (opts?.replace) window.history.replaceState(null, '', url)
      else window.history.pushState(null, '', url)
    },
    [urlMode, root],
  )

  return { route, navigate }
}

// '/batch-book-v2/registry/X/' below '/batch-book-v2' → '/registry/X'.
// `withBasePath`: window.location carries Next's basePath, usePathname() does not.
function pathBelowRoot(pathname: string, root: string, withBasePath = false): string {
  let p = pathname
  if (withBasePath) {
    const base = addBasePath('/').replace(/\/$/, '')
    if (base && p.startsWith(base)) p = p.slice(base.length)
  }
  if (root && p.startsWith(root)) p = p.slice(root.length)
  const trimmed = p.replace(/\/+$/, '')
  return trimmed || '/'
}

function keepVersion(search: string): string {
  const v = new URLSearchParams(search).get('v')
  return v ? `?v=${encodeURIComponent(v)}` : ''
}
