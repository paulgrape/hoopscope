import {NotFoundContent} from '@/components/not-found-content'
import {createPageMetadata} from '@/lib/site'
import type {Metadata} from 'next'

export const metadata: Metadata = createPageMetadata({
  title: 'Page not found',
  description: 'The page you requested could not be found.',
  path: '/404',
  noIndex: true,
})

export default function HubNotFound() {
  return <NotFoundContent />
}
