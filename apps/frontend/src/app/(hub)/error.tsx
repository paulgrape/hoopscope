'use client'

import {ErrorPageContent} from '@/components/error-page-content'

type HubErrorProps = {
  error: Error & {digest?: string}
  reset: () => void
}

export default function HubError({error, reset}: HubErrorProps) {
  return <ErrorPageContent error={error} reset={reset} />
}
