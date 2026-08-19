import { MACHINE_INFO } from '../../../shared/data/mockData'

// Prominent "which machine am I configuring?" header at the top of the
// Availability / Performance cards (Settings › Production).
export default function MachineHeader({ machine, customized }: { machine: string; customized: boolean }) {
  const info = MACHINE_INFO.find((m) => m.name === machine)
  const monogram = `${machine[0] ?? ''}${machine.match(/\d+/)?.[0] ?? ''}`

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          {monogram}
        </span>
        <div>
          <p className="text-lg font-bold leading-tight text-ink">{machine}</p>
          <p className="text-xs text-muted">
            {info ? `${info.model} · ${info.family} · ${info.line}` : 'Machine configuration'}
          </p>
        </div>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-medium ${
          customized ? 'bg-primary/10 text-primary' : 'bg-line text-muted'
        }`}
      >
        {customized ? 'Customized' : 'Plant defaults'}
      </span>
    </div>
  )
}
