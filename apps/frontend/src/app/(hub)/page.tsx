import {JsonLd} from '@/components/json-ld'
import Link from 'next/link'
import { NewsNewspaper } from '@/components/news-newspaper'
import { getNews } from '@/lib/news-api'
import { collectionPageSchema } from '@/lib/seo-schema'
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, createPageMetadata } from '@/lib/site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  ...createPageMetadata({
    title: SITE_NAME,
    description: `${SITE_TAGLINE}. ${SITE_DESCRIPTION}`,
    path: '/',
  }),
  title: {
    absolute: SITE_NAME,
  },
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

export default async function Home({ searchParams }: HomeProps) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)

  const { articles, total } = await getNews(PAGE_SIZE, (page - 1) * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <JsonLd
        data={collectionPageSchema({
          path: '/',
          title: SITE_NAME,
          description: `${SITE_TAGLINE}. ${SITE_DESCRIPTION}`,
          items: articles.slice(0, 8).map(article => ({
            name: article.headline,
            url: article.url ?? '/',
          })),
        })}
      />
      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm uppercase tracking-wider'>Welcome</p>
        <h1 className='text-2xl font-semibold sm:text-3xl'>{SITE_NAME}</h1>
        <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>
          {SITE_TAGLINE}. Your morning read on league headlines, pulled fresh from ESPN.
        </p>
      </header>

      <NewsNewspaper articles={articles} />

      <nav
        aria-label='News pagination'
        className='flex items-center justify-between gap-4 text-xs uppercase tracking-[0.2em] sm:text-sm'
      >
        {page > 1 ? (
          <Link
            href={page === 2 ? '/' : `/?page=${page - 1}`}
            className='text-foreground hover:text-muted-foreground transition-colors'
          >
            &larr; Newer
          </Link>
        ) : (
          <span aria-hidden className='text-muted-foreground/40 select-none'>&larr; Newer</span>
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
          <span aria-hidden className='text-muted-foreground/40 select-none'>Earlier &rarr;</span>
        )}
      </nav>
    </main>
  )
}
