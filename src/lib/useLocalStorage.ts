import { useEffect, useRef, useState } from 'react'

// Each hook instance gets a unique id so it can ignore the echo of its own
// broadcasts (handling your own event would otherwise corrupt the sync state).
let uidCounter = 0

// Persisted state hook. Survives reloads; safe against JSON / quota errors.
// Also keeps every instance of the same key in sync live — across browser tabs
// (the native `storage` event) and across components in the same tab (a custom
// event) — so editing a day from the header calendar updates the settings
// calendar immediately.
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  const idRef = useRef(0)
  if (idRef.current === 0) idRef.current = ++uidCounter
  // Set when the latest change arrived from another instance — skip the
  // write/broadcast effect once so we don't re-emit a change we just received.
  const fromRemote = useRef(false)

  useEffect(() => {
    if (fromRemote.current) {
      fromRemote.current = false
      return
    }
    try {
      localStorage.setItem(key, JSON.stringify(value))
      window.dispatchEvent(new CustomEvent(`ls:${key}`, { detail: { id: idRef.current, value } }))
    } catch {
      /* ignore quota / serialization errors */
    }
  }, [key, value])

  useEffect(() => {
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: number; value: T }
      if (detail.id === idRef.current) return // ignore our own echo
      fromRemote.current = true
      setValue(detail.value)
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key || e.newValue == null) return
      try {
        fromRemote.current = true
        setValue(JSON.parse(e.newValue) as T)
      } catch {
        /* ignore */
      }
    }
    window.addEventListener(`ls:${key}`, onCustom)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(`ls:${key}`, onCustom)
      window.removeEventListener('storage', onStorage)
    }
  }, [key])

  return [value, setValue] as const
}
