import {JsonLd} from '@/components/json-ld'
import {webPageSchema} from '@/lib/seo-schema'
import {createPageMetadata, SITE_NAME} from '@/lib/site'

export const metadata = createPageMetadata({
  title: 'Privacy Policy',
  description: `How ${SITE_NAME} collects, uses, and protects your information.`,
  path: '/privacy',
  noIndex: true,
})

const LAST_UPDATED = 'June 9, 2026'

export default function PrivacyPage() {
  return (
    <main className='mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-5 sm:px-6 sm:py-8'>
      <JsonLd
        data={webPageSchema({
          path: '/privacy',
          title: 'Privacy Policy',
          description: `How ${SITE_NAME} collects, uses, and protects your information.`,
        })}
      />
      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm uppercase tracking-wider'>Legal</p>
        <h1 className='text-2xl font-semibold sm:text-3xl'>Privacy Policy</h1>
        <p className='text-muted-foreground text-sm'>Last updated: {LAST_UPDATED}</p>
      </header>

      <div className='text-muted-foreground flex flex-col gap-6 text-sm leading-relaxed sm:text-base'>
        <section className='flex flex-col gap-2'>
          <h2 className='text-foreground text-lg font-medium'>Overview</h2>
          <p>
            {SITE_NAME} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates a basketball
            information website. This Privacy Policy explains what information we collect, how we
            use it, and the choices you have when you visit our site.
          </p>
        </section>

        <section className='flex flex-col gap-2'>
          <h2 className='text-foreground text-lg font-medium'>Information we collect</h2>
          <p>
            When you use {SITE_NAME}, we may collect usage information such as pages visited,
            approximate location derived from your IP address, browser type, device type, and
            referral source. This data helps us understand how the site is used and improve the
            experience.
          </p>
          <p>
            We do not ask you to create an account on {SITE_NAME}, and we do not intentionally
            collect personal identifiers such as your name or email address through normal site
            browsing.
          </p>
        </section>

        <section className='flex flex-col gap-2'>
          <h2 className='text-foreground text-lg font-medium'>Cookies and similar technologies</h2>
          <p>
            We use cookies and similar storage technologies to remember your cookie preferences and,
            if you accept, to measure site usage through analytics tools.
          </p>
          <ul className='list-disc space-y-1 pl-5'>
            <li>
              <span className='text-foreground font-medium'>Essential cookies</span> — required to
              remember your cookie consent choice.
            </li>
            <li>
              <span className='text-foreground font-medium'>Analytics cookies</span> — used only if
              you click &quot;Accept all&quot; on our cookie banner. These help us understand
              traffic and page performance.
            </li>
          </ul>
        </section>

        <section className='flex flex-col gap-2'>
          <h2 className='text-foreground text-lg font-medium'>Third-party services</h2>
          <p>
            We use Google Tag Manager to manage analytics tags on our site. Depending on your
            consent, Google Tag Manager may load Google Analytics or other measurement tools
            configured in our tag container.
          </p>
          <p>
            Google may process information according to its own privacy policies. You can learn more
            at{' '}
            <a
              href='https://policies.google.com/privacy'
              className='text-foreground underline-offset-4 hover:underline'
              target='_blank'
              rel='noopener noreferrer'
            >
              Google&apos;s Privacy Policy
            </a>
            .
          </p>
        </section>

        <section className='flex flex-col gap-2'>
          <h2 className='text-foreground text-lg font-medium'>Your choices</h2>
          <p>
            When you first visit {SITE_NAME} in production, a cookie banner lets you accept or
            reject non-essential cookies. You can change your mind by clearing site cookies in your
            browser and revisiting the site to make a new choice.
          </p>
          <p>
            If you reject non-essential cookies, analytics storage remains disabled and we do not
            enable analytics cookies through Google Consent Mode.
          </p>
        </section>

        <section className='flex flex-col gap-2'>
          <h2 className='text-foreground text-lg font-medium'>Data retention</h2>
          <p>
            Your cookie consent preference is stored in a browser cookie for up to one year.
            Analytics data retention is governed by the settings in our Google Analytics and Google
            Tag Manager configuration.
          </p>
        </section>

        <section className='flex flex-col gap-2'>
          <h2 className='text-foreground text-lg font-medium'>Contact</h2>
          <p>
            If you have questions about this Privacy Policy or how {SITE_NAME} handles data, contact
            us through the project maintainer listed for this website.
          </p>
        </section>
      </div>
    </main>
  )
}
