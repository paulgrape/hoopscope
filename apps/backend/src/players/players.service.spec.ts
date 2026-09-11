import { CacheService } from '../cache/cache.service';
import { EspnService } from '../espn/espn.service';
import { PlayersService } from './players.service';

const teamsPayload = {
  sports: [
    {
      leagues: [
        {
          teams: [
            {
              team: {
                id: '13',
                name: 'Lakers',
                abbreviation: 'LAL',
                displayName: 'Los Angeles Lakers',
              },
            },
            {
              team: {
                id: '9',
                name: 'Nuggets',
                abbreviation: 'DEN',
                displayName: 'Denver Nuggets',
              },
            },
          ],
        },
      ],
    },
  ],
};

const lakersRoster = {
  athletes: [
    {
      id: '1966',
      fullName: 'LeBron James',
      jersey: '23',
      position: { abbreviation: 'SF' },
      headshot: { href: 'https://headshot/1966.png' },
    },
    { id: '', fullName: 'No Id' },
  ],
};

/** Grouped-by-position shape ESPN serves for some teams. */
const nuggetsRoster = {
  athletes: [
    {
      position: 'center',
      items: [{ id: '3112335', fullName: 'Nikola Jokić' }],
    },
    {
      position: 'guard',
      items: [{ id: '4066648', fullName: 'Jamal Murray' }],
    },
  ],
};

describe('PlayersService.search', () => {
  let service: PlayersService;
  let espn: { getTeams: jest.Mock; getRoster: jest.Mock };

  beforeEach(() => {
    espn = {
      getTeams: jest.fn().mockResolvedValue(teamsPayload),
      getRoster: jest
        .fn()
        .mockImplementation((teamId: string) =>
          Promise.resolve(teamId === '13' ? lakersRoster : nuggetsRoster),
        ),
    };
    service = new PlayersService(
      espn as unknown as EspnService,
      new CacheService(),
    );
  });

  it('indexes flat and position-grouped rosters, sorted by name', async () => {
    const result = await service.search();

    expect(result.total).toBe(3);
    expect(result.players.map((player) => player.fullName)).toEqual([
      'Jamal Murray',
      'LeBron James',
      'Nikola Jokić',
    ]);
    expect(result.players[1]).toMatchObject({
      id: '1966',
      jersey: '23',
      position: 'SF',
      headshot: 'https://headshot/1966.png',
      team: { id: '13', abbreviation: 'LAL' },
    });
  });

  it('matches names ignoring case, accents, and token order', async () => {
    const result = await service.search({ q: 'jokic nikola' });

    expect(result.players.map((player) => player.id)).toEqual(['3112335']);
  });

  it('filters by team and caps results at the limit', async () => {
    await expect(service.search({ teamId: '9' })).resolves.toMatchObject({
      total: 2,
    });

    const limited = await service.search({ teamId: '9', limit: 1 });
    expect(limited.total).toBe(2);
    expect(limited.players).toHaveLength(1);
  });

  it('reuses the cached index across searches', async () => {
    await service.search({ q: 'james' });
    await service.search({ q: 'murray' });

    expect(espn.getTeams).toHaveBeenCalledTimes(1);
    expect(espn.getRoster).toHaveBeenCalledTimes(2);
  });

  it('skips teams whose roster fails upstream', async () => {
    espn.getRoster.mockImplementation((teamId: string) =>
      teamId === '13'
        ? Promise.reject(new Error('upstream down'))
        : Promise.resolve(nuggetsRoster),
    );

    const result = await service.search();

    expect(result.players.map((player) => player.team?.abbreviation)).toEqual([
      'DEN',
      'DEN',
    ]);
  });
});

const hornetsCareerStats = {
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
};

