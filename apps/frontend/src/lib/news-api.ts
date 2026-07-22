import {apiFetch} from '@/lib/api-client'

export type NewsArticle = {
  id: number
  type: string
  headline: string
  description: string
  published: string | null
  imageUrl: string | null
  imageCaption: string | null
  url: string | null
  byline: string | null
  teams: string[]
}

export type NewsPage = {
  articles: NewsArticle[]
  total: number
}

export async function getNews(limit = 12, offset = 0): Promise<NewsPage> {
  return apiFetch<NewsPage>(`/news?limit=${limit}&offset=${offset}`, {revalidate: 600})
}
