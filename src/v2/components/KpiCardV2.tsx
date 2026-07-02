'use client'

import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ArrowUpIcon from '@mui/icons-material/ArrowDropUp'
import ArrowDownIcon from '@mui/icons-material/ArrowDropDown'
import { SparkLineChart } from '@mui/x-charts/SparkLineChart'
import { formatValue, type Kpi } from '@/src/lib/compute'
import { metaFor, withAlpha, VIZ, VIZ_CAPTION } from '@/src/components/metricViz'

// MUI-native KPI card. Reuses the same compute/metricViz logic as v0/v1; the
// hand-rolled SVG sparkline is replaced by MUI X SparkLineChart. curve="linear"
// enforced — production/manufacturing series read as straight segments, never
// smoothed (matches the product's charting rule).
export default function KpiCardV2({
  kpi, series, onDetails,
}: { kpi: Kpi; series: number[]; onDetails?: (kpi: Kpi) => void }) {
  const up = kpi.delta >= 0
  const { accent } = metaFor(kpi.key)
  const kind = VIZ[kpi.key] ?? 'area'
  const plotType = kind === 'column' ? 'bar' : 'line'
  const area = kind === 'area'

  return (
    <Card sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Box sx={{ width: 28, height: 28, flexShrink: 0, borderRadius: 1.25, display: 'grid', placeItems: 'center',
            bgcolor: withAlpha(accent, 0.12), color: accent }}>
            <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: accent }} />
          </Box>
          <Typography variant="overline" noWrap sx={{ fontWeight: 600, color: 'text.secondary', lineHeight: 1.2 }}>
            {kpi.label}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, fontWeight: 600, fontSize: '0.75rem',
          color: up ? 'success.main' : 'error.main' }}>
          {up ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />}
          {up ? '+' : ''}{Math.round(kpi.delta)}%
        </Box>
      </Box>

      <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '2fr 3fr', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 0.5, lineHeight: 1 }}>
            <Typography component="span" sx={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1, color: 'text.primary' }}>
              {formatValue(kpi.value, kpi.fmt)}
            </Typography>
            <Typography component="span" variant="caption" color="text.secondary">{kpi.unit}</Typography>
          </Box>
        </Box>
        <Box sx={{ height: 64, overflow: 'hidden' }}>
          {series.length > 0 && (
            <SparkLineChart
              data={series}
              height={64}
              plotType={plotType}
              curve="linear"
              area={area}
              showHighlight
              showTooltip
              color={accent}
            />
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 'auto', pt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', textTransform: 'uppercase', fontSize: '0.625rem', fontWeight: 500 }}>
          {VIZ_CAPTION[kpi.key] ?? 'vs last month'}
        </Typography>
        {onDetails && (
          <Button size="small" onClick={() => onDetails(kpi)} sx={{ minWidth: 0, p: 0.5 }}>Details</Button>
        )}
      </Box>
    </Card>
  )
}
