import {DATA_SOURCE_NAME, DATA_SOURCE_URL, SITE_NAME, SITE_TAGLINE, absoluteUrl} from '@/lib/site'
import {Rss} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const MAINTAINER_URL = 'https://github.com/paulgrape'

type FooterLink = {
  href: string
  label: string
  external?: boolean
}

const footerLinks: FooterLink[] = [
  {href: '/match-center', label: 'Match Center'},
  {href: '/historic-games', label: 'Historic Games'},
  {href: '/teams', label: 'Teams'},
  {href: '/standings', label: 'Standings'},
  {href: '/about', label: 'About'},
  {href: '/privacy', label: 'Privacy Policy'},
  {href: MAINTAINER_URL, label: 'GitHub', external: true}
]

const linkClassName = 'text-muted-foreground hover:text-foreground text-sm transition-colors duration-200'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className='bg-card text-card-foreground mt-auto w-full border-t'>
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-7'>
        <div className='flex flex-col gap-5 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-col gap-1.5'>
            <Link
              href='/'
              className='text-foreground group hover:text-foreground/80 flex w-fit items-center gap-2 font-semibold transition-colors duration-200'
            >
              <Image
                src='/icon1.png'
                alt=''
                aria-hidden
                width={32}
                height={32}
                className='h-8 w-8 shrink-0 rounded-full object-contain transition-opacity duration-200 group-hover:opacity-80'
              />
              {SITE_NAME}
            </Link>
            <p className='text-muted-foreground text-sm'>{SITE_TAGLINE}</p>
          </div>

          <nav aria-label='Footer'>
            <ul className='flex flex-wrap gap-x-5 gap-y-2 md:justify-end'>
              {footerLinks.map(link => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={linkClassName}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className={linkClassName}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
              <li>
                <a
                  href={absoluteUrl('/feed.xml')}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={`${linkClassName} flex items-center gap-1.5`}
                >
                  <Rss
                    className='size-3.5'
                    aria-hidden
                  />
                  RSS
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className='border-border text-muted-foreground flex flex-col gap-1.5 border-t pt-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
          <p>
            &copy; {year} {SITE_NAME} — an independent fan project, not affiliated with the NBA or {DATA_SOURCE_NAME}.
          </p>
          <p className='shrink-0'>
            Data by{' '}
            <a
              href={DATA_SOURCE_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='text-foreground underline-offset-4 hover:underline'
            >
              {DATA_SOURCE_NAME}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
