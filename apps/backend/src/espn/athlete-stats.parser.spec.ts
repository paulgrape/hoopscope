import {
  ZERO_AVERAGES,
  parseOverviewAverages,
  parseOverviewStats,
} from './athlete-stats.parser';

const overview = {
  statistics: {
    names: ['gamesPlayed', 'avgPoints'],
    splits: [
      {
        displayName: 'Regular Season',
        stats: ['12', '24.5'],
      },
    ],
  },
};

describe('parseOverviewAverages', () => {
  it('returns zeros when the split has no games played', () => {
    expect(
      parseOverviewAverages(
        {
          statistics: {
            names: ['gamesPlayed', 'avgPoints'],
            splits: [{ displayName: 'Regular Season', stats: ['0', '20.1'] }],
          },
        },
        'regular',
      ),
    ).toEqual(ZERO_AVERAGES);
  });

  it('returns null when the requested split is missing', () => {
    expect(
      parseOverviewAverages(
        { statistics: { names: [], splits: [] } },
        'regular',
      ),
    ).toBeNull();
  });
});

describe('parseOverviewStats', () => {
  const player = {
    id: '1',
    fullName: 'Test',
    jersey: '0',
    position: 'G',
    headshot: null,
  };

  it('keeps the player when overview data is missing', () => {
    expect(parseOverviewStats(player, {}, 'regular')).toMatchObject({
      id: '1',
      gp: 0,
      pts: 0,
    });
  });

  it('maps played splits onto the player', () => {
    expect(parseOverviewStats(player, overview, 'regular')).toMatchObject({
      id: '1',
      gp: 12,
      pts: 24.5,
    });
  });
});
