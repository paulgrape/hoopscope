import {NewsNewspaper} from '@/components/news/news-newspaper'
import {JsonLd} from '@/components/seo/json-ld'
import {getNews} from '@/lib/news-api'
import {collectionPageSchema} from '@/lib/seo-schema'
import {SITE_DAILY_TITLE, absoluteUrl, createPageMetadata} from '@/lib/site'
import {Rss} from 'lucide-react'
import Link from 'next/link'

const NEWS_DESCRIPTION =
  'Pro basketball headlines laid out as a daily broadsheet, pulled fresh from ESPN with an RSS feed for subscribers.'

export const metadata = createPageMetadata({
  title: 'NBA News - Daily Headlines',
  description: NEWS_DESCRIPTION,
  path: '/news'
})

const PAGE_SIZE = 12

type NewsPageProps = {
  searchParams: Promise<{
    page?: string
  }>
}

function parsePage(value: string | undefined) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

export default async function NewsPage({searchParams}: NewsPageProps) {
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
          path: '/news',
          title: SITE_DAILY_TITLE,
          description: NEWS_DESCRIPTION,
          items: articles.slice(0, 8).map(article => ({
            name: article.headline,
            url: article.url ?? '/news'
          }))
        })}
      />
      <header className='flex items-start justify-between gap-4'>
        <div className='flex flex-col gap-2'>
          <p className='text-muted-foreground text-sm tracking-wider uppercase'>Newsroom</p>
          <h1 className='text-2xl font-semibold sm:text-3xl'>NBA News</h1>
          <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>
            Your morning read on league headlines, pulled fresh from ESPN.
          </p>
        </div>
        <a
          href={absoluteUrl('/feed.xml')}
          target='_blank'
          rel='noopener noreferrer'
          aria-label='Subscribe to the RSS feed'
          title='Subscribe to the RSS feed'
          className='text-muted-foreground hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg border border-transparent transition-colors'
        >
          <Rss
            className='size-4'
            aria-hidden
          />
          <span className='sr-only'>Subscribe to the RSS feed</span>
        </a>
      </header>

      <NewsNewspaper articles={articles} />

      <nav
        aria-label='News pagination'
        className='flex items-center justify-between gap-4 text-xs tracking-[0.2em] uppercase sm:text-sm'
      >
        {page > 1 ? (
          <Link
            href={page === 2 ? '/news' : `/news?page=${page - 1}`}
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
            href={`/news?page=${page + 1}`}
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
