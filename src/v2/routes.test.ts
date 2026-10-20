import { describe, expect, it } from 'vitest'
import { REGISTRY_ROWS } from '../shared/data/appData'
import { EDITOR_TABS, NEW_BATCH, batchBookStaticParams, parseRoute, routePath, tabSlug } from './routes'

// The URL tree MIRA keys its comments by. A comment pinned on the Results tab
// of a batch must reopen that tab from its URL, so parsing and building have
// to agree on one address per view.

describe('parseRoute', () => {
  it('reads the screens', () => {
    expect(parseRoute('/')).toEqual({ screen: 'dashboard' })
    expect(parseRoute('')).toEqual({ screen: 'dashboard' })
    expect(parseRoute('/registry')).toEqual({ screen: 'registry' })
    expect(parseRoute('/registry/')).toEqual({ screen: 'registry' })
    expect(parseRoute('/analysis/')).toEqual({ screen: 'analysis' })
    expect(parseRoute('/settings')).toEqual({ screen: 'settings' })
  })
  it('reads a batch and its tab, Resume when the tab is missing or unknown', () => {
    expect(parseRoute('/registry/BATCH1234')).toEqual({ screen: 'registry', batchId: 'BATCH1234', tab: undefined })
    expect(parseRoute('/registry/BATCH1234/results/')).toEqual({ screen: 'registry', batchId: 'BATCH1234', tab: 'Results' })
    expect(parseRoute('/registry/BATCH1234/Reports')).toEqual({ screen: 'registry', batchId: 'BATCH1234', tab: 'Reports' })
    expect(parseRoute('/registry/BATCH1234/nope')).toEqual({ screen: 'registry', batchId: 'BATCH1234', tab: undefined })
    expect(parseRoute('/registry/new')).toEqual({ screen: 'registry', batchId: NEW_BATCH, tab: undefined })
  })
  it('decodes the batch id', () => {
    expect(parseRoute('/registry/BA-0274').batchId).toBe('BA-0274')
    expect(parseRoute('/registry/A%20B/product').batchId).toBe('A B')
  })
  it('passes an unknown screen through (rendered as "coming soon")', () => {
    expect(parseRoute('/machines')).toEqual({ screen: 'machines' })
  })
})

describe('routePath', () => {
  it('is the inverse of parseRoute', () => {
    for (const p of ['/', '/registry', '/analysis', '/settings', '/registry/new', '/registry/BATCH1234', '/registry/BATCH1234/results']) {
      expect(routePath(parseRoute(p))).toBe(p)
    }
  })
  it('gives Resume the batch URL itself, other tabs their own segment', () => {
    expect(routePath({ screen: 'registry', batchId: 'BATCH1234', tab: 'Resume' })).toBe('/registry/BATCH1234')
    expect(routePath({ screen: 'registry', batchId: 'BATCH1234' })).toBe('/registry/BATCH1234')
    expect(routePath({ screen: 'registry', batchId: 'BATCH1234', tab: 'Machine' })).toBe('/registry/BATCH1234/machine')
  })
  it('encodes the batch id', () => {
    expect(routePath({ screen: 'registry', batchId: 'A B' })).toBe('/registry/A%20B')
  })
})

describe('batchBookStaticParams', () => {
  const paths = batchBookStaticParams().map((p) => p.path.join('/'))
  it('has every screen, the draft, and each demo batch with each tab', () => {
    expect(paths).toContain('')
    expect(paths).toContain('registry')
    expect(paths).toContain('registry/new')
    expect(paths).toContain('analysis')
    expect(paths).toContain('settings')
    for (const { id } of REGISTRY_ROWS) {
      expect(paths).toContain(`registry/${id}`)
      for (const tab of EDITOR_TABS) expect(paths).toContain(`registry/${id}/${tabSlug(tab)}`)
    }
    expect(paths).toHaveLength(5 + REGISTRY_ROWS.length * (1 + EDITOR_TABS.length))
  })
  it('has no duplicates', () => {
    expect(new Set(paths).size).toBe(paths.length)
  })
})
