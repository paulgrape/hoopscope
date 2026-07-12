import {getNews, type NewsArticle} from '@/lib/news-api'
import {SITE_DESCRIPTION, SITE_NAME, absoluteUrl} from '@/lib/site'

const FEED_LIMIT = 30
const FEED_PATH = '/feed.xml'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatRssDate(date: string | null): string {
  if (!date) return new Date().toUTCString()
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? new Date().toUTCString() : parsed.toUTCString()
}

function buildItem(article: NewsArticle): string {
  const link = article.url ?? absoluteUrl('/')
  const guid = article.url
    ? `<guid isPermaLink="true">${escapeXml(link)}</guid>`
    : `<guid isPermaLink="false">${escapeXml(String(article.id))}</guid>`

  const parts = [
    '<item>',
    `<title>${escapeXml(article.headline)}</title>`,
    `<link>${escapeXml(link)}</link>`,
    guid,
    `<pubDate>${formatRssDate(article.published)}</pubDate>`,
    `<description>${escapeXml(article.description)}</description>`,
  ]

  if (article.byline) {
    parts.push(`<dc:creator>${escapeXml(article.byline)}</dc:creator>`)
  }

  for (const team of article.teams) {
    parts.push(`<category>${escapeXml(team)}</category>`)
  }

  if (article.imageUrl) {
    parts.push(
      `<enclosure url="${escapeXml(article.imageUrl)}" type="image/jpeg" length="0" />`,
    )
  }

  parts.push('</item>')
  return parts.join('\n    ')
}

function buildRssFeed(articles: NewsArticle[]): string {
  const now = new Date().toUTCString()
  const items = articles.map(buildItem).join('\n    ')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(absoluteUrl('/'))}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(absoluteUrl(FEED_PATH))}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`
}

export async function GET() {
  let articles: NewsArticle[] = []

  try {
    const {articles: fetched} = await getNews(FEED_LIMIT, 0)
    articles = fetched
  } catch {
    // Emit valid empty channel when news API unavailable.
  }

  const xml = buildRssFeed(articles)

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 's-maxage=600, stale-while-revalidate=3600',
    },
  })
}
