import type {NewsArticle} from '@/lib/news-api'
import {ArrowUpRight} from 'lucide-react'
import Image from 'next/image'

type PlayerNewsSectionProps = {
  articles: NewsArticle[]
  moreHref: string
}

function formatPublishedDate(iso: string | null) {
  if (!iso) return null

  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function PlayerNewsSection({articles, moreHref}: PlayerNewsSectionProps) {
  return (
    <section>
      {articles.length === 0 ? (
        <p className='text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-sm'>
          No recent headlines for this player.
        </p>
      ) : (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {articles.map(article => (
            <NewsCard
              key={article.id}
              article={article}
            />
          ))}
        </div>
      )}

      {moreHref ? (
        <div className='mt-4 flex'>
          <a
            href={moreHref}
            target='_blank'
            rel='noopener noreferrer'
            className='text-foreground inline-flex w-full items-center justify-center gap-1 py-2 text-center text-sm font-medium underline-offset-4 hover:underline'
          >
            See more on ESPN
            <ArrowUpRight className='size-4' />
          </a>
        </div>
      ) : null}
    </section>
  )
}

function NewsCard({article}: {article: NewsArticle}) {
  const href = typeof article.url === 'string' && article.url.length > 0 ? article.url : null

  const content = (
    <>
      {article.imageUrl ? (
        <div className='relative aspect-video overflow-hidden rounded-lg'>
          <Image
            src={article.imageUrl}
            alt={article.headline}
            fill
            className='object-cover'
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
          />
        </div>
      ) : null}
      <div className={article.imageUrl ? 'mt-3' : undefined}>
        <p className='text-muted-foreground text-xs'>
          {formatPublishedDate(article.published) ?? article.type}
          {article.byline ? ` · ${article.byline}` : ''}
        </p>
        <h3 className='text-card-foreground mt-1 font-medium'>{article.headline}</h3>
        {article.description ? (
          <p className='text-muted-foreground mt-2 line-clamp-3 text-sm'>{article.description}</p>
        ) : null}
      </div>
    </>
  )

  if (!href) {
    return <article className='bg-card border-border rounded-xl border p-3'>{content}</article>
  }

  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className='bg-card border-border hover:bg-muted/40 block rounded-xl border p-3 transition-colors'
    >
      {content}
    </a>
  )
}
