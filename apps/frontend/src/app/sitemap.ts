import {getHistoricGames} from '@/lib/games-api'
import {STATIC_PUBLIC_ROUTES} from '@/lib/seo-routes'
import {absoluteUrl} from '@/lib/site'
import {getTeams} from '@/lib/teams-api'
import type {MetadataRoute} from 'next'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticEntries: MetadataRoute.Sitemap = STATIC_PUBLIC_ROUTES.map(route => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.path === '/' ? 'hourly' : 'daily',
    priority: route.path === '/' ? 1 : 0.8
  }))

  const [teams, historicGames] = await Promise.all([getTeams().catch(() => []), getHistoricGames().catch(() => [])])

  const teamEntries: MetadataRoute.Sitemap = teams.map(team => ({
    url: absoluteUrl(`/teams/${team.id}`),
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.7
  }))

  const gameEntries: MetadataRoute.Sitemap = historicGames.map(game => ({
    url: absoluteUrl(`/historic-games/${game.id}`),
    lastModified: new Date(game.date),
    changeFrequency: 'monthly',
    priority: 0.6
  }))

  return [...staticEntries, ...teamEntries, ...gameEntries]
}
