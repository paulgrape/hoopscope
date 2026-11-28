import { EspnByTeamResponse } from '../espn/espn.types';
import { parseLeagueByTeam } from './team-stats.parser';

function nuggetsFeed(): EspnByTeamResponse {
  return {
    categories: [
      {
        name: 'general',
        names: [
          'gamesPlayed',
          'avgRebounds',
          'assistTurnoverRatio',
          'avgFouls',
        ],
      },
      { name: 'general', names: [] },
      {
        name: 'defensive',
        names: ['avgDefensiveRebounds', 'avgSteals', 'avgBlocks'],
      },
      { name: 'defensive', names: [] },
      {
        name: 'offensive',
        names: [
          'avgPoints',
          'fieldGoalPct',
          'threePointFieldGoalPct',
          'freeThrowPct',
          'avgTurnovers',
          'avgFieldGoalsMade',
          'avgFieldGoalsAttempted',
          'avgThreePointFieldGoalsMade',
          'avgThreePointFieldGoalsAttempted',
          'avgFreeThrowsMade',
          'avgFreeThrowsAttempted',
          'avgOffensiveRebounds',
          'avgAssists',
          'offensiveReboundPct',
          'scoringEfficiency',
          'shootingEfficiency',
        ],
      },
      { name: 'offensive', names: [] },
      {
        name: 'differential',
        names: [
          'avgPointsDifferential',
          'avgFieldGoalsAttemptedDifferential',
          'avgFreeThrowsAttemptedDifferential',
          'avgTurnoversDifferential',
          'avgReboundsDifferential',
          'freeThrowPctDifferential',
          'fieldGoalPctDifferential',
          'threePointFieldGoalPctDifferential',
          'avgOffensiveReboundsDifferential',
          'avgDefensiveReboundsDifferential',
          'avgAssistsDifferential',
          'avgStealsDifferential',
          'avgBlocksDifferential',
          'avgFoulsDifferential',
        ],
      },
    ],
    teams: [
      {
        team: {
          id: '7',
          displayName: 'Denver Nuggets',
          abbreviation: 'DEN',
          logos: [
            {
              href: 'https://a.espncdn.com/i/teamlogos/nba/500/den.png',
              rel: ['full', 'default'],
            },
          ],
        },
        categories: [
          { values: [82, 43.97561, 2.3797596, 19.134146] },
          { values: [82, 43.97561, 2.3797596, 19.134146] },
          { values: [34.207317, 6.8292685, 3.9634147] },
          { values: [34.207317, 6.8292685, 3.9634147] },
          {
            values: [
              122.07317, 49.611, 39.570552110672, 80.766, 12.170732, 43.536587,
              87.756096, 14.158537, 35.780487, 20.841463, 25.804878, 9.768292,
              28.963415, 0.22090457, 1.3910506, 0.57677877,
            ],
          },
          { values: [] },
          {
            values: [
              5.1, -3.4, 2.6, 0.9, 1.1, 3.6, 2.7, 4.6, -1.4, 2.6, 1.4, -1, -0.6,
              -2.3,
            ],
          },
        ],
      },
      {
        team: { id: '0', displayName: 'Zero Games', abbreviation: 'ZG' },
        categories: [{ values: [0, 0, 0, 0] }],
      },
      {
        team: { id: '3', displayName: 'Incomplete', abbreviation: 'INC' },
        categories: [
          { values: [10, 40, 2, 18] },
          { values: [] },
          { values: [30, 7, 4] },
          { values: [] },
          { values: [110, 45, 35, 80, 13] },
          { values: [] },
          { values: [1] },
        ],
      },
    ],
  };
}

describe('parseLeagueByTeam', () => {
  const [nuggets, incomplete] = parseLeagueByTeam(nuggetsFeed());

  it('keeps per-game stats and skips teams that have not played', () => {
    expect(parseLeagueByTeam(nuggetsFeed()).map((team) => team.id)).toEqual([
      '7',
      '3',
    ]);
    expect(nuggets).toMatchObject({
      name: 'Denver Nuggets',
      abbreviation: 'DEN',
      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/den.png',
      gp: 82,
      pts: 122.07317,
      topg: 12.170732,
      ptsDiff: 5.1,
      orPct: 22.090457,
    });
    expect(nuggets.ptsDiff).toBeGreaterThan(0);
  });

  it('estimates offensive rating above defensive rating from counting stats', () => {
    expect(nuggets.off).toBeCloseTo(120.25, 1);
    expect(nuggets.def).toBeCloseTo(115.28, 1);
    expect(nuggets.net).toBeCloseTo(4.97, 1);
    expect(nuggets.pace).toBeCloseTo(101.51, 1);
    expect(nuggets.oppPts).toBeCloseTo(116.97, 1);
    expect(nuggets.off!).toBeGreaterThan(nuggets.def!);
  });

  it('leaves ratings empty when possession inputs are missing', () => {
    expect(incomplete).toMatchObject({
      id: '3',
      gp: 10,
      topg: 13,
      off: null,
      def: null,
      net: null,
      pace: null,
    });
  });
});
