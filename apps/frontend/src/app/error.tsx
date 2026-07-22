'use client'

import {ErrorPageContent} from '@/components/layout/error-page-content'
import {Navbar} from '@/components/layout/navbar'

type ErrorProps = {
  error: Error & {digest?: string}
  reset: () => void
}

export default function Error({error, reset}: ErrorProps) {
  return (
    <div className='flex flex-col items-center justify-center'>
      <Navbar />
      <ErrorPageContent
        error={error}
        reset={reset}
      />
    </div>
  )
}
