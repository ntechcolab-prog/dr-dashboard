// Lightweight input masks — digits in, formatted string out.

// DD/MM/YYYY
export function maskDate(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

// HH:MM:SS
export function maskTime(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 6)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}:${d.slice(2)}`
  return `${d.slice(0, 2)}:${d.slice(2, 4)}:${d.slice(4)}`
}
