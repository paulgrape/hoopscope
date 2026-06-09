import {getGtmId, isAnalyticsEnabled} from '@/lib/analytics'
import {GoogleTagManager} from '@next/third-parties/google'

export function GoogleTagManagerScript() {
  const gtmId = getGtmId()

  if (!isAnalyticsEnabled() || !gtmId) {
    return null
  }

  return <GoogleTagManager gtmId={gtmId} />
}
