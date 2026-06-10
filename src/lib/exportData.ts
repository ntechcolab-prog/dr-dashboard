// CSV + XLSX export helpers (SheetJS). PDF lives in ./exportPdf (printElement).
// Each export takes plain rows-of-cells so callers stay declarative and the
// output always reflects whatever the caller computed from current state.
//
// SheetJS is loaded on demand (dynamic import) so it never weighs down the main
// bundle — it only downloads the first time a user exports CSV/XLSX.

export type Cell = string | number
export interface Sheet {
  name: string
  rows: Cell[][] // first row is treated as the header
}

function sanitize(name: string): string {
  return name.replace(/[^\w.-]+/g, '_').slice(0, 80)
}

export async function exportCsv(filenameBase: string, sheet: Sheet): Promise<void> {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.aoa_to_sheet(sheet.rows)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${sanitize(filenameBase)}.csv`)
}

export async function exportXlsx(filenameBase: string, sheets: Sheet[]): Promise<void> {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(s.rows)
    XLSX.utils.book_append_sheet(wb, ws, sanitize(s.name).slice(0, 31) || 'Sheet1')
  }
  XLSX.writeFile(wb, `${sanitize(filenameBase)}.xlsx`)
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
