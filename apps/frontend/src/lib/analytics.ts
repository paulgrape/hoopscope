const gtmId = process.env.GTM_ID
const gaMeasurementId = process.env.GA_MEASUREMENT_ID

export function isAnalyticsEnabled(): boolean {
  return process.env.NODE_ENV === 'production' && Boolean(gtmId || gaMeasurementId)
}

export function isCookieConsentEnabled(): boolean {
  return process.env.NODE_ENV === 'development' || isAnalyticsEnabled()
}

export function getGtmId(): string | undefined {
  return gtmId
}

export function getGaMeasurementId(): string | undefined {
  return gaMeasurementId
}
