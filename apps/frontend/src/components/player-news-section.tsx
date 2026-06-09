import Image from 'next/image'
import Link from 'next/link'

import type {PlayerNewsArticle} from '@/lib/players-api'

type PlayerNewsSectionProps = {
  articles: PlayerNewsArticle[]
}

function formatPublishedDate(iso: string | null) {
  if (!iso) return null

  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function PlayerNewsSection({articles}: PlayerNewsSectionProps) {
  return (
    <section className='bg-card border-border rounded-xl border p-3 sm:p-5'>
      <h2 className='text-card-foreground text-lg font-semibold sm:text-xl'>News</h2>

      {articles.length === 0 ? (
        <p className='text-muted-foreground mt-4 rounded-lg border border-dashed px-4 py-6 text-sm'>
          No recent headlines for this player.
        </p>
      ) : (
        <div className='mt-4 grid gap-3 sm:grid-cols-2'>
          {articles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function NewsCard({article}: {article: PlayerNewsArticle}) {
  const content = (
    <>
      {article.imageUrl ? (
        <div className='relative aspect-[16/9] overflow-hidden rounded-lg'>
          <Image
            src={article.imageUrl}
            alt={article.headline}
            fill
            className='object-cover'
            sizes='(max-width: 768px) 100vw, 50vw'
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

  if (!article.url) {
    return <article className='bg-background/40 border-border rounded-lg border p-3'>{content}</article>
  }

  return (
    <Link
      href={article.url}
      target='_blank'
      rel='noopener noreferrer'
      className='bg-background/40 border-border hover:bg-background/60 block rounded-lg border p-3 transition-colors'
    >
      {content}
    </Link>
  )
}
