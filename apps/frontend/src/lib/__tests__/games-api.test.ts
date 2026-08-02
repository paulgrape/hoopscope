import {ApiError} from '@/lib/api-client'
import {addDaysToDateKey, formatDateKey, getHistoricGame, isValidDateKey, parseLocalDateKey} from '@/lib/games-api'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

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

describe('getHistoricGame', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('resolves null for an unknown game so the page can render a 404', async () => {
    fetchMock.mockResolvedValue(new Response('{}', {status: 404}))

    await expect(getHistoricGame('nope')).resolves.toBeNull()
  })

  it('rethrows backend failures', async () => {
    fetchMock.mockResolvedValue(new Response('{}', {status: 500}))

    await expect(getHistoricGame('game-1')).rejects.toBeInstanceOf(ApiError)
  })

  it('returns the game state on success', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({id: 'game-1'}), {status: 200}))

    await expect(getHistoricGame('game-1')).resolves.toMatchObject({id: 'game-1'})
  })
})
