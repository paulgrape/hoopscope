import {proxyBackendGet} from '@/lib/backend-proxy'
import {NextRequest} from 'next/server'

export async function GET(request: NextRequest) {
  return proxyBackendGet('/games/schedule/nearest', request)
}
