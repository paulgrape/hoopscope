import {NewsStrip} from '@/components/news/news-strip'
import type {NewsArticle} from '@/lib/news-api'
import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

vi.mock('next/image', () => ({
  default: ({alt, src}: {alt: string; src: string}) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={src}
    />
  )
}))

function makeArticle(overrides: Partial<NewsArticle> = {}): NewsArticle {
  return {
    id: 1,
    type: 'Story',
    headline: 'Wembanyama blocks six in a rout',
    description: 'San Antonio cruises.',
    published: '2026-04-01T12:00:00Z',
    imageUrl: 'https://image/story.jpg',
    imageCaption: null,
    url: 'https://espn.com/story',
    byline: 'ESPN',
    teams: ['SAS'],
    ...overrides
  }
}

describe('NewsStrip', () => {
  it('links headlines out to the source in a new tab', () => {
    render(<NewsStrip articles={[makeArticle()]} />)

    const link = screen.getByRole('link', {name: /Wembanyama blocks six/})
    expect(link).toHaveAttribute('href', 'https://espn.com/story')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('heading', {level: 3, name: /Wembanyama blocks six/})).toBeInTheDocument()
  })

  it('renders headlines without a source link as plain cards', () => {
    render(<NewsStrip articles={[makeArticle({id: 2, url: null, headline: 'No link here'})]} />)

    expect(screen.getByRole('heading', {level: 3, name: 'No link here'})).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('explains when there are no headlines', () => {
    render(<NewsStrip articles={[]} />)

    expect(screen.getByText('No NBA headlines available right now.')).toBeInTheDocument()
  })
})
