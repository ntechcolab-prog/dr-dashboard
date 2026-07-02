'use client'

import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import CloseIcon from '@mui/icons-material/Close'
import ArrowUpIcon from '@mui/icons-material/ArrowDropUp'
import ArrowDownIcon from '@mui/icons-material/ArrowDropDown'
import { LineChart } from '@mui/x-charts/LineChart'
import { BarChart } from '@mui/x-charts/BarChart'
import { formatValue, type Kpi, type RankItem } from '@/src/lib/compute'
import type { Batch } from '@/src/data/mockData'
import { VIZ, metaFor, withAlpha, METRIC_STYLE_KEY, type MetricStyleMap } from '@/src/components/metricViz'
import { useLocalStorage } from '@/src/lib/useLocalStorage'
import { chartPalette } from '@/src/client/mui/theme'

// MUI-native rebuild of DetailsDrawer (Tailwind original in src/components).
// Same DrawerData contract as v0/v1 so the orchestrator can feed it unchanged.
// KPI mode: headline + daily trend (line/bar, curve="linear") + per-machine and
// per-recipe horizontal-bar breakdowns, all on @mui/x-charts. Day mode: batch
// list. Chart style honors the METRIC_STYLE_KEY override chosen on the grid.

export type DrawerData = {
  open: boolean
  kind: 'kpi' | 'day'
  title: string
  subtitle: string
  // day mode
  batches: Batch[]
  // kpi mode
  kpi?: Kpi
  daily?: { labels: string[]; data: number[] }
  byMachine?: RankItem[]
  byRecipe?: RankItem[]
  // when true, the trend uses the same viz style as the V2 metric card
  richViz?: boolean
}

type DetailsDrawerV2Props = DrawerData & { onClose: () => void }

export default function DetailsDrawerV2({
  open, kind, title, subtitle, batches, kpi, daily, byMachine, byRecipe, richViz, onClose,
}: DetailsDrawerV2Props) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: '100%', maxWidth: '30rem', display: 'flex', flexDirection: 'column' } } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1,
        px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>{title}</Typography>
          {subtitle && <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>{subtitle}</Typography>}
        </Box>
        <IconButton onClick={onClose} aria-label="Close" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2.5 }}>
        {kind === 'kpi'
          ? <KpiDetail kpi={kpi} daily={daily} byMachine={byMachine} byRecipe={byRecipe} richViz={richViz} />
          : <BatchList batches={batches} />}
      </Box>
    </Drawer>
  )
}

