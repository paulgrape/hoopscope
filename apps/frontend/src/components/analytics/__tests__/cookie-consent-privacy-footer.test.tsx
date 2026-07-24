import {CookieConsentPrivacyFooter} from '@/components/analytics/cookie-consent-privacy-footer'
import {COOKIE_CONSENT_NAME} from '@/lib/cookie-consent'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, describe, expect, it} from 'vitest'

function setConsentCookie(value: string) {
  document.cookie = `${COOKIE_CONSENT_NAME}=${value}; path=/`
}

function clearConsentCookie() {
  document.cookie = `${COOKIE_CONSENT_NAME}=; path=/; max-age=0`
}

describe('CookieConsentPrivacyFooter', () => {
  afterEach(clearConsentCookie)

  it('renders nothing when no consent choice was made', () => {
    const {container} = render(<CookieConsentPrivacyFooter />)
    expect(container).toBeEmptyDOMElement()
  })

  it('offers to retract consent when granted', () => {
    setConsentCookie('granted')
    render(<CookieConsentPrivacyFooter />)

    expect(screen.getByText(/accepted all cookies/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /retract consent/i})).toBeInTheDocument()
  })

  it('offers to accept when consent was denied', () => {
    setConsentCookie('denied')
    render(<CookieConsentPrivacyFooter />)

    expect(screen.getByText(/rejected non-essential cookies/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /accept all/i})).toBeInTheDocument()
  })

  it('updates live when the user accepts', async () => {
    setConsentCookie('denied')
    render(<CookieConsentPrivacyFooter />)

    await userEvent.click(screen.getByRole('button', {name: /accept all/i}))

    expect(screen.getByText(/accepted all cookies/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /retract consent/i})).toBeInTheDocument()
  })
})
