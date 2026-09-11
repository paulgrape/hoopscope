import {
  careerIncludesTeamSeason,
  parseCareerStats,
} from './athlete-career-stats.parser';

describe('careerIncludesTeamSeason', () => {
  const seasons = parseCareerStats(
    {
      teams: {
        'charlotte-hornets': {
          id: '30',
          abbreviation: 'CHA',
          displayName: 'Charlotte Hornets',
        },
      },
      categories: [
        {
          name: 'averages',
          names: ['gamesPlayed'],
          statistics: [
            {
              teamId: '30',
              teamSlug: 'charlotte-hornets',
              season: { year: 2026, displayName: '2025-26' },
              stats: ['72'],
            },
          ],
        },
      ],
    },
    'regular',
  );

  it('is true only for the franchise that owns that season row', () => {
    expect(careerIncludesTeamSeason(seasons, 2026, '30')).toBe(true);
    expect(careerIncludesTeamSeason(seasons, 2026, '16')).toBe(false);
    expect(careerIncludesTeamSeason(seasons, 2027, '30')).toBe(false);
  });
});