function KpiDetail({
  kpi, daily, byMachine, byRecipe, richViz,
}: {
  kpi?: Kpi
  daily?: { labels: string[]; data: number[] }
  byMachine?: RankItem[]
  byRecipe?: RankItem[]
  richViz?: boolean
}) {
  // The chart style chosen on the metric card carries over to the drawer.
  const [styleMap] = useLocalStorage<MetricStyleMap>(METRIC_STYLE_KEY, {})
  if (!kpi) return null
  const override = styleMap[kpi.key] || undefined
  const up = kpi.delta >= 0
  const accent = metaFor(kpi.key).accent
  const kind = VIZ[kpi.key]
  // Time-series viz read as a trend; the summary viz (gauge/donut/...) doesn't.
  const trendTitle =
    override || !richViz || kind === 'area' || kind === 'column' ? 'Daily trend' : 'Summary'
  // Render the daily series as bars for column metrics / bar override, else line.
  const asBars = override === 'bar' || (!override && kind === 'column')
  const asArea = override === 'area' || (!override && kind === 'area')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* headline value */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
          <Typography component="span" sx={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1, color: 'text.primary' }}>
            {formatValue(kpi.value, kpi.fmt)}
          </Typography>
          <Typography component="span" variant="body2" color="text.secondary">{kpi.unit}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, fontWeight: 600, fontSize: '0.875rem',
          color: up ? 'success.main' : 'error.main' }}>
          {up ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />}
          {up ? '+' : ''}{Math.round(kpi.delta)}% vs prev. month
        </Box>
      </Box>

      {daily && daily.data.length > 0 && (
        <Section title={trendTitle}>
          {asBars ? (
            <BarChart
              height={220}
              hideLegend
              margin={{ top: 8, right: 8, bottom: 24, left: 8 }}
              xAxis={[{ scaleType: 'band', data: daily.labels }]}
              yAxis={[{ width: 44 }]}
              series={[{ data: daily.data, color: accent, valueFormatter: (v) => (v == null ? '' : `${v} ${kpi.unit}`) }]}
            />
          ) : (
            <LineChart
              height={220}
              hideLegend
              margin={{ top: 8, right: 8, bottom: 24, left: 8 }}
              xAxis={[{ scaleType: 'point', data: daily.labels }]}
              yAxis={[{ width: 44 }]}
              series={[{
                data: daily.data, color: accent, curve: 'linear', showMark: false,
                area: asArea, valueFormatter: (v) => (v == null ? '' : `${v} ${kpi.unit}`),
              }]}
              sx={asArea ? { '& .MuiAreaElement-root': { fill: withAlpha(accent, 0.16) } } : undefined}
            />
          )}
        </Section>
      )}

      {byMachine && byMachine.length > 0 && (
        <Section title="By machine">
          <RankBars data={byMachine} unit={kpi.unit} />
        </Section>
      )}

      {byRecipe && byRecipe.length > 0 && (
        <Section title="By recipe">
          <RankBars data={byRecipe} unit={kpi.unit} />
        </Section>
      )}
    </Box>
  )
}

// Horizontal ranking bars — one colored bar per category (machine / recipe).
function RankBars({ data, unit }: { data: RankItem[]; unit: string }) {
  const labels = data.map((d) => d.label)
  const colors = data.map((_, i) => chartPalette[i % chartPalette.length])
  const height = Math.max(120, data.length * 44 + 40)
  return (
    <BarChart
      height={height}
      layout="horizontal"
      hideLegend
      margin={{ top: 8, right: 16, bottom: 24, left: 8 }}
      yAxis={[{ scaleType: 'band', data: labels, width: 96, colorMap: { type: 'ordinal', values: labels, colors } }]}
      xAxis={[{ min: 0 }]}
      series={[{ data: data.map((d) => d.value), valueFormatter: (v) => (v == null ? '' : `${v} ${unit}`) }]}
    />
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ mb: 1.5, display: 'block', fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.04em', color: 'text.secondary', fontSize: '0.6875rem' }}>
        {title}
      </Typography>
      {children}
    </Box>
  )
}

function BatchList({ batches }: { batches: Batch[] }) {
  if (batches.length === 0) {
    return <Typography variant="body2" sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>No batches for this selection.</Typography>
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {batches.map((b) => (
        <Box key={b.id} sx={{ borderRadius: 1.5, border: '1px solid', borderColor: 'divider', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>Batch {b.id}</Typography>
            <StatusPill status={b.status} />
          </Box>
          <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>{b.recipe} · {b.machine}</Typography>
          <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
            <Stat label="Mass" value={`${b.mass} ton`} />
            <Stat label="Energy" value={`${b.energy} kWh`} />
            <Stat label="Grinding" value={`${b.grindMin} min`} />
            <Stat label="Setup" value={`${b.setupMin} min`} />
            <Stat label="Idle" value={`${b.idleMin} min`} />
            <Stat label="CO₂" value={`${b.co2}`} />
          </Box>
        </Box>
      ))}
    </Box>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6875rem' }}>{label}</Typography>
      <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 500, color: 'text.primary' }}>{value}</Typography>
    </Box>
  )
}

function StatusPill({ status }: { status: string }) {
  const color: 'error' | 'primary' | 'default' =
    status === 'Cancelled' ? 'error' : status.startsWith('Completed') ? 'primary' : 'default'
  return <Chip label={status} size="small" color={color} variant={color === 'default' ? 'filled' : 'outlined'}
    sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 500 }} />
}
