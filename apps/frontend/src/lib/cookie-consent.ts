export const COOKIE_CONSENT_NAME = 'hoopscope-cookie-consent'

export type ConsentChoice = 'granted' | 'denied'

export type ConsentModeState = {
  analytics_storage: ConsentChoice
  ad_storage: ConsentChoice
  ad_user_data: ConsentChoice
  ad_personalization: ConsentChoice
}

export function getConsentModeState(choice: ConsentChoice): ConsentModeState {
  const value = choice === 'granted' ? 'granted' : 'denied'

  return {
    analytics_storage: value,
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value
  }
}

export function getConsentFromCookie(): ConsentChoice | null {
  if (typeof document === 'undefined') {
    return null
  }

  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${COOKIE_CONSENT_NAME}=`))
  const value = match?.split('=')[1]

  if (value === 'granted' || value === 'denied') {
    return value
  }

  return null
}

export function setConsentCookie(choice: ConsentChoice): void {
  const maxAge = 60 * 60 * 24 * 365

  document.cookie = `${COOKIE_CONSENT_NAME}=${choice}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function updateConsent(choice: ConsentChoice): void {
  window.gtag?.('consent', 'update', getConsentModeState(choice))
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}
