import {ThemeProvider} from '@/components/theme-provider'
import {rootMetadata} from '@/lib/site'
import {Fraunces, IBM_Plex_Mono, Urbanist} from 'next/font/google'
import './globals.css'

const urbanist = Urbanist({
  variable: '--font-urbanist',
  subsets: ['latin']
})

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin']
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  weight: ['400', '500', '600'],
  subsets: ['latin']
})

export const metadata = rootMetadata

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='en'
      className={`${urbanist.variable} ${fraunces.variable} ${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta
          name='apple-mobile-web-app-title'
          content='Hoopscope'
        />
      </head>
      <body className='flex min-h-full flex-col'>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          // disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