describe('PlayersService.findOne', () => {
  let service: PlayersService;
  let espn: {
    getTeams: jest.Mock;
    getRoster: jest.Mock;
    getPlayer: jest.Mock;
    getAthleteStats: jest.Mock;
    getLeagueInjuries: jest.Mock;
  };

  beforeEach(() => {
    espn = {
      getTeams: jest.fn().mockResolvedValue(teamsPayload),
      getRoster: jest
        .fn()
        .mockImplementation((teamId: string) =>
          Promise.resolve(teamId === '13' ? lakersRoster : nuggetsRoster),
        ),
      getPlayer: jest.fn(),
      getAthleteStats: jest.fn().mockResolvedValue(hornetsCareerStats),
      getLeagueInjuries: jest.fn().mockResolvedValue({ items: [] }),
    };
    service = new PlayersService(
      espn as unknown as EspnService,
      new CacheService(),
    );
  });

  it('uses the current roster team when career stats still list a previous club', async () => {
    espn.getPlayer.mockResolvedValue({
      id: '1966',
      fullName: 'LeBron James',
      jersey: '23',
      position: { displayName: 'Small Forward' },
      headshot: { href: 'https://headshot/1966.png' },
      active: true,
      status: { name: 'Active' },
    });

    await expect(service.findOne('1966')).resolves.toMatchObject({
      id: '1966',
      fullName: 'LeBron James',
      latestTeam: {
        id: '13',
        abbreviation: 'LAL',
        displayName: 'Los Angeles Lakers',
      },
    });
  });

  it('falls back to career stats when the player is not on any current roster', async () => {
    espn.getPlayer.mockResolvedValue({
      id: '2544',
      fullName: 'Free Agent',
      active: false,
      status: { name: 'Free Agent' },
    });

    await expect(service.findOne('2544')).resolves.toMatchObject({
      id: '2544',
      fullName: 'Free Agent',
      latestTeam: {
        id: '30',
        abbreviation: 'CHA',
        displayName: 'Charlotte Hornets',
      },
    });
  });
});

describe('PlayersService.findSeasonStats', () => {
  let service: PlayersService;
  let espn: {
    resolveCurrentSeason: jest.Mock;
    seasonStatsTtl: jest.Mock;
    getAthleteOverview: jest.Mock;
  };

  beforeEach(() => {
    espn = {
      resolveCurrentSeason: jest.fn().mockResolvedValue({
        year: 2027,
        type: 1,
        name: 'Preseason',
      }),
      seasonStatsTtl: jest.fn().mockReturnValue(30_000),
      getAthleteOverview: jest.fn(),
    };
    service = new PlayersService(
      espn as unknown as EspnService,
      new CacheService(),
    );
  });

  it('returns zero regular-season averages without calling overview in preseason', async () => {
    await expect(service.findSeasonStats('4432816')).resolves.toMatchObject({
      season: 2027,
      seasonLabel: '2026–27',
      participated: false,
      averages: { gp: 0, pts: 0 },
    });
    expect(espn.getAthleteOverview).not.toHaveBeenCalled();
  });

  it('does not treat leaked overview as playoff participation while unstarted', async () => {
    await expect(
      service.findSeasonStats('4432816', undefined, 'playoffs'),
    ).resolves.toMatchObject({
      participated: false,
      averages: null,
    });
    expect(espn.getAthleteOverview).not.toHaveBeenCalled();
  });

  it('uses overview once the live year is regular season', async () => {
    espn.resolveCurrentSeason.mockResolvedValue({
      year: 2027,
      type: 2,
      name: 'Regular Season',
    });
    espn.getAthleteOverview.mockResolvedValue({
      statistics: {
        names: ['gamesPlayed', 'avgPoints'],
        splits: [{ displayName: 'Regular Season', stats: ['4', '28.1'] }],
      },
    });

    await expect(service.findSeasonStats('4432816')).resolves.toMatchObject({
      participated: true,
      averages: { gp: 4, pts: 28.1 },
    });
    expect(espn.getAthleteOverview).toHaveBeenCalled();
  });
});
