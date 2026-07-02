'use client'

import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Dialog from '@mui/material/Dialog'
import Divider from '@mui/material/Divider'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutlined'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import { iris } from '@/src/client/mui/theme'
import { withAlpha } from '@/src/components/metricViz'
import type { LiveBatch } from '@/src/data/mockData'

// MUI-native rewrite of components/InOperation.tsx. Live-batches strip: fixed
// cards (3 per view) in a snap-scrolling carousel; clicking a card opens the
// detail dialog. Same LiveBatch data as v0/v1.

interface InOperationV2Props {
  batches: LiveBatch[]
}

function StatePill({ state }: { state: LiveBatch['state'] }) {
  const running = state === 'Running'
  return (
    <Chip
      size="small"
      icon={running ? <CheckCircleOutlineIcon /> : <PauseCircleOutlineIcon />}
      label={state}
      sx={{
        height: 22,
        fontSize: '0.6875rem',
        fontWeight: 500,
        color: running ? iris.primary700 : 'text.secondary',
        bgcolor: running ? iris.primarySoft : 'background.default',
        '& .MuiChip-icon': { fontSize: 14, color: 'inherit' },
      }}
    />
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <LinearProgress
      variant="determinate"
      value={value}
      sx={{
        height: 6, borderRadius: 3, bgcolor: 'background.default',
        '& .MuiLinearProgress-bar': { borderRadius: 3, backgroundColor: iris.irisBlue },
      }}
    />
  )
}

function Field({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.6875rem' }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        noWrap
        title={value}
        sx={{ mt: 0.25, fontWeight: 500, color: tone === 'warn' ? 'warning.main' : 'text.primary' }}
      >
        {value}
      </Typography>
    </Box>
  )
}

function BatchCard({ batch, onOpen }: { batch: LiveBatch; onOpen: () => void }) {
  return (
    <Box
      component="button"
      onClick={onOpen}
      sx={{
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        width: 'calc((100% - 2rem) / 3)',
        flexShrink: 0,
        scrollSnapAlign: 'start',
        borderRadius: 2, border: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper', p: 2,
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: 'text.primary' }}>BATCH {batch.id}</Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block', color: 'text.secondary' }}>{batch.recipe}</Typography>
        </Box>
        <StatePill state={batch.state} />
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">{batch.progress}%</Typography>
          <Typography variant="caption" color="text.secondary">ETA {batch.eta}</Typography>
        </Box>
        <ProgressBar value={batch.progress} />
      </Box>

      <Divider sx={{ mt: 1.5 }} />
      <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        <Field label="Machine" value={batch.machine} />
        <Field label="Energy" value={`${batch.energy} kWh`} />
      </Box>
    </Box>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.6875rem' }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        noWrap
        title={value}
        sx={{ mt: 0.25, fontWeight: 500, color: tone === 'warn' ? 'warning.main' : 'text.primary' }}
      >
        {value}
      </Typography>
    </Box>
  )
}

function BatchModal({ batch, onClose }: { batch: LiveBatch; onClose: () => void }) {
  const massPct = batch.targetMass ? Math.round((batch.currentMass / batch.targetMass) * 100) : 0

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth aria-label={`Batch ${batch.id} details`}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>BATCH {batch.id}</Typography>
            <StatePill state={batch.state} />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {batch.recipe} · {batch.machine} · {batch.productionLine}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close" size="small"><CloseIcon /></IconButton>
      </Box>

      <Box sx={{ px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>{batch.phase}</Typography>
            <Typography variant="body2" color="text.secondary">{batch.progress}% · ETA {batch.eta}</Typography>
          </Box>
          <ProgressBar value={batch.progress} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' }, columnGap: 3, rowGap: 2,
          borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: withAlpha(iris.page, 0.5), p: 2 }}>
          <Stat label="Operator" value={batch.operator} />
          <Stat label="Started at" value={batch.startedAt} />
          <Stat label="ETA" value={batch.eta} />
          <Stat label="Mass" value={`${batch.currentMass} / ${batch.targetMass} ton (${massPct}%)`} />
          <Stat label="Energy" value={`${batch.energy} kWh`} />
          <Stat label="Mill speed" value={batch.millSpeed ? `${batch.millSpeed.toLocaleString('en-US')} rpm` : '—'} />
          <Stat label="Product temp." value={`${batch.productTemp} °C`} />
          <Stat label="Flow rate" value={batch.flowRate ? `${batch.flowRate} l/min` : '—'} />
          <Stat label="Alarms" value={String(batch.alarms)} tone={batch.alarms > 0 ? 'warn' : undefined} />
        </Box>

        <Box>
          <Typography
            variant="caption"
            sx={{ display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: 'text.secondary', fontSize: '0.6875rem' }}
          >
            Recent events
          </Typography>
          <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {batch.events.map((ev, i) => (
              <Box component="li" key={i} sx={{ display: 'flex', gap: 1.5 }}>
                <Typography variant="body2" sx={{ width: 44, flexShrink: 0, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                  {ev.time}
                </Typography>
                <Typography variant="body2" sx={{ position: 'relative', pl: 2, color: 'text.primary',
                  '&::before': { content: '""', position: 'absolute', left: 0, top: '0.45rem', width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' } }}>
                  {ev.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Dialog>
  )
}

export default function InOperationV2({ batches }: InOperationV2Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<LiveBatch | null>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateArrows = () => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    if (!el) return
    const onResize = () => updateArrows()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [batches.length])

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
  }

  const overflowing = canPrev || canNext

  return (
    <Box sx={{ borderRadius: 2.5, bgcolor: 'background.paper', p: 3, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="overline" sx={{ fontWeight: 600, color: 'text.primary' }}>In Operation</Typography>
          <Chip
            size="small"
            label={batches.length}
            sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600, color: iris.primary700, bgcolor: iris.primarySoft }}
          />
        </Box>
        {overflowing && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small" onClick={() => scrollByPage(-1)} disabled={!canPrev} aria-label="Previous batches"
              sx={{ border: '1px solid', borderColor: 'divider' }}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => scrollByPage(1)} disabled={!canNext} aria-label="Next batches"
              sx={{ border: '1px solid', borderColor: 'divider' }}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      <Box
        ref={trackRef}
        onScroll={updateArrows}
        sx={{
          display: 'flex', gap: 2, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none',
        }}
      >
        {batches.map((b) => (
          <BatchCard key={b.id} batch={b} onOpen={() => setSelected(b)} />
        ))}
      </Box>

      {selected && <BatchModal batch={selected} onClose={() => setSelected(null)} />}
    </Box>
  )
}
