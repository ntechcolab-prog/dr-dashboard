import { useEffect, useRef, useState } from 'react'

// Measure a container's width so SVG charts render at real pixels (no
// preserveAspectRatio distortion of strokes and circles).
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width)
    })
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  return [ref, width] as const
}
