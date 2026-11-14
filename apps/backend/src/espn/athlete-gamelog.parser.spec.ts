import { EspnAthleteGamelog } from './espn.service';
import { parseRecentGames } from './athlete-gamelog.parser';

const NAMES = [
  'minutes',
  'fieldGoalsMade-fieldGoalsAttempted',
  'fieldGoalPct',
  'threePointFieldGoalsMade-threePointFieldGoalsAttempted',
  'threePointPct',
  'freeThrowsMade-freeThrowsAttempted',
  'freeThrowPct',
  'totalRebounds',
  'assists',
  'blocks',
  'steals',
  'fouls',
  'turnovers',
  'points',
];

function played(stats: string[]) {
  return { stats };
}

describe('parseRecentGames', () => {
  const log: EspnAthleteGamelog = {
    names: NAMES,
    filters: [{ name: 'season', value: '2027' }],
    events: {
      '1': {
        atVs: 'vs',
        gameDate: '2026-11-11T23:30:00.000Z',
        score: '123-101',
        gameResult: 'L',
        opponent: { id: '2', abbreviation: 'BOS' },
      },
      '2': {
        atVs: '@',
        gameDate: '2026-10-22T23:00:00.000Z',
        score: '110-105',
        gameResult: 'W',
        opponent: { id: '13', abbreviation: 'LAL' },
      },
      '3': {
        atVs: 'vs',
        gameDate: '2026-10-04T23:00:00.000Z',
        score: '100-90',
        gameResult: 'W',
        opponent: { id: '20', abbreviation: 'PHI' },
      },
      '4': {
        atVs: '@',
        gameDate: '2026-11-01T00:30:00.000Z',
        score: '99-98',
        gameResult: 'L',
        opponent: { id: '1', abbreviation: 'ATL' },
      },
    },
    seasonTypes: [
      {
        displayName: '2026-27 Regular Season',
        categories: [
          {
            displayName: 'november',
            events: [
              {
                eventId: '1',
                ...played([
                  '29',
                  '4-12',
                  '33.3',
                  '1-6',
                  '16.7',
                  '2-2',
                  '100.0',
                  '8',
                  '5',
                  '0',
                  '0',
                  '2',
                  '1',
                  '11',
                ]),
              },
              { eventId: '4', stats: [] },
            ],
          },
          {
            displayName: 'october',
            events: [
              {
                eventId: '2',
                ...played([
                  '34',
                  '8-15',
                  '53.3',
                  '2-6',
                  '33.3',
                  '2-3',
                  '66.7',
                  '9',
                  '8',
                  '1',
                  '1',
                  '2',
                  '2',
                  '20',
                ]),
              },
            ],
          },
        ],
      },
      {
        displayName: '2026-27 Preseason',
        categories: [
          {
            events: [
              {
                eventId: '3',
                ...played([
                  '18',
                  '1-1',
                  '100.0',
                  '0-0',
                  '0.0',
                  '8-8',
                  '100.0',
                  '4',
                  '5',
                  '0',
                  '1',
                  '1',
                  '2',
                  '10',
                ]),
              },
            ],
          },
        ],
      },
    ],
  };

  it('keeps the newest regular-season games and drops preseason', () => {
    const parsed = parseRecentGames(log, 10);

    expect(parsed.season).toBe(2027);
    expect(parsed.seasonLabel).toBe('2026–27');
    expect(parsed.games.map((game) => game.id)).toEqual(['1', '4', '2']);
    expect(parsed.games[0]).toMatchObject({
      opponentId: '2',
      opponentAbbr: 'BOS',
      homeAway: 'home',
      result: 'L',
      score: '123-101',
      min: 29,
      pts: 11,
      reb: 8,
      ast: 5,
      fg: '4-12',
      threePoint: '1-6',
      freeThrow: '2-2',
      played: true,
    });
    expect(parsed.games[1]).toMatchObject({
      id: '4',
      played: false,
      min: null,
      pts: null,
    });
  });

  it('honors the requested limit', () => {
    expect(parseRecentGames(log, 1).games.map((game) => game.id)).toEqual([
      '1',
    ]);
  });

  it('keeps preseason games when the regular season has not started', () => {
    const preseason: EspnAthleteGamelog = {
      ...log,
      seasonTypes: log.seasonTypes?.filter((seasonType) =>
        seasonType.displayName?.includes('Preseason'),
      ),
    };

    expect(parseRecentGames(preseason).games.map((game) => game.id)).toEqual([
      '3',
    ]);
  });
});
