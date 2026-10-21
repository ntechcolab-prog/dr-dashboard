'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import type { EChartsOption, EChartsType } from 'echarts'
import EChart, { iris } from '@/src/v2/components/echarts/EChart'

export interface SensorSeries {
  name: string
  color: string
  data: number[]
}

// A numbered annotation pinned to a fraction (0..1) of the plot width.
export interface ChartNote {
  frac: number
  label: string // e.g. "19/06/2026 · 09:30"
  comment: string
}

// Lab samples drawn over the sensor lines (Remarks → "Show Results"): each
// point sits at a fraction (0..1) of the plot width, on its own right-hand axis.
export interface OverlaySeries {
  name: string
  color: string
  points: { frac: number; value: number; time: string }[]
}

// ECharts line chart for the batch sensor readings (Resume + Remarks tabs).
// curve is linear on every series — this is manufacturing data, so segments must
// be straight, never smoothed. The core multi-series plot + legend + axis value
// tooltip + per-series hover dimming is the ECharts line series (emphasis
// focus:'series'); the advanced extras map onto ECharts primitives:
//   • status band            → markArea (shaded region between two point indexes)
//   • note markers           → markLine (vertical, dashed) with numbered pills
//   • transient guide marker → markLine (dashed, arrow head)
//   • click-to-annotate      → zrender click → convertFromPixel → nearest index
//   • note tooltip           → HTML overlay positioned via convertToPixel
//   • results overlay        → extra line series on a hidden 0..1 x axis and a
//                              log y axis on the right (d10 and d90 differ ~100×)
export default function SensorChartV2({
  series,
  pointLabels,
  max,
  height = 320,
  highlight = null,
  band = null,
  notes = [],
  activeNote = null,
  markerFrac = null,
  overlay = [],
  hidden = [],
  onToggleSeries,
  onPlotClick,
}: {
  series: SensorSeries[]
  pointLabels: string[]
  max: number
  height?: number
  highlight?: number | null
  band?: [number, number] | null // status band between two point indexes
  notes?: ChartNote[]
  activeNote?: number | null // note emphasized from outside (e.g. table row hover)
  markerFrac?: number | null // transient vertical guide at a fraction (0..1) of the plot
  overlay?: OverlaySeries[]
  hidden?: string[] // series names switched off (legend click or a card's Hide)
  onToggleSeries?: (name: string, visible: boolean) => void
  onPlotClick?: (pointIndex: number) => void // click-to-annotate
}) {
  const [noteHover, setNoteHover] = useState<number | null>(null)
  const [ready, setReady] = useState(false)

  const instRef = useRef<EChartsType | null>(null)
  const readyRef = useRef(false)
  const zrBoundRef = useRef(false)

  // Live refs so the once-bound zrender click handler always reads fresh values.
  const onPlotClickRef = useRef(onPlotClick)
  onPlotClickRef.current = onPlotClick
  const onToggleRef = useRef(onToggleSeries)
  onToggleRef.current = onToggleSeries
  const labelsRef = useRef(pointLabels)
  labelsRef.current = pointLabels

  const n = pointLabels.length
  // Map a 0..1 fraction of the batch window onto a (fractional) category index so
  // it lines up with the plotted points — the ordinal scale interpolates.
  const fracToIndex = useCallback((f: number) => f * Math.max(n - 1, 1), [n])

  // A note is emphasized either by hovering its marker or from the outside
  // (e.g. hovering its row in the Notes table).
  const shownNote = noteHover != null ? noteHover : activeNote

  const primary = iris.primary

  // Capture the instance (fired on every 'finished') and, once, wire a zrender
  // click over the whole plot: click anywhere → nearest data index → annotate.
  const captureInstance = useCallback((inst: EChartsType) => {
    instRef.current = inst
    if (!readyRef.current) {
      readyRef.current = true
      setReady(true) // one re-render so the note overlay can position itself
    }
    if (!zrBoundRef.current) {
      zrBoundRef.current = true
      inst.getZr().on('click', (ev) => {
        const cb = onPlotClickRef.current
        if (!cb) return
        const point: [number, number] = [ev.offsetX, ev.offsetY]
        if (!inst.containPixel('grid', point)) return
        const raw = inst.convertFromPixel({ xAxisIndex: 0 }, ev.offsetX)
        const idx = Math.round(Array.isArray(raw) ? raw[0] : (raw as number))
        if (idx >= 0 && idx < labelsRef.current.length) cb(idx)
      })
    }
  }, [])

  const onEvents = useMemo(
    () => ({
      finished: (_p: unknown, inst?: EChartsType) => {
        if (inst) captureInstance(inst)
      },
      // Legend clicks are lifted into `hidden`; otherwise the next notMerge
      // redraw (any hover re-render) would bring every series back.
      legendselectchanged: (p: unknown) => {
        const params = p as { name: string; selected: Record<string, boolean> }
        onToggleRef.current?.(params.name, params.selected[params.name])
      },
      // Hovering a note's marker line emphasizes it and opens its tooltip.
      mouseover: (p: unknown) => {
        const params = p as { componentType?: string; name?: string }
        if (params.componentType !== 'markLine') return
        const m = /^note-(\d+)$/.exec(params.name ?? '')
        if (m) setNoteHover(Number(m[1]))
      },
      mouseout: (p: unknown) => {
        const params = p as { componentType?: string; name?: string }
        if (params.componentType === 'markLine' && /^note-\d+$/.test(params.name ?? '')) {
          setNoteHover(null)
        }
      },
    }),
    [captureInstance],
  )

  const option = useMemo<EChartsOption>(() => {
    const seriesOption = series.map((s) => ({
      name: s.name,
      type: 'line' as const,
      data: s.data,
      smooth: false, // manufacturing data — straight segments only
      showSymbol: false,
      lineStyle: { color: s.color, width: 2 },
      itemStyle: { color: s.color },
      // Hover a line (or a sensor card, via the highlight prop below) → this
      // series stays, the rest blur. Driven by dispatchAction on `highlight`.
      emphasis: { focus: 'series' as const },
      blur: { lineStyle: { opacity: 0.16 }, itemStyle: { opacity: 0.16 } },
    }))

    // Marks (band + note lines + transient guide) live on the first real series so
    // they always render; their styles are explicit, so a dimmed line color never
    // bleeds into them.
    if (seriesOption.length > 0) {
      const host = seriesOption[0] as Record<string, unknown>

      if (band && band[1] > band[0]) {
        host.markArea = {
          silent: true,
          itemStyle: { color: iris.up, opacity: 0.1 },
          data: [[{ xAxis: pointLabels[band[0]] }, { xAxis: pointLabels[band[1]] }]],
        }
      }

      const noteLines = notes.map((nt, i) => {
        const active = shownNote === i
        return {
          name: `note-${i}`,
          xAxis: fracToIndex(nt.frac),
          lineStyle: active
            ? { color: primary, type: 'solid' as const, width: 2, opacity: 0.9 }
            : { color: primary, type: 'dashed' as const, width: 1, opacity: 0.55 },
          label: {
            show: true,
            position: 'end' as const,
            formatter: String(i + 1),
            color: '#fff',
            backgroundColor: primary,
            borderColor: '#fff',
            borderWidth: 1.5,
            borderRadius: 20,
            padding: active ? [3, 5.5] : [2, 4.5],
            fontSize: active ? 11 : 9.5,
            fontWeight: 700,
          },
        }
      })

      const markerLine =
        markerFrac != null
          ? [
              {
                name: 'marker',
                xAxis: fracToIndex(markerFrac),
                symbol: ['none', 'triangle'] as [string, string],
                symbolSize: 8,
                symbolRotate: 180,
                lineStyle: { color: iris.ink, type: 'dashed' as const, width: 1.5, opacity: 0.7 },
                label: { show: false },
              },
            ]
          : []

      const markData = [...noteLines, ...markerLine]
      if (markData.length > 0) {
        host.markLine = {
          symbol: 'none',
          animation: false,
          emphasis: { disabled: true },
          data: markData,
        }
      }
    }

    const overlayOption = overlay.map((o) => ({
      name: o.name,
      type: 'line' as const,
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: o.points.map((pt) => ({ value: [pt.frac, pt.value], time: pt.time })),
      smooth: false,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { color: o.color, width: 1.5, type: 'dashed' as const },
      itemStyle: { color: o.color, borderColor: '#fff', borderWidth: 1.5 },
      // The axis tooltip only follows the category axis, so a sample shows its
      // value as a label when hovered.
      emphasis: {
        focus: 'series' as const,
        label: {
          show: true,
          position: 'top' as const,
          formatter: (p: { seriesName?: string; value?: unknown; data?: unknown }) => {
            const v = (p.value as [number, number])[1]
            const t = (p.data as { time: string }).time
            return `${p.seriesName} ${v.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} · ${t}`
          },
          color: o.color,
          fontWeight: 600,
          fontSize: 11,
          backgroundColor: 'rgba(255,255,255,0.92)',
          padding: [2, 4],
          borderRadius: 4,
        },
      },
      blur: { lineStyle: { opacity: 0.16 }, itemStyle: { opacity: 0.16 } },
    }))
    const hasOverlay = overlayOption.length > 0

    return {
      // notMerge redraws fully (needed so template switches don't leave stale
      // series) — kill animation so hover restyles are instant like the original.
      animation: false,
      grid: { left: 8, right: 8, top: 20, bottom: 48, containLabel: true },
      legend: {
        bottom: 6,
        icon: 'roundRect',
        data: [...series, ...overlay].map((s) => s.name),
        selected: Object.fromEntries([...series, ...overlay].map((s) => [s.name, !hidden.includes(s.name)])),
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: iris.faint } },
      },
      xAxis: [
        {
          type: 'category',
          data: pointLabels,
          boundaryGap: false, // points sit on the edges, like a 'point' scale
        },
        // Same width as the category axis, in 0..1 — where overlay samples land.
        { type: 'value', min: 0, max: 1, show: false, axisPointer: { show: false } },
      ],
      yAxis: [
        { type: 'value', min: 0, max },
        ...(hasOverlay
          ? [{
              type: 'log',
              position: 'right',
              name: 'Results',
              nameTextStyle: { color: iris.muted, align: 'right' },
              splitLine: { show: false },
              axisPointer: { show: false },
            }]
          : []),
      ],
      series: [...seriesOption, ...overlayOption],
    } as EChartsOption
  }, [series, pointLabels, max, band, notes, markerFrac, overlay, hidden, shownNote, primary, fracToIndex])

  // Card hover (highlight prop) drives ECharts emphasis directly: dispatching
  // `highlight` on the series (which uses focus:'series') blurs the others.
  // Re-applied on ready and after every notMerge redraw, which clears emphasis.
  useEffect(() => {
    const inst = instRef.current
    if (!inst) return
    inst.dispatchAction({ type: 'downplay' })
    if (highlight != null) inst.dispatchAction({ type: 'highlight', seriesIndex: highlight })
  }, [highlight, ready, option])

  // Note tooltip — an HTML overlay positioned from the live pixel geometry, so it
  // pins next to the active/hovered marker and flips to the left near the edge.
  const inst = instRef.current
  let noteTip: React.ReactNode = null
  if (inst && shownNote != null && notes[shownNote]) {
    const nt = notes[shownNote]
    const px = inst.convertToPixel({ xAxisIndex: 0 }, fracToIndex(nt.frac)) as number
    const leftEdge = inst.convertToPixel({ xAxisIndex: 0 }, 0) as number
    const rightEdge = inst.convertToPixel({ xAxisIndex: 0 }, Math.max(n - 1, 0)) as number
    const topY = inst.convertToPixel({ yAxisIndex: 0 }, max) as number
    if ([px, leftEdge, rightEdge, topY].every((v) => Number.isFinite(v))) {
      const tipW = 208
      const gridW = rightEdge - leftEdge || 1
      const near = (px - leftEdge) / gridW > 0.55
      const tx = near ? px - tipW - 6 : px + 6
      noteTip = (
        <div
          style={{
            position: 'absolute',
            left: tx,
            top: topY + 4,
            width: tipW,
            pointerEvents: 'none',
            borderRadius: 8,
            border: '1px solid var(--mui-palette-divider)',
            background: 'rgba(255,255,255,0.96)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(4px)',
            padding: '10px',
            boxSizing: 'border-box',
            zIndex: 2,
          }}
        >
          <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 600, color: primary }}>
            Note {shownNote + 1} · {nt.label}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--mui-palette-text-primary)' }}>
            {nt.comment || '—'}
          </p>
        </div>
      )
    }
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', cursor: onPlotClick ? 'copy' : undefined }}>
      <EChart option={option} height={height} onEvents={onEvents} notMerge />
      {noteTip}
    </Box>
  )
}
