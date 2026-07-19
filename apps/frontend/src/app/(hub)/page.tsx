import {JsonLd} from '@/components/json-ld'
import {NewsNewspaper} from '@/components/news-newspaper'
import {getNews} from '@/lib/news-api'
import {collectionPageSchema} from '@/lib/seo-schema'
import {SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, createPageMetadata} from '@/lib/site'
import {Rss} from 'lucide-react'
import type {Metadata} from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  ...createPageMetadata({
    title: SITE_NAME,
    description: `${SITE_TAGLINE}. ${SITE_DESCRIPTION}`,
    path: '/'
  }),
  title: {
    absolute: SITE_NAME
  }
}

const PAGE_SIZE = 12

type HomeProps = {
  searchParams: Promise<{
    page?: string
  }>
}

function parsePage(value: string | undefined) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

export default async function Home({searchParams}: HomeProps) {
  const {page: pageParam} = await searchParams
  const page = parsePage(pageParam)

  const {articles, total} = await getNews(PAGE_SIZE, (page - 1) * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'
    >
      <JsonLd
        data={collectionPageSchema({
          path: '/',
          title: SITE_NAME,
          description: `${SITE_TAGLINE}. ${SITE_DESCRIPTION}`,
          items: articles.slice(0, 8).map(article => ({
            name: article.headline,
            url: article.url ?? '/'
          }))
        })}
      />
      <header className='flex items-start justify-between gap-4'>
        <div className='flex flex-col gap-2'>
          <p className='text-muted-foreground text-sm tracking-wider uppercase'>Welcome</p>
          <h1 className='text-2xl font-semibold sm:text-3xl'>{SITE_NAME}</h1>
          <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>
            {SITE_TAGLINE}. Your morning read on league headlines, pulled fresh from ESPN.
          </p>
        </div>
        <Link
          href='/feed.xml'
          aria-label='Subscribe to the RSS feed'
          title='Subscribe to the RSS feed'
          className='text-muted-foreground hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg border border-transparent transition-colors'
        >
          <Rss
            className='size-4'
            aria-hidden
          />
          <span className='sr-only'>Subscribe to the RSS feed</span>
        </Link>
      </header>

      <NewsNewspaper articles={articles} />

      <nav
        aria-label='News pagination'
        className='flex items-center justify-between gap-4 text-xs tracking-[0.2em] uppercase sm:text-sm'
      >
        {page > 1 ? (
          <Link
            href={page === 2 ? '/' : `/?page=${page - 1}`}
            className='text-foreground hover:text-muted-foreground transition-colors'
          >
            &larr; Newer
          </Link>
        ) : (
          <span
            aria-hidden
            className='text-muted-foreground/40 select-none'
          >
            &larr; Newer
          </span>
        )}

        <span className='text-muted-foreground'>
          Page {page} of {totalPages}
        </span>

        {page < totalPages ? (
          <Link
            href={`/?page=${page + 1}`}
            className='text-foreground hover:text-muted-foreground transition-colors'
          >
            Earlier &rarr;
          </Link>
        ) : (
          <span
            aria-hidden
            className='text-muted-foreground/40 select-none'
          >
            Earlier &rarr;
          </span>
        )}
      </nav>
    </main>
  )
}
