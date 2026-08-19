import { useEffect, useRef, useState } from 'react'
import { Download, FilePdf, ChevronDown } from '../icons/Icons'
import { printElement } from '../../shared/lib/exportPdf'
import { exportCsv, exportXlsx, type Sheet } from '../../shared/lib/exportData'

// Single "Export" button with a PDF / CSV / XLSX menu. `sheets` and `title` are
// resolved lazily on click so the export always reflects the current state.
interface ExportMenuProps {
  title: string
  printId: string
  filenameBase: string
  sheets: () => Sheet[]
  // When set, the button is greyed out and the menu can't open (e.g. nothing selected).
  disabled?: boolean
  // Optional override for the button label (defaults to "Export").
  label?: string
  // When true, the button turns solid green once enabled (call-to-action style).
  accent?: boolean
}

export default function ExportMenu({ title, printId, filenameBase, sheets, disabled = false, label = 'Export', accent = false }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const run = (fn: () => void | Promise<void>) => {
    Promise.resolve(fn()).catch(() => {
      /* export failed (e.g. SheetJS chunk couldn't load) — keep the UI quiet */
    })
    setOpen(false)
  }

  return (
    <div className="relative no-print" ref={ref}>
      <button
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          accent && !disabled
            ? 'border border-primary bg-transparent text-primary hover:bg-primary-soft'
            : 'border border-line bg-card text-muted enabled:hover:text-ink'
        }`}
      >
        <Download size={16} />
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-pop">
          <Item icon={<FilePdf size={16} />} label="PDF" hint="Print / save" onClick={() => run(() => printElement(printId, title))} />
          <Item icon={<SheetIcon />} label="CSV" hint=".csv" onClick={() => run(() => exportCsv(filenameBase, sheets()[0]))} />
          <Item icon={<SheetIcon />} label=".xlsx" hint="Excel" onClick={() => run(() => exportXlsx(filenameBase, sheets()))} />
        </div>
      )}
    </div>
  )
}

function Item({ icon, label, hint, onClick }: { icon: React.ReactNode; label: string; hint: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink hover:bg-page"
    >
      <span className="text-muted">{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      <span className="text-[0.6875rem] text-faint">{hint}</span>
    </button>
  )
}

function SheetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="9" x2="9" y2="21" />
    </svg>
  )
}
