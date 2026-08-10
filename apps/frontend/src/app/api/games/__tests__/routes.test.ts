import {NextRequest} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/backend-proxy', () => ({
  proxyBackendGet: vi.fn()
}))

import {proxyBackendGet} from '@/lib/backend-proxy'
import {GET as getGame} from '../[gameId]/route'
import {GET as getNearest} from '../schedule/nearest/route'
import {GET as getSchedule} from '../schedule/route'

describe('/api/games route handlers', () => {
  beforeEach(() => {
    vi.mocked(proxyBackendGet).mockReset()
    vi.mocked(proxyBackendGet).mockResolvedValue(new Response('{"ok":true}') as never)
  })

  it('proxies game summary by id', async () => {
    const request = new NextRequest('http://localhost/api/games/abc%201')

    await getGame(request, {params: Promise.resolve({gameId: 'abc 1'})})

    expect(proxyBackendGet).toHaveBeenCalledWith('/games/abc%201')
  })

  it('proxies the schedule query string', async () => {
    const request = new NextRequest('http://localhost/api/games/schedule?date=2026-01-15&offsetMinutes=-300')

    await getSchedule(request)

    expect(proxyBackendGet).toHaveBeenCalledWith('/games/schedule', request)
  })

  it('proxies the nearest schedule query string', async () => {
    const request = new NextRequest(
      'http://localhost/api/games/schedule/nearest?date=2026-01-15&offsetMinutes=-300&direction=before'
    )

    await getNearest(request)

    expect(proxyBackendGet).toHaveBeenCalledWith('/games/schedule/nearest', request)
  })
})
