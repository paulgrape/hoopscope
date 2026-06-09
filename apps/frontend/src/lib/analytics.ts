const gtmId = process.env.GTM_ID

export function isAnalyticsEnabled(): boolean {
  return process.env.NODE_ENV === 'production' && Boolean(gtmId)
}

export function getGtmId(): string | undefined {
  return gtmId
}
