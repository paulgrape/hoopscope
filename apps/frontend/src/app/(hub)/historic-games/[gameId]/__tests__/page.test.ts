import {beforeEach, describe, expect, it, vi} from 'vitest'

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})

vi.mock('next/navigation', () => ({
  notFound: () => notFound()
}))

vi.mock('@/lib/games-api', () => ({
  SOCKET_BASE_URL: 'http://localhost:3000',
  getHistoricGame: vi.fn()
}))

vi.mock('@/components/match/historic-game-simulator', () => ({
  HistoricGameSimulator: () => null
}))

vi.mock('@/components/seo/json-ld', () => ({
  JsonLd: () => null
}))

import HistoricGamePage from '../page'
import {getHistoricGame} from '@/lib/games-api'

describe('HistoricGamePage', () => {
  beforeEach(() => {
    notFound.mockClear()
    vi.mocked(getHistoricGame).mockReset()
  })

  it('calls notFound when the historic game is missing', async () => {
    vi.mocked(getHistoricGame).mockResolvedValue(null)

    await expect(HistoricGamePage({params: Promise.resolve({gameId: 'missing'})})).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalledTimes(1)
    expect(getHistoricGame).toHaveBeenCalledWith('missing')
  })
})
