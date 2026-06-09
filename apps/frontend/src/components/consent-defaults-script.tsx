import {isAnalyticsEnabled} from '@/lib/analytics'

const consentDefaultsScript = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'wait_for_update': 500
});
`

export function ConsentDefaultsScript() {
  if (!isAnalyticsEnabled()) {
    return null
  }

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: consentDefaultsScript
      }}
    />
  )
}
