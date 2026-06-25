import {FileQuestion} from 'lucide-react'
import Link from 'next/link'

import {StatusPage} from '@/components/status-page'
import {buttonVariants} from '@/components/ui/button'
import {cn} from '@/lib/utils'

export function NotFoundContent() {
  return (
    <StatusPage
      code='404'
      title='Page not found'
      description='That page is not on the Hoopscope floor. Head back home or open Match Center to keep browsing the league.'
      icon={FileQuestion}
      actions={
        <>
          <Link
            href='/'
            className={cn(buttonVariants())}
          >
            Back to home
          </Link>
          <Link
            href='/match-center'
            className={cn(buttonVariants({variant: 'outline'}))}
          >
            Match Center
          </Link>
        </>
      }
    />
  )
}
