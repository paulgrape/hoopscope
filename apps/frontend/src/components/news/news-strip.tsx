import {LocalTime} from '@/components/layout/local-time'
import type {NewsArticle} from '@/lib/news-api'
import Image from 'next/image'
import Link from 'next/link'

type NewsStripProps = {
  articles: NewsArticle[]
}

function StripCard({article}: {article: NewsArticle}) {
  const body = (
    <>
      {article.imageUrl ? (
        <div className='border-border relative aspect-3/2 overflow-hidden rounded-lg border'>
          <Image
            src={article.imageUrl}
            alt=''
            fill
            className='object-cover'
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw'
          />
        </div>
      ) : null}
      <h3 className='line-clamp-2 text-sm leading-snug font-semibold sm:text-base'>{article.headline}</h3>
      {article.published ? (
        <LocalTime
          iso={article.published}
          className='text-muted-foreground mt-auto text-xs'
        />
      ) : null}
    </>
  )

  const cardClassName =
    'bg-card border-border flex h-full min-w-0 flex-col gap-2 rounded-xl border p-3 transition sm:p-4'

  if (!article.url) {
    return <div className={cardClassName}>{body}</div>
  }

  return (
    <Link
      href={article.url}
      target='_blank'
      rel='noopener noreferrer'
      className={`${cardClassName} hover:border-foreground/20`}
    >
      {body}
    </Link>
  )
}

export function NewsStrip({articles}: NewsStripProps) {
  if (articles.length === 0) {
    return (
      <div className='bg-card border-border rounded-xl border p-6 text-center'>
        <p className='text-muted-foreground text-sm'>No NBA headlines available right now.</p>
      </div>
    )
  }

  return (
    <ul className='grid min-w-0 flex-1 auto-rows-fr gap-3 sm:grid-cols-2 sm:gap-4'>
      {articles.map(article => (
        <li
          key={article.id}
          className='min-w-0'
        >
          <StripCard article={article} />
        </li>
      ))}
    </ul>
  )
}
