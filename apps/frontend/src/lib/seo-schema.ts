import {
  DATA_SOURCE_NAME,
  DATA_SOURCE_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
} from '@/lib/site'

type JsonLd = Record<string, unknown>

export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: absoluteUrl('/'),
    inLanguage: 'en-US',
    publisher: organizationSchema(),
  }
}

export function organizationSchema(): JsonLd {
  return {
    '@type': 'SportsOrganization',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    description: SITE_DESCRIPTION,
    sport: 'Basketball',
  }
}

export function breadcrumbSchema(items: Array<{name: string; path: string}>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function collectionPageSchema({
  path,
  title,
  description,
  items,
}: {
  path: string
  title: string
  description: string
  items?: Array<{name: string; url: string}>
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: absoluteUrl(path),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: absoluteUrl('/'),
    },
    ...(items && items.length > 0
      ? {
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: items.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.name,
              url: item.url.startsWith('http') ? item.url : absoluteUrl(item.url),
            })),
          },
        }
      : {}),
  }
}

export function sportsTeamSchema({
  id,
  name,
  location,
  logo,
  record,
}: {
  id: string
  name: string
  location: string
  logo?: string | null
  record?: string | null
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    '@id': absoluteUrl(`/teams/${id}`),
    name,
    sport: 'Basketball',
    location: {
      '@type': 'Place',
      name: location,
    },
    url: absoluteUrl(`/teams/${id}`),
    ...(logo ? {logo} : {}),
    ...(record ? {description: `Current record: ${record}`} : {}),
  }
}

export function personSchema({
  id,
  name,
  position,
  teamName,
  teamId,
  image,
}: {
  id: string
  name: string
  position?: string | null
  teamName?: string | null
  teamId?: string | null
  image?: string | null
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': absoluteUrl(`/players/${id}`),
    name,
    url: absoluteUrl(`/players/${id}`),
    ...(position ? {jobTitle: position} : {}),
    ...(image ? {image} : {}),
    ...(teamName && teamId
      ? {
          memberOf: {
            '@type': 'SportsTeam',
            name: teamName,
            url: absoluteUrl(`/teams/${teamId}`),
          },
        }
      : {}),
  }
}

export function sportsEventSchema({
  id,
  name,
  date,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
}: {
  id: string
  name: string
  date: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  status: string
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    '@id': absoluteUrl(`/historic-games/${id}`),
    name,
    startDate: date,
    eventStatus: status === 'final' ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventScheduled',
    sport: 'Basketball',
    url: absoluteUrl(`/historic-games/${id}`),
    homeTeam: {
      '@type': 'SportsTeam',
      name: homeTeam,
    },
    awayTeam: {
      '@type': 'SportsTeam',
      name: awayTeam,
    },
    description: `Final score: ${awayTeam} ${awayScore}, ${homeTeam} ${homeScore}.`,
  }
}

export function webPageSchema({
  path,
  title,
  description,
}: {
  path: string
  title: string
  description: string
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: absoluteUrl(path),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: absoluteUrl('/'),
    },
  }
}

export function dataSourceNote(): string {
  return `Primary public stats and schedules are sourced from ${DATA_SOURCE_NAME} (${DATA_SOURCE_URL}).`
}
