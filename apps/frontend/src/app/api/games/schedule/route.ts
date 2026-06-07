import {NextRequest, NextResponse} from 'next/server'

const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export async function GET(request: NextRequest) {
  const backendUrl = new URL('/games/schedule', API_BASE_URL)

  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value)
  })

  const response = await fetch(backendUrl, {
    cache: 'no-store'
  })
  const body = await response.text()

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json'
    }
  })
}
