import {addDaysToDateKey, formatDateKey, isValidDateKey, parseLocalDateKey} from '@/lib/games-api'
import {describe, expect, it} from 'vitest'

describe('date key helpers', () => {
  it('validates well-formed date keys', () => {
    expect(isValidDateKey('2026-01-31')).toBe(true)
    expect(isValidDateKey('2026-1-31')).toBe(false)
    expect(isValidDateKey('2026-02-30')).toBe(false) // rolls over, so invalid
    expect(isValidDateKey('not-a-date')).toBe(false)
    expect(isValidDateKey(null)).toBe(false)
    expect(isValidDateKey(undefined)).toBe(false)
  })

  it('round-trips parse and format', () => {
    expect(formatDateKey(parseLocalDateKey('2026-07-04'))).toBe('2026-07-04')
  })

  it('adds days across month boundaries', () => {
    expect(addDaysToDateKey('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDaysToDateKey('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDaysToDateKey('2026-06-15', 0)).toBe('2026-06-15')
  })
})
