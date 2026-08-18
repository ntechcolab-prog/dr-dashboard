'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Badge from '@mui/material/Badge'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/SaveOutlined'
import EditIcon from '@mui/icons-material/EditOutlined'
import type { BatchForm } from '@/src/data/batchForm'
import { useLocalStorage } from '@/src/lib/useLocalStorage'
import { useProductionMonitoring } from '@/src/screens/settings/MiscSettings'
import type { Sheet } from '@/src/lib/exportData'
import ExportMenuV2 from './ExportMenuV2'
import ResumeTab from './tabs/ResumeTab'
import ProductTab from './tabs/ProductTab'
import MachineFormTab from './tabs/MachineFormTab'
import PeriodTab from './tabs/PeriodTab'
import ResultsTab from './tabs/ResultsTab'
import RemarksTab from './tabs/RemarksTab'
import LogsTab from './tabs/LogsTab'
import ReportsTab from './tabs/ReportsTab'

const EDITOR_PRINT_ID = 'batch-editor-print-v2'
const STEPS = ['Resume', 'Product', 'Machine', 'Period', 'Results', 'Remarks', 'Details', 'Reports'] as const
type Step = (typeof STEPS)[number]

interface Props {
  initial: BatchForm
  onBack: () => void
  onSave: (form: BatchForm) => void
  restricted?: boolean
}

export default function BatchEditorV2({ initial, onBack, onSave, restricted = false }: Props) {
  const disabledSteps: Step[] = restricted ? STEPS.filter((s) => s !== 'Resume') : []
  const [form, setForm] = useLocalStorage<BatchForm>(`dr-batch-form-${initial.id}`, initial)
  const [rawStep, setStep] = useState<Step>('Resume')
  const [saved, setSaved] = useState(false)

  const pmOn = useProductionMonitoring()
  const visibleSteps = STEPS.filter((s) => pmOn || s !== 'Remarks')
  const step: Step = !pmOn && rawStep === 'Remarks' ? 'Resume' : rawStep

  const update = <K extends keyof BatchForm>(key: K, val: BatchForm[K]) => setForm((f) => ({ ...f, [key]: val }))

  const save = () => {
    onSave(form)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  const buildSheets = (): Sheet[] => [
    {
      name: 'Batch',
      rows: [
        ['Field', 'Value'],
        ['Batch ID', form.id],
        ['Version', form.version],
        ['Product information', form.product.details],
        ['Start', `${form.period.startDate} ${form.period.startTime}`],
        ['End', `${form.period.endDate} ${form.period.endTime}`],
        ['Machine', form.machine.name],
        ['Machine type', form.machine.machineType],
      ],
    },
    {
      name: 'Results',
      rows: [
        ['Date', 'Time', ...form.results.variables],
        ...form.results.rows.map((r) => [r.date, r.time, ...form.results.variables.map((v) => r.values[v] ?? '')]),
      ],
    },
    {
      name: 'Notes',
      rows: [['Date', 'Time', 'Comment'], ...form.remarks.notes.map((n) => [n.date, n.time, n.comment])],
    },
  ]

  return (
    <Box sx={{ maxWidth: '75rem', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2, p: 2.5 }}>
      {/* header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Back to Registry">
            <IconButton onClick={onBack} aria-label="Back to Registry" sx={{ border: '1px solid', borderColor: 'divider', color: 'primary.main', borderRadius: 1.5 }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{form.id}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box>
            <Typography variant="caption" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>Version</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{form.version}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {saved && <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 500 }}>Saved ✓</Typography>}
            <ExportMenuV2 title={`Batch ${form.id}`} printId={EDITOR_PRINT_ID} filenameBase={`batch-${form.id}`} sheets={buildSheets} />
            <Tooltip title="Save"><IconButton onClick={save} aria-label="Save" sx={{ border: '1px solid', borderColor: 'divider' }}><SaveIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Edit"><IconButton aria-label="Edit" sx={{ border: '1px solid', borderColor: 'divider' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
          </Box>
        </Box>
      </Box>

      {/* step tabs */}
      <Tabs
        value={step}
        onChange={(_, v: Step) => { if (!disabledSteps.includes(v)) setStep(v) }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {visibleSteps.map((s) => {
          const disabled = disabledSteps.includes(s)
          return (
            <Tab
              key={s}
              value={s}
              disabled={disabled}
              label={disabled ? <Badge color="default" badgeContent="soon" sx={{ '& .MuiBadge-badge': { fontSize: '0.5rem' } }}>{s}</Badge> : s}
            />
          )
        })}
      </Tabs>

      <Box id={EDITOR_PRINT_ID}>
        {step === 'Resume' && <ResumeTab form={form} />}
        {step === 'Product' && <ProductTab
            value={form.product}
            onChange={(v) => update('product', v)}
            results={form.results}
            onResultsChange={(v) => update('results', v)}
          />}
        {step === 'Machine' && <MachineFormTab value={form.machine} onChange={(v) => update('machine', v)} />}
        {step === 'Period' && <PeriodTab value={form.period} onChange={(v) => update('period', v)} />}
        {step === 'Results' && <ResultsTab value={form.results} onChange={(v) => update('results', v)} />}
        {step === 'Remarks' && pmOn && <RemarksTab value={form.remarks} onChange={(v) => update('remarks', v)} />}
        {step === 'Details' && <LogsTab />}
        {step === 'Reports' && <ReportsTab value={form.reports} onChange={(v) => update('reports', v)} />}
      </Box>
    </Box>
  )
}
