import {getGaMeasurementId} from '@/lib/analytics'
import {GoogleAnalytics} from '@next/third-parties/google'

export function GoogleAnalyticsScript() {
  const gaId = getGaMeasurementId()

  if (process.env.NODE_ENV !== 'production' || !gaId) {
    return null
  }

  return <GoogleAnalytics gaId={gaId} />
}
