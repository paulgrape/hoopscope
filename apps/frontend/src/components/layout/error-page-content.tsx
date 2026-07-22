'use client'

import {StatusPage} from '@/components/layout/status-page'
import {Button, buttonVariants} from '@/components/ui/button'
import {cn} from '@/lib/utils'
import {CircleAlert} from 'lucide-react'
import Link from 'next/link'
import {useEffect} from 'react'

type ErrorPageContentProps = {
  error: Error & {digest?: string}
  reset: () => void
}

export function ErrorPageContent({error, reset}: ErrorPageContentProps) {
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <StatusPage
      code='Error'
      title='Something went wrong'
      description='We hit a snag loading this page. Try again, or head back home while we get things back on track.'
      icon={CircleAlert}
      details={isDev ? error.message : undefined}
      actions={
        <>
          <Button onClick={reset}>Try again</Button>
          <Link
            href='/'
            className={cn(buttonVariants({variant: 'outline'}))}
          >
            Back to home
          </Link>
        </>
      }
    />
  )
}
