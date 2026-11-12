import type { EspnByAthleteResponse } from '../espn/espn.types';

/** Trimmed ESPN category names/values shape, deliberately in a different order. */
export function leagueFixture(): EspnByAthleteResponse {
  return {
    categories: [
      {
        name: 'offensive',
        names: [
          'fieldGoalsMade',
          'avgPoints',
          'threePointFieldGoalPct',
          'avgAssists',
          'freeThrowsMade',
          'fieldGoalPct',
          'avgThreePointFieldGoalsMade',
          'freeThrowPct',
          'threePointFieldGoalsMade',
        ],
      },
      { name: 'general', names: ['avgRebounds', 'gamesPlayed', 'avgMinutes'] },
      { name: 'defensive', names: ['avgBlocks', 'avgSteals'] },
    ],
    athletes: [
      {
        athlete: {
          id: '3945274',
          displayName: 'Luka Doncic',
          headshot: {
            href: 'https://a.espncdn.com/i/headshots/nba/players/full/3945274.png',
          },
          position: { abbreviation: 'G' },
          teamId: '13',
          teams: [
            {
              id: '13',
              abbreviation: 'LAL',
              displayName: 'Los Angeles Lakers',
            },
          ],
        },
        categories: [
          { name: 'general', values: [7.7, 10, 35.8] },
          { name: 'defensive', values: [0.5, 1.6] },
          {
            name: 'offensive',
            values: [100, 33.5, 36.6, 8.3, 50, 47.6, 4, 78, 40],
          },
        ],
      },
    ],
  };
}
