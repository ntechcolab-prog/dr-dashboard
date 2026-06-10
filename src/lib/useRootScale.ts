import { useEffect, useState } from 'react'

// Current root font-size as a multiplier over the 16px design baseline.
// The root font-size is fluid (clamp() in index.css), so this returns ~1 on a
// laptop and ~1.8 on a 4K/50" display. Pixel-space SVG charts multiply their
// geometry by this so they zoom together with the rem-based layout.
export function useRootScale() {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const read = () => {
      const px = parseFloat(getComputedStyle(document.documentElement).fontSize)
      setScale(px > 0 ? px / 16 : 1)
    }
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])

  return scale
}
