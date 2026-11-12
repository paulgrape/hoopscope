import { leagueFixture } from './leaders.fixture';
import { parseLeagueByAthlete } from './leaders.parser';
import { rankLeaders } from './leaders-rank';
import type { LeaderSeasonRow } from './leaders.types';

const row = (changes: Partial<LeaderSeasonRow> = {}): LeaderSeasonRow => ({
  ...parseLeagueByAthlete(leagueFixture())[0],
  ...changes,
});

describe('league leaders parsing and ranking', () => {
  it('maps named category indexes, identity, averages, totals, and 0–100 percentages', () => {
    expect(parseLeagueByAthlete(leagueFixture())).toEqual([
      expect.objectContaining({
        playerId: '3945274',
        name: 'Luka Doncic',
        position: 'G',
        teamId: '13',
        teamAbbreviation: 'LAL',
        teamName: 'Los Angeles Lakers',
        gamesPlayed: 10,
        fgm: 100,
        ftm: 50,
        threePmTotal: 40,
        values: {
          pts: 33.5,
          reb: 7.7,
          ast: 8.3,
          stl: 1.6,
          blk: 0.5,
          min: 35.8,
          threePm: 4,
          fgPct: 47.6,
          threePointPct: 36.6,
          freeThrowPct: 78,
        },
      }),
    ]);
  });

  it('deduplicates athletes using the row with more games regardless of order', () => {
    const data = leagueFixture();
    const shorter = structuredClone(data.athletes![0]);
    shorter.categories![0].values = [2, 3, 12];
    data.athletes = [shorter, data.athletes![0], shorter];
    expect(parseLeagueByAthlete(data)).toHaveLength(1);
    expect(parseLeagueByAthlete(data)[0].gamesPlayed).toBe(10);
  });

  it('does not convert missing or malformed statistics to zero-valued leaders', () => {
    const data = leagueFixture();
    data.athletes![0].categories![2].values = [
      100,
      '-',
      null,
      '',
      50,
      'NaN',
      4,
      78,
      40,
    ];
    const rows = parseLeagueByAthlete(data);
    expect(rows[0].values.pts).toBeNull();
    expect(rankLeaders(rows, 'regular', 'pts')[0].leaders).toEqual([]);
    expect(
      parseLeagueByAthlete({ athletes: [{ athlete: { id: '1' } }] }),
    ).toEqual([]);
  });

  it('pro-rates a ten-game season to seven games instead of a 58-game floor', () => {
    const rows = [
      row(),
      row({ playerId: 'eligible', gamesPlayed: 7 }),
      row({ playerId: 'ineligible', gamesPlayed: 6 }),
    ];
    const category = rankLeaders(rows, 'regular', 'pts')[0];
    expect(category.qualification).toEqual({
      stat: 'gp',
      minimum: 7,
      teamGames: 10,
    });
    expect(category.leaders.map((leader) => leader.playerId)).toEqual([
      '3945274',
      'eligible',
    ]);
  });

  it.each([
    ['fgPct', 'fgm', 300],
    ['freeThrowPct', 'ftm', 125],
    ['threePointPct', 'threePmTotal', 82],
  ] as const)(
    'qualifies %s by made shots, independently of the games floor',
    (stat, total, seasonMinimum) => {
      const minimum = (seasonMinimum * 10) / 82;
      const rows = [
        row(),
        row({
          playerId: 'eligible',
          gamesPlayed: 1,
          [total]: Math.ceil(minimum),
        }),
        row({ playerId: 'ineligible', [total]: Math.ceil(minimum) - 1 }),
      ];
      const category = rankLeaders(rows, 'regular', stat)[0];
      expect(category.qualification.minimum).toBeCloseTo(minimum);
      expect(category.leaders.map((leader) => leader.playerId)).toEqual([
        '3945274',
        'eligible',
      ]);
    },
  );

  it('caps regular-season team games at 82 and leaves playoffs uncapped', () => {
    expect(
      rankLeaders([row({ gamesPlayed: 90 })], 'regular')[0].qualification,
    ).toEqual({ stat: 'gp', minimum: 58, teamGames: 82 });
    expect(
      rankLeaders([row({ gamesPlayed: 90 })], 'playoffs')[0].qualification,
    ).toEqual({ stat: 'gp', minimum: 63, teamGames: 90 });
    expect(
      rankLeaders([row({ gamesPlayed: 20 })], 'playoffs')[0].qualification
        .minimum,
    ).toBe(14);
  });

  it('shares ranks, skips subsequent ranks, and orders ties by games then name', () => {
    const base = row();
    const rows = [
      row({ playerId: 'z', name: 'Zed', gamesPlayed: 9 }),
      row({ playerId: 'a', name: 'Ada', gamesPlayed: 9 }),
      row({ playerId: 'b', name: 'Bea', gamesPlayed: 10 }),
      row({ playerId: 'c', values: { ...base.values, pts: 30 } }),
    ];
    expect(
      rankLeaders(rows, 'regular', 'pts')[0].leaders.map(({ name, rank }) => [
        name,
        rank,
      ]),
    ).toEqual([
      ['Bea', 1],
      ['Ada', 1],
      ['Zed', 1],
      ['Luka Doncic', 4],
    ]);
    expect(rows[0].playerId).toBe('z');
  });

  it('returns all empty categories for no rows or zero games', () => {
    for (const rows of [[], [row({ gamesPlayed: 0 })]]) {
      const categories = rankLeaders(rows, 'regular');
      expect(categories).toHaveLength(10);
      expect(
        categories.every((category) => category.leaders.length === 0),
      ).toBe(true);
      expect(categories[0].qualification.minimum).toBe(1);
    }
  });
});
