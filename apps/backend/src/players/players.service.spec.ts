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
