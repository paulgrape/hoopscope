import type {NewsArticle} from '@/lib/news-api'
import {getNews} from '@/lib/news-api'
import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import NewsPage from '../page'

vi.mock('@/lib/news-api', () => ({
  getNews: vi.fn()
}))

vi.mock('@/components/seo/json-ld', () => ({
  JsonLd: () => null
}))

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
    headline: 'Jokić posts another triple-double',
    description: 'Denver rolls at home.',
    published: '2026-04-01T12:00:00Z',
    imageUrl: null,
    imageCaption: null,
    url: 'https://espn.com/story',
    byline: 'ESPN',
    teams: ['DEN'],
    ...overrides
  }
}

describe('NewsPage', () => {
  beforeEach(() => {
    vi.mocked(getNews).mockReset()
  })

  it('renders the broadsheet with the RSS link and a next-page link', async () => {
    vi.mocked(getNews).mockResolvedValue({total: 30, articles: [makeArticle()]})

    render(await NewsPage({searchParams: Promise.resolve({})}))

    expect(getNews).toHaveBeenCalledWith(12, 0)
    expect(screen.getByRole('heading', {level: 1, name: 'NBA News'})).toBeInTheDocument()
    expect(screen.getByText('Jokić posts another triple-double')).toBeInTheDocument()
    expect(screen.getByRole('link', {name: /Subscribe to the RSS feed/}).getAttribute('href')).toContain('/feed.xml')
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('link', {name: /Earlier/})).toHaveAttribute('href', '/news?page=2')
  })

  it('paginates within /news', async () => {
    vi.mocked(getNews).mockResolvedValue({total: 40, articles: [makeArticle()]})

    render(await NewsPage({searchParams: Promise.resolve({page: '3'})}))

    expect(getNews).toHaveBeenCalledWith(12, 24)
    expect(screen.getByRole('link', {name: /Newer/})).toHaveAttribute('href', '/news?page=2')
    expect(screen.getByRole('link', {name: /Earlier/})).toHaveAttribute('href', '/news?page=4')
  })

  it('links back to the first page without a query parameter', async () => {
    vi.mocked(getNews).mockResolvedValue({total: 24, articles: [makeArticle()]})

    render(await NewsPage({searchParams: Promise.resolve({page: '2'})}))

    expect(screen.getByRole('link', {name: /Newer/})).toHaveAttribute('href', '/news')
  })
})
