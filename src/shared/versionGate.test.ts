import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  gatedEditorSteps,
  initialScreen,
  isRestricted,
  isScreenGated,
  readVersion,
} from './versionGate'

// The gate reads window.location.search. These tests pin the behaviour the v0
// rules had while they were inlined in App.tsx / AppV2.tsx / the sidebars and
// batch editors, so a future edit to the gate can't silently change what v0
// hides in one version but not the other.
function atUrl(search: string) {
  vi.stubGlobal('window', { location: { search } })
}
afterEach(() => vi.unstubAllGlobals())

const SCREENS = ['dashboard', 'registry', 'analysis', 'settings']
const STEPS = ['Resume', 'Product', 'Machine', 'Period', 'Results', 'Remarks', 'Details', 'Reports'] as const

describe('readVersion', () => {
  it('takes the version from ?v=', () => {
    atUrl('?v=0')
    expect(readVersion('1')).toBe('0')
    atUrl('?v=2')
    expect(readVersion('1')).toBe('2')
  })
  it('falls back when the param is missing or junk', () => {
    atUrl('')
    expect(readVersion('1')).toBe('1')
    atUrl('?v=9')
    expect(readVersion('2')).toBe('2')
  })
  it('falls back on the server, where there is no URL', () => {
    vi.stubGlobal('window', undefined)
    expect(readVersion('2')).toBe('2')
  })
})

describe('isRestricted', () => {
  it('is v0 only under ?v=0 — for both apps', () => {
    atUrl('?v=0')
    expect(isRestricted('1')).toBe(true) // Tailwind app
    expect(isRestricted('2')).toBe(true) // MUI app
  })
  it('is not restricted by default', () => {
    atUrl('')
    expect(isRestricted('1')).toBe(false)
    expect(isRestricted('2')).toBe(false)
  })
  it('is not restricted on the server', () => {
    vi.stubGlobal('window', undefined)
    expect(isRestricted('2')).toBe(false)
  })
})

describe('isScreenGated', () => {
  it('leaves only Registry open under v0', () => {
    expect(isScreenGated('registry', true)).toBe(false)
    expect(isScreenGated('dashboard', true)).toBe(true)
    expect(isScreenGated('analysis', true)).toBe(true)
    expect(isScreenGated('settings', true)).toBe(true)
  })
  it('gates nothing outside v0', () => {
    for (const s of SCREENS) expect(isScreenGated(s, false)).toBe(false)
  })
})

describe('gatedEditorSteps', () => {
  it('disables every batch tab but Resume under v0', () => {
    expect(gatedEditorSteps(STEPS, true)).toEqual([
      'Product', 'Machine', 'Period', 'Results', 'Remarks', 'Details', 'Reports',
    ])
  })
  it('disables nothing outside v0', () => {
    expect(gatedEditorSteps(STEPS, false)).toEqual([])
  })
})

describe('initialScreen', () => {
  it('always lands v0 on Registry, ignoring ?view=', () => {
    atUrl('?v=0&view=analysis')
    expect(initialScreen(true, 'dashboard', SCREENS)).toBe('registry')
  })
  it('honours ?view= when it names a real screen', () => {
    atUrl('?view=settings')
    expect(initialScreen(false, 'dashboard', SCREENS)).toBe('settings')
  })
  it('ignores a ?view= that is not a screen', () => {
    atUrl('?view=nope')
    expect(initialScreen(false, 'dashboard', SCREENS)).toBe('dashboard')
  })
  it('uses the preferred screen with no ?view=', () => {
    atUrl('')
    expect(initialScreen(false, 'dashboard', SCREENS)).toBe('dashboard')
  })
})
