import {API_BASE_URL} from '@/lib/api-client'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Shared GET proxy for `/api/*` route handlers: forwards the request's query
 * string to the backend and mirrors status + content type back to the client.
 */
export async function proxyBackendGet(path: string, request?: NextRequest): Promise<NextResponse> {
  const backendUrl = new URL(path, API_BASE_URL)

  request?.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value)
  })

  const response = await fetch(backendUrl, {cache: 'no-store'})
  const body = await response.text()

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json'
    }
  })
}
