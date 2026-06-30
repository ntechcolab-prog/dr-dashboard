'use client'

import { createContext, useCallback, useContext, useRef, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

// Per-company shared state, drop-in replacement for the old useLocalStorage.
// Same call signature: const [value, setValue] = useCompanyState(key, initial).
// Reads come synchronously from a store hydrated once on entry into the app;
// writes update the store (re-rendering consumers of that key) and persist to
// Neon via PUT /api/state/[key], scoped to the logged-in user's company.

type Listener = () => void

class CompanyStore {
  private map: Map<string, unknown>
  private listeners = new Map<string, Set<Listener>>()

  constructor(initial: Record<string, unknown>) {
    this.map = new Map(Object.entries(initial))
  }

  has(key: string) {
    return this.map.has(key)
  }

  get(key: string) {
    return this.map.get(key)
  }

  // Cache a default ref the first time a key is read absent, so getSnapshot
  // returns a stable reference (required by useSyncExternalStore). Does not
  // persist — defaults stay local until the user actually changes something.
  seedDefault(key: string, value: unknown) {
    if (!this.map.has(key)) this.map.set(key, value)
    return this.map.get(key)
  }

  set(key: string, value: unknown) {
    this.map.set(key, value)
    this.emit(key)
    void this.persist(key, value)
  }

  subscribe(key: string, cb: Listener) {
    let set = this.listeners.get(key)
    if (!set) {
      set = new Set()
      this.listeners.set(key, set)
    }
    set.add(cb)
    return () => {
      set.delete(cb)
    }
  }

  private emit(key: string) {
    this.listeners.get(key)?.forEach((cb) => cb())
  }

  private async persist(key: string, value: unknown) {
    try {
      await fetch(`/api/state/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value }),
      })
    } catch {
      /* offline / transient — local state already updated */
    }
  }
}

const StoreContext = createContext<CompanyStore | null>(null)

function useConstant<T>(factory: () => T): T {
  const ref = useRef<T | null>(null)
  if (ref.current === null) ref.current = factory()
  return ref.current
}

export function CompanyStateProvider({
  initial,
  children,
}: {
  initial: Record<string, unknown>
  children: ReactNode
}) {
  // One store per provider mount; initial map comes hydrated from the server.
  const store = useConstant(() => new CompanyStore(initial))
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useCompanyState<T>(key: string, initial: T) {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useCompanyState must be used inside <CompanyStateProvider>')

  const getSnapshot = () =>
    store.has(key) ? (store.get(key) as T) : (store.seedDefault(key, initial) as T)

  const value = useSyncExternalStore((cb) => store.subscribe(key, cb), getSnapshot, getSnapshot)

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = store.has(key) ? (store.get(key) as T) : initial
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      store.set(key, resolved)
    },
    // initial intentionally omitted: defaults are stable module constants and
    // the closure only needs the latest for the absent-key path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, key],
  )

  return [value, setValue] as const
}
