'use client'

import {useEffect} from 'react'

import './globals.css'

type GlobalErrorProps = {
  error: Error & {digest?: string}
  reset: () => void
}

export default function GlobalError({error, reset}: GlobalErrorProps) {
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang='en'>
      <body className='bg-background text-foreground flex min-h-full flex-col antialiased'>
        <main className='mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12'>
          <div className='border-border bg-card rounded-xl border p-6 text-center sm:p-8'>
            <p className='text-muted-foreground text-sm font-medium tracking-wider uppercase'>Error</p>
            <h1 className='mt-2 text-2xl font-semibold'>Something went wrong</h1>
            <p className='text-muted-foreground mt-2 text-sm sm:text-base'>
              The app ran into a problem. Try again, or return home.
            </p>
            {isDev ? (
              <p className='text-muted-foreground mt-3 font-mono text-xs wrap-break-word'>{error.message}</p>
            ) : null}
            <div className='mt-6 flex flex-wrap items-center justify-center gap-3'>
              <button
                type='button'
                onClick={reset}
                className='bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition-colors'
              >
                Try again
              </button>
              <a
                href='/'
                className='border-border bg-background hover:bg-muted inline-flex h-8 items-center justify-center rounded-lg border px-2.5 text-sm font-medium transition-colors'
              >
                Back to home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
