'use client'

import {Button} from '@/components/ui/button'
import {
  getConsentFromCookie,
  setConsentCookie,
  updateConsent,
  type ConsentChoice
} from '@/lib/cookie-consent'
import Link from 'next/link'
import {useEffect, useRef, useState} from 'react'

type CookieConsentBannerProps = {
  enabled: boolean
}

function applyConsent(choice: ConsentChoice) {
  updateConsent(choice)
  setConsentCookie(choice)
}

export function CookieConsentBannerClient({enabled}: CookieConsentBannerProps) {
  const savedChoice = getConsentFromCookie()
  const [hasChosen, setHasChosen] = useState(savedChoice !== null)
  const bannerRef = useRef<HTMLDivElement>(null)
  const isVisible = enabled && !hasChosen

  useEffect(() => {
    if (savedChoice) {
      applyConsent(savedChoice)
    }
  }, [savedChoice])

  useEffect(() => {
    if (!isVisible) {
      document.body.style.removeProperty('padding-bottom')
      return
    }

    const banner = bannerRef.current

    if (!banner) {
      return
    }

    const updateBodyPadding = () => {
      document.body.style.paddingBottom = `${banner.offsetHeight}px`
    }

    updateBodyPadding()

    const resizeObserver = new ResizeObserver(updateBodyPadding)
    resizeObserver.observe(banner)

    return () => {
      resizeObserver.disconnect()
      document.body.style.removeProperty('padding-bottom')
    }
  }, [isVisible])

  if (!isVisible) {
    return null
  }

  const handleChoice = (choice: ConsentChoice) => {
    applyConsent(choice)
    setHasChosen(true)
  }

  return (
    <div
      ref={bannerRef}
      role='dialog'
      aria-label='Cookie consent'
      className='border-border bg-background/95 fixed inset-x-0 bottom-0 z-50 border-t p-4 shadow-lg backdrop-blur-sm sm:p-6'
    >
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-muted-foreground text-sm leading-relaxed'>
          We use cookies and similar technologies to understand how you use Hoopscope.
          Analytics cookies are only enabled if you accept. Read our{' '}
          <Link
            href='/privacy'
            className='text-foreground underline-offset-4 hover:underline'
          >
            Privacy Policy
          </Link>{' '}
          for details.
        </p>
        <div className='flex shrink-0 flex-wrap gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleChoice('denied')}
          >
            Reject non-essential
          </Button>
          <Button
            size='sm'
            onClick={() => handleChoice('granted')}
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  )
}
