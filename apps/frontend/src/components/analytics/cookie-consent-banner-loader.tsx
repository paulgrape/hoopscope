'use client'

import dynamic from 'next/dynamic'

const CookieConsentBannerClient = dynamic(
  () => import('@/components/analytics/cookie-consent-banner').then(module => module.CookieConsentBannerClient),
  {ssr: false}
)

type CookieConsentBannerProps = {
  enabled: boolean
}

export function CookieConsentBanner({enabled}: CookieConsentBannerProps) {
  return <CookieConsentBannerClient enabled={enabled} />
}
