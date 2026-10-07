import {ApiError} from '@/lib/api-client'
import {
  addDaysToDateKey,
  browserTodayOverride,
  formatDateKey,
  getDateKeyInTimeZone,
  getHistoricGame,
  getOffsetMinutesForDate,
  getOffsetMinutesInTimeZone,
  isValidDateKey,
  parseLocalDateKey,
  resolveScheduleSeed,
  seedOffsetMatchesBrowser
} from '@/lib/games-api'
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

  it('reads a civil date and getTimezoneOffset-style minutes from an IANA zone', () => {
    const instant = new Date('2026-10-04T22:00:00Z')
    expect(getDateKeyInTimeZone('Europe/Moscow', instant)).toBe('2026-10-05')
    expect(getOffsetMinutesInTimeZone('2026-10-05', 'Europe/Moscow')).toBe(-180)
    expect(getOffsetMinutesInTimeZone('2026-10-04', 'America/New_York')).toBe(240)
    expect(getOffsetMinutesInTimeZone('2026-10-04', 'Asia/Kolkata')).toBe(-330)
  })

  it('uses the offset in effect at local midnight across a DST change', () => {
    expect(getOffsetMinutesInTimeZone('2026-09-27', 'Pacific/Auckland')).toBe(-720)
    expect(getOffsetMinutesInTimeZone('2026-09-28', 'Pacific/Auckland')).toBe(-780)
    expect(getOffsetMinutesInTimeZone('2026-03-08', 'America/New_York')).toBe(300)
    expect(getOffsetMinutesInTimeZone('2026-03-09', 'America/New_York')).toBe(240)
  })

  it('reuses a schedule seed only when its offset matches the browser', () => {
    const dateKey = '2026-10-04'
    const browserOffset = getOffsetMinutesForDate(dateKey)
    expect(seedOffsetMatchesBrowser(browserOffset, dateKey)).toBe(true)
    expect(seedOffsetMatchesBrowser(browserOffset + 60, dateKey)).toBe(false)
    expect(seedOffsetMatchesBrowser(undefined, dateKey)).toBe(false)
  })

  it('replaces a dateless server today and keeps an explicit date query', () => {
    expect(browserTodayOverride(null, '2026-10-04', '2026-10-04', '2026-10-05')).toBe('2026-10-05')
    expect(browserTodayOverride('2026-10-04', '2026-10-04', '2026-10-04', '2026-10-05')).toBeNull()
    expect(browserTodayOverride(null, '2026-10-04', '2026-10-03', '2026-10-05')).toBeNull()
    expect(browserTodayOverride(null, '2026-10-04', '2026-10-04', '2026-10-04')).toBeNull()
  })

  it('seeds from an IANA hint and falls back to the runtime zone', () => {
    const now = new Date('2026-10-04T22:00:00Z')
    expect(resolveScheduleSeed('Europe/Moscow', null, now)).toEqual({
      date: '2026-10-05',
      today: '2026-10-05',
      offsetMinutes: -180,
      timeZone: 'Europe/Moscow'
    })
    expect(resolveScheduleSeed('Europe/Moscow', '2026-10-04', now)).toMatchObject({
      date: '2026-10-04',
      today: '2026-10-05',
      offsetMinutes: -180,
      timeZone: 'Europe/Moscow'
    })

    const fallback = resolveScheduleSeed('Not/AZone', null, now)
    expect(fallback.date).toBe(formatDateKey(now))
    expect(fallback.today).toBe(formatDateKey(now))
    expect(fallback.offsetMinutes).toBe(getOffsetMinutesForDate(fallback.date))
    expect(fallback.timeZone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone)
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
