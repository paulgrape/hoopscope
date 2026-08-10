import {Navbar} from '@/components/layout/navbar'
import {SiteFooter} from '@/components/layout/site-footer'

export default function HubLayout({children}: {children: React.ReactNode}) {
  return (
    <div className='flex w-full min-w-0 flex-1 flex-col items-center'>
      <a
        href='#main-content'
        className='bg-primary text-primary-foreground focus-visible:ring-ring sr-only z-50 rounded-md px-4 py-2 text-sm font-medium focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:ring-3 focus-visible:outline-none'
      >
        Skip to main content
      </a>
      <Navbar />
      {children}
      <SiteFooter />
    </div>
  )
}
