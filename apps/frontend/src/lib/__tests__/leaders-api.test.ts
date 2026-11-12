import {apiFetch} from '@/lib/api-client'
import {getLeaders} from '@/lib/leaders-api'
import {describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/api-client', () => ({apiFetch: vi.fn().mockResolvedValue({categories: []})}))

describe('getLeaders', () => {
  it('allows a cold ESPN pull and revalidates every thirty minutes', async () => {
    await getLeaders({season: 2026, seasonType: 'playoffs', stat: 'threePointPct', limit: 50})
    expect(apiFetch).toHaveBeenCalledWith('/leaders?season=2026&seasonType=playoffs&stat=threePointPct&limit=50', {
      timeoutMs: 30_000,
      revalidate: 1800
    })
  })
})
