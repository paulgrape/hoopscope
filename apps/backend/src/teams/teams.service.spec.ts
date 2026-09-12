import { NotFoundException } from '@nestjs/common';
import { AxiosError, AxiosHeaders } from 'axios';
import { CacheService } from '../cache/cache.service';
import { EspnService } from '../espn/espn.service';
import { TeamsService } from './teams.service';

function upstreamNotFound(): AxiosError {
  const error = new AxiosError('not found');
  error.response = {
    status: 404,
    statusText: '',
    data: null,
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

describe('TeamsService.findOne', () => {
  let service: TeamsService;
  let espn: { getTeam: jest.Mock };

  beforeEach(() => {
    espn = { getTeam: jest.fn() };
    service = new TeamsService(
      espn as unknown as EspnService,
      new CacheService(),
    );
  });

  it('maps an ESPN team payload', async () => {
    espn.getTeam.mockResolvedValue({
      team: {
        id: '13',
        name: 'Lakers',
        abbreviation: 'LAL',
        displayName: 'Los Angeles Lakers',
        logos: [{ href: 'https://logo/13.png' }],
        color: '552583',
        alternateColor: 'fdb927',
        location: 'Los Angeles',
        record: { items: [{ summary: '40-20' }] },
      },
    });

    await expect(service.findOne('13')).resolves.toMatchObject({
      id: '13',
      displayName: 'Los Angeles Lakers',
      logo: 'https://logo/13.png',
      record: '40-20',
    });
  });

  it('turns an upstream 404 into a NotFoundException', async () => {
    espn.getTeam.mockRejectedValue(upstreamNotFound());

    await expect(service.findOne('999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a 200 response without a team', async () => {
    espn.getTeam.mockResolvedValue({});

    await expect(service.findOne('999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
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

const wolvesCareerStats = {
  teams: {
    'minnesota-timberwolves': {
      id: '16',
      abbreviation: 'MIN',
      displayName: 'Minnesota Timberwolves',
    },
  },
  categories: [
    {
      name: 'averages',
      names: ['gamesPlayed'],
      statistics: [
        {
          teamId: '16',
          teamSlug: 'minnesota-timberwolves',
          season: { year: 2026, displayName: '2025-26' },
          stats: ['61'],
        },
      ],
    },
  ],
};

describe('TeamsService.findSeasonStats', () => {
  let service: TeamsService;
  let espn: {
    resolveCurrentSeason: jest.Mock;
    seasonStatsTtl: jest.Mock;
    getRoster: jest.Mock;
    getAthleteOverview: jest.Mock;
    getAthleteStats: jest.Mock;
    getTeamAthleteStatsFallback: jest.Mock;
  };

  beforeEach(() => {
    espn = {
      resolveCurrentSeason: jest.fn().mockResolvedValue({
        year: 2027,
        type: 1,
        name: 'Preseason',
      }),
      seasonStatsTtl: jest.fn().mockReturnValue(30_000),
      getRoster: jest.fn().mockResolvedValue({
        athletes: [
          {
            id: '4432816',
            fullName: 'LaMelo Ball',
            jersey: '1',
            position: { abbreviation: 'G' },
          },
          {
            id: '4594268',
            fullName: 'Anthony Edwards',
            jersey: '5',
            position: { abbreviation: 'G' },
          },
        ],
      }),
      getAthleteOverview: jest.fn(),
      getAthleteStats: jest.fn(),
      getTeamAthleteStatsFallback: jest.fn().mockResolvedValue({
        athletes: [
          { athlete: { id: '4432816', displayName: 'LaMelo Ball' } },
          { athlete: { id: '4594268', displayName: 'Anthony Edwards' } },
        ],
      }),
    };
    service = new TeamsService(
      espn as unknown as EspnService,
      new CacheService(),
    );
  });

  it('uses the current roster with zero stats and skips overview in preseason', async () => {
    const result = await service.findSeasonStats('16');

    expect(espn.getAthleteOverview).not.toHaveBeenCalled();
    expect(espn.getAthleteStats).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      season: 2027,
      seasonLabel: '2026–27',
      currentSeason: 2027,
      participated: true,
    });
    expect(result.players).toEqual([
      expect.objectContaining({
        id: '4432816',
        fullName: 'LaMelo Ball',
        gp: 0,
        pts: 0,
      }),
      expect.objectContaining({
        id: '4594268',
        gp: 0,
        pts: 0,
      }),
    ]);
  });

  it('returns an empty playoff table while the current season is unstarted', async () => {
    const result = await service.findSeasonStats('16', undefined, 'playoffs');

    expect(espn.getRoster).not.toHaveBeenCalled();
    expect(espn.getAthleteOverview).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      season: 2027,
      participated: false,
      players: [],
    });
  });

  it('uses the exact year and team career row once the season starts', async () => {
    espn.resolveCurrentSeason.mockResolvedValue({
      year: 2027,
      type: 2,
      name: 'Regular Season',
    });
    espn.getAthleteStats.mockResolvedValue({
      categories: [
        {
          name: 'averages',
          names: ['gamesPlayed', 'avgPoints'],
          statistics: [
            { season: { year: 2026 }, teamId: '16', stats: ['82', '30'] },
            { season: { year: 2027 }, teamId: '30', stats: ['10', '25'] },
            { season: { year: 2027 }, teamId: '16', stats: ['4', '28.1'] },
          ],
        },
      ],
    });

    const result = await service.findSeasonStats('16');

    expect(espn.getAthleteOverview).not.toHaveBeenCalled();
    expect(espn.getAthleteStats).toHaveBeenCalledTimes(2);
    expect(result.players[0]).toMatchObject({ gp: 4, pts: 28.1 });
  });

  it('keeps zeros when metadata says regular season but only last year has stats', async () => {
    espn.resolveCurrentSeason.mockResolvedValue({
      year: 2027,
      type: 2,
      name: 'Regular Season',
    });
    espn.getAthleteStats.mockResolvedValue(wolvesCareerStats);

    const result = await service.findSeasonStats('16');

    expect(result.players).toEqual([
      expect.objectContaining({
        id: '4432816',
        fullName: 'LaMelo Ball',
        gp: 0,
        pts: 0,
      }),
      expect.objectContaining({
        id: '4594268',
        gp: 0,
        pts: 0,
      }),
    ]);
  });

  it('drops historical players whose career row is another franchise', async () => {
    espn.getAthleteStats.mockImplementation((id: string) =>
      Promise.resolve(
        id === '4432816' ? hornetsCareerStats : wolvesCareerStats,
      ),
    );
    espn.getAthleteOverview.mockResolvedValue({
      statistics: {
        names: ['gamesPlayed', 'avgPoints'],
        splits: [{ displayName: 'Regular Season', stats: ['72', '20.1'] }],
      },
    });

    const result = await service.findSeasonStats('16', 2026);

    expect(result.players.map((player) => player.id)).toEqual(['4594268']);
    expect(result.players[0].gp).toBe(61);
    expect(espn.getAthleteOverview).not.toHaveBeenCalled();
    expect(result.currentSeason).toBe(2027);
  });

  it('flattens grouped ESPN rosters', async () => {
    espn.getRoster.mockResolvedValue({
      athletes: [
        {
          position: 'guard',
          items: [{ id: '4594268', fullName: 'Anthony Edwards' }],
        },
      ],
    });

    const result = await service.findSeasonStats('16');

    expect(result.players).toEqual([
      expect.objectContaining({ id: '4594268', fullName: 'Anthony Edwards' }),
    ]);
  });

  it('uses the season feed even when the roster endpoint contains current players', async () => {
    espn.getTeamAthleteStatsFallback.mockResolvedValue({
      athletes: [
        { athlete: { id: '4594268', displayName: 'Anthony Edwards' } },
      ],
    });
    espn.getAthleteStats.mockResolvedValue(wolvesCareerStats);

    const result = await service.findSeasonStats('16', 2026);

    expect(result.players).toEqual([
      expect.objectContaining({ id: '4594268', gp: 61 }),
    ]);
    expect(espn.getAthleteStats).toHaveBeenCalledTimes(1);
    expect(espn.getAthleteOverview).not.toHaveBeenCalled();
    expect(espn.getRoster).not.toHaveBeenCalled();
  });

  it('does not cache an upstream failure as an empty historical roster', async () => {
    espn.getAthleteStats.mockRejectedValue(new Error('upstream unavailable'));
    await expect(service.findSeasonStats('16', 2026)).rejects.toThrow(
      'upstream unavailable',
    );
    espn.getAthleteStats.mockResolvedValue(wolvesCareerStats);
    expect((await service.findSeasonStats('16', 2026)).players).toHaveLength(2);
  });
});
