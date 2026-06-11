import { useEffect, useRef, useState } from 'react'

// Persisted state hook. Survives reloads; safe against JSON / quota errors.
// Also keeps every instance of the same key in sync live — both across browser
// tabs (the native `storage` event) and across components in the same tab (a
// custom event), so e.g. editing a day from the header calendar updates the
// settings calendar immediately.
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  // True when the latest change arrived from another instance — skip the
  // write/broadcast effect once so we don't echo it back into a loop.
  const fromRemote = useRef(false)

  useEffect(() => {
    if (fromRemote.current) {
      fromRemote.current = false
      return
    }
    try {
      localStorage.setItem(key, JSON.stringify(value))
      window.dispatchEvent(new CustomEvent(`ls:${key}`, { detail: value }))
    } catch {
      /* ignore quota / serialization errors */
    }
  }, [key, value])

  useEffect(() => {
    const onCustom = (e: Event) => {
      fromRemote.current = true
      setValue((e as CustomEvent).detail as T)
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
