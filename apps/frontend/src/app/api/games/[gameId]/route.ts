import {proxyBackendGet} from '@/lib/backend-proxy'
import {NextRequest} from 'next/server'

type RouteContext = {
  params: Promise<{gameId: string}>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const {gameId} = await context.params
  return proxyBackendGet(`/games/${encodeURIComponent(gameId)}`)
}
