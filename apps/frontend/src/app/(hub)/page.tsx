import {JsonLd} from '@/components/json-ld'
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

export default async function Home() {
  const articles = await getNews(12)

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
    </main>
  )
}
