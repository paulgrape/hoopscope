export type PublicRoute = {
  path: string
  title: string
  description: string
  entityType?: string
}

export const STATIC_PUBLIC_ROUTES: PublicRoute[] = [
  {
    path: '/',
    title: 'Home',
    description: 'League headlines, scores context, and quick links across Hoopscope.',
    entityType: 'news'
  },
  {
    path: '/match-center',
    title: 'Match Center',
    description: 'Browse NBA games by local calendar date with live and final scoreboards.',
    entityType: 'schedule'
  },
  {
    path: '/historic-games',
    title: 'Historic Games',
    description: 'Replay classic matchups from saved ESPN play-by-play feeds.',
    entityType: 'games'
  },
  {
    path: '/teams',
    title: 'Teams',
    description: 'All 30 NBA franchises with records, rosters, and season stats.',
    entityType: 'teams'
  },
  {
    path: '/players',
    title: 'Players',
    description: 'Search active NBA rosters by player name or team.',
    entityType: 'players'
  },
  {
    path: '/standings',
    title: 'Standings',
    description: 'Conference standings with playoff and play-in positions highlighted.',
    entityType: 'standings'
  },
  {
    path: '/about',
    title: 'About',
    description: 'What Hoopscope is, where the data comes from, and who builds it.',
    entityType: 'about'
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    description: 'How Hoopscope collects, uses, and protects visitor information.',
    entityType: 'legal'
  }
]

export const ENTITY_ROUTE_PATTERNS = [
  {
    pattern: '/teams/{teamId}',
    title: 'Team detail',
    description: 'Team record, location, and season statistics.',
    entityType: 'team'
  },
  {
    pattern: '/players/{playerId}',
    title: 'Player detail',
    description: 'Player bio, season averages, career stats, and related news.',
    entityType: 'player'
  },
  {
    pattern: '/historic-games/{gameId}',
    title: 'Historic game replay',
    description: 'Saved play-by-play replay for a classic NBA matchup.',
    entityType: 'game'
  },
  {
    pattern: '/match-center/{gameId}',
    title: 'Match detail',
    description: 'Scoreboard, team totals, and leaders for an NBA game.',
    entityType: 'game'
  }
] as const
