'use client'

import {Button} from '@/components/ui/button'
import {SITE_NAME} from '@/lib/site'
import {cn} from '@/lib/utils'
import {Menu, Moon, Sun, X} from 'lucide-react'
import {useTheme} from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useEffect, useRef, useState} from 'react'

const navLinks = [
  {href: '/', label: 'Home'},
  {href: '/match-center', label: 'Match Center'},
  {href: '/historic-games', label: 'Historic Games'},
  {href: '/teams', label: 'Teams'},
  {href: '/standings', label: 'Standings'},
  {href: '/about', label: 'About'},
  {href: '/privacy', label: 'Privacy Policy'}
]

const isActivePath = (pathname: string, href: string) =>
  href === '/' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeIndicator, setActiveIndicator] = useState<{left: number; width: number} | null>(null)
  const pathname = usePathname()
  const desktopNavRef = useRef<HTMLDivElement>(null)
  const desktopLinkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const {resolvedTheme, setTheme} = useTheme()
  const activeHref = navLinks.find(link => isActivePath(pathname, link.href))?.href ?? '/'

  useEffect(() => {
    const updateIndicator = () => {
      const activeLink = desktopLinkRefs.current[activeHref]
      const nav = desktopNavRef.current

      if (!activeLink || !nav) {
        setActiveIndicator(null)
        return
      }

      const linkRect = activeLink.getBoundingClientRect()
      const navRect = nav.getBoundingClientRect()

      setActiveIndicator({
        left: linkRect.left - navRect.left,
        width: linkRect.width
      })
    }

    updateIndicator()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateIndicator)
      return () => window.removeEventListener('resize', updateIndicator)
    }

    const resizeObserver = new ResizeObserver(updateIndicator)

    if (desktopNavRef.current) {
      resizeObserver.observe(desktopNavRef.current)
    }

    for (const link of Object.values(desktopLinkRefs.current)) {
      if (link) {
        resizeObserver.observe(link)
      }
    }

    return () => resizeObserver.disconnect()
  }, [activeHref])

  return (
    <nav className='bg-card text-card-foreground sticky top-0 z-20 w-full border-b'>
      <div className='mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6'>
        <Link
          href='/'
          className='text-foreground group hover:text-foreground/80 flex shrink-0 items-center gap-2 font-semibold transition-all duration-200'
          onClick={() => setIsMenuOpen(false)}
        >
          <Image
            src='/icon1.png'
            alt='Hoopscope logo'
            width={36}
            height={36}
            className='h-9 w-9 shrink-0 rounded-full object-contain transition-all duration-200 group-hover:opacity-80'
          />
          {SITE_NAME}
        </Link>

        <div
          ref={desktopNavRef}
          className='relative hidden items-center gap-6 md:flex'
        >
          {navLinks.map(link => (
            <Link
              key={link.href}
              ref={node => {
                desktopLinkRefs.current[link.href] = node
              }}
              className={cn(
                'relative z-10 py-4 text-sm whitespace-nowrap transition-colors duration-200',
                activeHref === link.href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
          <span
            aria-hidden='true'
            className='bg-primary absolute bottom-2 h-0.5 rounded-full transition-all duration-300 ease-out'
            style={{
              opacity: activeIndicator ? 1 : 0,
              transform: `translateX(${activeIndicator?.left ?? 0}px)`,
              width: activeIndicator?.width ?? 0
            }}
          />
        </div>

        <div className='flex shrink-0 items-center gap-1'>
          <Button
            variant='ghost'
            size='icon'
            className='relative cursor-pointer'
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label='Toggle theme'
          >
            <Sun className='h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
            <Moon className='absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='cursor-pointer md:hidden'
            onClick={() => setIsMenuOpen(isOpen => !isOpen)}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            aria-controls='mobile-navigation'
          >
            {isMenuOpen ? <X className='h-4 w-4' /> : <Menu className='h-4 w-4' />}
          </Button>
        </div>
      </div>

      <div
        id='mobile-navigation'
        className={cn(
          'grid overflow-hidden border-t transition-[grid-template-rows] duration-300 ease-out md:hidden',
          isMenuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
        aria-hidden={!isMenuOpen}
      >
        <div className='min-h-0 overflow-hidden'>
          <div className='mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-3'>
            {navLinks.map(link => (
              <Link
                key={link.href}
                className={cn(
                  'rounded-md px-2 py-2 text-sm transition-colors duration-200',
                  activeHref === link.href
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                tabIndex={isMenuOpen ? undefined : -1}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
