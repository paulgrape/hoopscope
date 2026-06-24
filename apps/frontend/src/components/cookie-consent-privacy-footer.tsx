'use client'

import {Button} from '@/components/ui/button'
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  getConsentFromCookie,
  grantConsent,
  retractConsent,
  type ConsentChoice
} from '@/lib/cookie-consent'
import {cn} from '@/lib/utils'
import {useEffect, useState} from 'react'

export function CookieConsentPrivacyFooter() {
  const [consent, setConsent] = useState<ConsentChoice | null>(null)

  useEffect(() => {
    setConsent(getConsentFromCookie())

    const syncConsent = () => {
      setConsent(getConsentFromCookie())
    }

    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncConsent)
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncConsent)
  }, [])

  if (!consent) {
    return null
  }

  const isGranted = consent === 'granted'

  return (
    <footer className='border-border flex flex-col gap-2 border-t pt-6 sm:flex-row sm:items-center sm:justify-between'>
      <p
        className={cn(
          'text-xs sm:text-sm',
          isGranted ? 'text-muted-foreground' : 'text-foreground'
        )}
      >
        {isGranted
          ? 'You have accepted all cookies.'
          : 'You previously rejected non-essential cookies. Changed your mind?'}
      </p>
      <Button
        variant={isGranted ? 'ghost' : 'default'}
        size='sm'
        onClick={isGranted ? retractConsent : grantConsent}
      >
        {isGranted ? 'Retract consent' : 'Accept all'}
      </Button>
    </footer>
  )
}
