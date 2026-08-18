import { describe, expect, it } from 'vitest'
import { deltaLabel, formatNumber, latestValue, parseNumeric } from './expected'

describe('parseNumeric', () => {
  it('accepts both decimal separators', () => {
    expect(parseNumeric('1,60')).toBe(1.6)
    expect(parseNumeric('1.60')).toBe(1.6)
  })
  it('gives up on non-numbers and blanks', () => {
    expect(parseNumeric('pass')).toBeNull()
    expect(parseNumeric('')).toBeNull()
    expect(parseNumeric(undefined)).toBeNull()
  })
})

describe('latestValue', () => {
  const rows = [
    { date: '', time: '', values: { d50: '2,2', pH: '7' } },
    { date: '', time: '', values: { d50: '1,84', pH: '' } },
    { date: '', time: '', values: { d50: '', pH: '' } },
  ]
  it('takes the last row that actually has a value', () => {
    expect(latestValue(rows, 'd50')).toBe('1,84')
    expect(latestValue(rows, 'pH')).toBe('7')
    expect(latestValue(rows, 'd90')).toBe('')
  })
})

describe('deltaLabel', () => {
  it('signs the difference', () => {
    expect(deltaLabel('1,60', '1,84')).toBe('+0,24')
    expect(deltaLabel('2,50', '2,31')).toBe('-0,19')
    expect(deltaLabel('1,60', '1,60')).toBe('0')
  })
  it('is null when either side is missing or not numeric', () => {
    expect(deltaLabel(undefined, '1,84')).toBeNull()
    expect(deltaLabel('1,60', '')).toBeNull()
    expect(deltaLabel('pass', '1,84')).toBeNull()
  })
})

describe('formatNumber', () => {
  it('keeps the comma style and drops trailing zeros', () => {
    expect(formatNumber(0.24)).toBe('0,24')
    expect(formatNumber(2)).toBe('2')
  })
})
