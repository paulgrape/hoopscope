import {apiFetch} from '@/lib/api-client'
import {getTeamStats} from '@/lib/team-stats-api'
import {describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/api-client', () => ({apiFetch: vi.fn().mockResolvedValue({teams: []})}))

describe('getTeamStats', () => {
  it('allows a cold ESPN pull and revalidates every thirty minutes', async () => {
    await getTeamStats({season: 2026, seasonType: 'playoffs'})
    expect(apiFetch).toHaveBeenCalledWith('/team-stats?season=2026&seasonType=playoffs', {
      timeoutMs: 30_000,
      revalidate: 1800
    })
  })
})
