import Image from 'next/image'
import Link from 'next/link'

import type { NewsArticle } from '@/lib/news-api'
import { cn } from '@/lib/utils'

type NewsNewspaperProps = {
  articles: NewsArticle[]
}

function formatEditionDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
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

function ArticleLink({
  article,
  className,
  children,
}: {
  article: NewsArticle
  className?: string
  children: React.ReactNode
}) {
  if (!article.url) {
    return <div className={className}>{children}</div>
  }

  return (
    <Link
      href={article.url}
      target='_blank'
      rel='noopener noreferrer'
      className={cn('group block transition-colors', className)}
    >
      {children}
    </Link>
  )
}

function TeamTags({ teams }: { teams: string[] }) {
  if (teams.length === 0) return null

  return (
    <div className='flex flex-wrap gap-1.5'>
      {teams.slice(0, 2).map((team) => (
        <span
          key={team}
          className='border-border text-muted-foreground rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider'
        >
          {team}
        </span>
      ))}
    </div>
  )
}

export function NewsNewspaper({ articles }: NewsNewspaperProps) {
  if (articles.length === 0) {
    return (
      <section className='bg-card border-border rounded-xl border p-6 text-center'>
        <p className='text-muted-foreground text-sm'>No NBA headlines available right now.</p>
      </section>
    )
  }

  const [lead, ...rest] = articles
  const sidebar = rest.slice(0, 3)
  const bottomRow = rest.slice(3, 7)
  const briefs = rest.slice(7)

  return (
    <section className='bg-card border-border overflow-hidden rounded-xl border'>
      <header className='border-border border-b px-4 py-5 text-center sm:px-8 sm:py-6'>
        <p className='text-muted-foreground text-[10px] font-medium uppercase tracking-[0.35em] sm:text-xs'>
          The Association Edition
        </p>
        <h2 className='font-serif mt-2 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl'>
          NBA Hub Daily
        </h2>
        <div className='border-border mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-1 border-y py-2 text-[11px] uppercase tracking-[0.2em] sm:text-xs'>
          <span>{formatEditionDate(new Date())}</span>
          <span className='text-muted-foreground hidden sm:inline'>•</span>
          <span className='text-muted-foreground'>Latest from ESPN</span>
          <span className='text-muted-foreground hidden sm:inline'>•</span>
          <span className='text-muted-foreground'>Vol. I</span>
        </div>
      </header>

      <div className='grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'>
        <article className='border-border border-b p-4 sm:p-6 lg:border-b-0 lg:border-r'>
          <ArticleLink article={lead} className='flex h-full flex-col gap-4'>
            {lead.imageUrl ? (
              <div className='border-border relative aspect-video overflow-hidden border'>
                <Image
                  src={lead.imageUrl}
                  alt={lead.headline}
                  fill
                  className='object-cover transition-transform duration-500 group-hover:scale-[1.02]'
                  sizes='(max-width: 1024px) 100vw, 60vw'
                  priority
                />
              </div>
            ) : null}

            <div className='flex flex-col gap-3'>
              <div className='flex flex-wrap items-center gap-3'>
                <span className='bg-foreground text-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em]'>
                  Lead Story
                </span>
                <TeamTags teams={lead.teams} />
              </div>

              <h3 className='font-serif text-2xl leading-tight font-bold sm:text-3xl lg:text-4xl'>
                {lead.headline}
              </h3>

              {lead.description ? (
                <p className='text-muted-foreground max-w-3xl text-sm leading-relaxed sm:text-base'>
                  <span className='font-serif text-foreground float-left mr-2 mt-0.5 text-4xl leading-none font-bold sm:text-5xl'>
                    {lead.description.charAt(0)}
                  </span>
                  {lead.description.slice(1)}
                </p>
              ) : null}

              <footer className='text-muted-foreground flex flex-wrap items-center gap-2 text-xs'>
                {lead.byline ? <span className='font-medium'>{lead.byline}</span> : null}
                {lead.byline && lead.published ? <span>•</span> : null}
                {lead.published ? <time dateTime={lead.published}>{formatPublishedDate(lead.published)}</time> : null}
              </footer>
            </div>
          </ArticleLink>
        </article>

        <aside className='divide-border flex flex-col divide-y'>
          {sidebar.map((article, index) => (
            <article key={article.id} className='p-4 sm:p-5'>
              <ArticleLink article={article} className='flex h-full flex-col gap-3'>
                <div className='flex items-start justify-between gap-3'>
                  <span className='text-muted-foreground font-mono text-xs'>
                    {String(index + 2).padStart(2, '0')}
                  </span>
                  <TeamTags teams={article.teams} />
                </div>

                {article.imageUrl ? (
                  <div className='border-border relative aspect-3/2 overflow-hidden border'>
                    <Image
                      src={article.imageUrl}
                      alt={article.headline}
                      fill
                      className='object-cover transition-transform duration-500 group-hover:scale-[1.02]'
                      sizes='(max-width: 1024px) 100vw, 30vw'
                    />
                  </div>
                ) : null}

                <h4 className='font-serif text-lg leading-snug font-semibold sm:text-xl'>{article.headline}</h4>
                {article.description ? (
                  <p className='text-muted-foreground line-clamp-3 text-sm leading-relaxed'>{article.description}</p>
                ) : null}
              </ArticleLink>
            </article>
          ))}
        </aside>
      </div>

      {bottomRow.length > 0 ? (
        <div className='border-border border-t'>
          <div className='border-border border-b px-4 py-2 sm:px-6'>
            <p className='text-muted-foreground text-center text-[10px] font-medium uppercase tracking-[0.3em]'>
              Around the League
            </p>
          </div>
          <div className='grid sm:grid-cols-2 xl:grid-cols-4'>
            {bottomRow.map((article, index) => (
              <article
                key={article.id}
                className={cn(
                  'border-border p-4 sm:p-5',
                  index < bottomRow.length - 1 && 'border-b sm:border-b-0',
                  index % 2 === 0 && 'sm:border-r xl:border-r',
                  index === 1 && 'xl:border-r',
                  index === 2 && 'sm:border-r xl:border-r-0',
                )}
              >
                <ArticleLink article={article} className='flex h-full flex-col gap-3'>
                  <TeamTags teams={article.teams} />
                  <h4 className='font-serif text-base leading-snug font-semibold sm:text-lg'>{article.headline}</h4>
                  {article.description ? (
                    <p className='text-muted-foreground line-clamp-4 text-sm leading-relaxed'>{article.description}</p>
                  ) : null}
                  {article.byline ? (
                    <p className='text-muted-foreground mt-auto text-xs font-medium'>{article.byline}</p>
                  ) : null}
                </ArticleLink>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {briefs.length > 0 ? (
        <div className='border-border border-t px-4 py-4 sm:px-6 sm:py-5'>
          <p className='text-muted-foreground mb-3 text-center text-[10px] font-medium uppercase tracking-[0.3em]'>
            In Brief
          </p>
          <ul className='columns-1 gap-6 sm:columns-2 lg:columns-3'>
            {briefs.map((article) => (
              <li key={article.id} className='mb-3 break-inside-avoid'>
                <ArticleLink article={article} className='hover:text-foreground text-muted-foreground'>
                  <span className='text-foreground font-serif font-semibold'>{article.headline}</span>
                  {article.published ? (
                    <span className='ml-2 text-[11px] uppercase tracking-wide'>
                      {formatPublishedDate(article.published)}
                    </span>
                  ) : null}
                </ArticleLink>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
