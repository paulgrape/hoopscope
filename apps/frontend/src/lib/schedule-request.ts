import {type ScheduleSeed, resolveScheduleSeed} from '@/lib/games-api'
import {headers} from 'next/headers'

/** Schedule day for this request. The IP timezone header is a hint; the browser still reconciles. */
export async function readScheduleSeed(explicitDate?: string | null): Promise<ScheduleSeed> {
  const requestHeaders = await headers()
  return resolveScheduleSeed(requestHeaders.get('x-vercel-ip-timezone'), explicitDate)
}
