import {NextRequest, NextResponse} from 'next/server'

const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

type RouteContext = {
  params: Promise<{gameId: string}>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const {gameId} = await context.params
  const backendUrl = new URL(`/games/${encodeURIComponent(gameId)}`, API_BASE_URL)

  const response = await fetch(backendUrl, {
    cache: 'no-store',
  })
  const body = await response.text()

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  })
}
