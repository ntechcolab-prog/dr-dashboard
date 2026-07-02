'use client'

import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { iris, chartPalette } from '@/src/client/mui/theme'

// IRIS ECharts theme — registered once, mirrors the product's tokens so every
// v2 chart reads as the same system (not stock ECharts). Text uses the Roboto
// variable wired in app/layout.tsx; tooltips use the dark IRIS topbar color.
let registered = false
function ensureTheme() {
  if (registered) return
  registered = true
  echarts.registerTheme('iris', {
    color: chartPalette,
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'var(--font-roboto), Roboto, ui-sans-serif, system-ui, sans-serif', color: iris.ink },
    title: { textStyle: { color: iris.ink }, subtextStyle: { color: iris.muted } },
    legend: { textStyle: { color: iris.muted } },
    categoryAxis: {
      axisLine: { lineStyle: { color: iris.line } },
      axisTick: { show: false },
      axisLabel: { color: iris.muted, fontSize: 11 },
      splitLine: { show: false, lineStyle: { color: iris.lineSoft } },
    },
    valueAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: iris.muted, fontSize: 11 },
      splitLine: { lineStyle: { color: iris.lineSoft, type: 'dashed' } },
    },
    tooltip: {
      backgroundColor: iris.irisTopbar,
      borderWidth: 0,
      padding: [6, 10],
      textStyle: { color: '#fff', fontSize: 12 },
      extraCssText: 'border-radius:7px;box-shadow:0 6px 24px rgba(38,40,52,0.16);',
    },
  })
}

export interface EChartProps {
  option: EChartsOption
  height?: number | string
  className?: string
  style?: React.CSSProperties
  // Chart events, e.g. { click: (params) => ... }.
  onEvents?: Record<string, (params: unknown) => void>
  notMerge?: boolean
  group?: string
}

// Sensible IRIS defaults folded under the caller's option (caller wins). Keeps
// the tight, flat look: no chart title padding, compact grid, no heavy anim.
const BASE: EChartsOption = {
  animationDuration: 500,
  animationEasing: 'quarticOut',
  grid: { left: 8, right: 8, top: 12, bottom: 8, containLabel: true },
  tooltip: { trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: iris.faint } } },
}

export default function EChart({ option, height = 240, className, style, onEvents, notMerge, group }: EChartProps) {
  ensureTheme()
  const merged = useMemo<EChartsOption>(() => ({ ...BASE, ...option }), [option])
  return (
    <ReactECharts
      echarts={echarts}
      theme="iris"
      option={merged}
      notMerge={notMerge}
      onEvents={onEvents}
      style={{ height, width: '100%', ...style }}
      className={className}
      opts={{ renderer: 'canvas' }}
      onChartReady={group ? (inst) => { inst.group = group } : undefined}
    />
  )
}

// Re-exported so chart callers reach IRIS colors/tokens without importing theme.
export { iris, chartPalette }
