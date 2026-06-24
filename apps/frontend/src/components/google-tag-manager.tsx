import {getGtmId} from '@/lib/analytics'
import {GoogleTagManager} from '@next/third-parties/google'

export function GoogleTagManagerScript() {
  const gtmId = getGtmId()

  if (process.env.NODE_ENV !== 'production' || !gtmId) {
    return null
  }

  return <GoogleTagManager gtmId={gtmId} />
}
