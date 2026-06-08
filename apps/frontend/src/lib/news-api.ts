const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

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

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function getNews(limit = 12): Promise<NewsArticle[]> {
  return request<NewsArticle[]>(`/news?limit=${limit}`)
}
