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
  let espn: {
    getTeam: jest.Mock;
    resolveCurrentSeason: jest.Mock;
    getTeamSeasonRecord: jest.Mock;
    getSeasonGroup: jest.Mock;
    getTeamHeadCoach: jest.Mock;
  };

  beforeEach(() => {
    espn = {
      getTeam: jest.fn(),
      resolveCurrentSeason: jest.fn().mockResolvedValue({
        year: 2027,
        type: 2,
        name: 'Regular Season',
      }),
      getTeamSeasonRecord: jest.fn().mockResolvedValue(null),
      getSeasonGroup: jest.fn().mockResolvedValue(null),
      getTeamHeadCoach: jest.fn().mockResolvedValue(null),
    };
    service = new TeamsService(
      espn as unknown as EspnService,
      new CacheService(),
    );
  });

  it('uses the previous regular season during preseason and ignores the live record', async () => {
    espn.resolveCurrentSeason.mockResolvedValue({
      year: 2027,
      type: 1,
      name: 'Preseason',
    });
    espn.getTeam.mockResolvedValue({
      team: {
        id: '16',
        name: 'Timberwolves',
        abbreviation: 'MIN',
        displayName: 'Minnesota Timberwolves',
        logos: [{ href: 'https://logo/16.png' }],
        color: '266092',
        alternateColor: '79bc43',
        location: 'Minnesota',
        record: { items: [{ type: 'total', summary: '1-1' }] },
        groups: { id: '11', parent: { id: '6' }, isConference: false },
        franchise: {
          venue: {
            fullName: 'Target Center',
            address: { city: 'Minneapolis', state: 'MN' },
          },
        },
      },
    });
    espn.getTeamSeasonRecord.mockResolvedValue({
      items: [
        {
          type: 'total',
          summary: '49-33',
          stats: [
            { name: 'avgPointsFor', displayValue: '118.0' },
            { name: 'avgPointsAgainst', displayValue: '114.6' },
            { name: 'streak', displayValue: 'W2' },
            { name: 'playoffSeed', displayValue: '6', value: 6 },
          ],
        },
        { type: 'home', summary: '26-15' },
        { type: 'road', summary: '23-18' },
        { type: 'vsdiv', summary: '9-7' },
        { type: 'vsconf', summary: '31-21' },
      ],
    });
    espn.getSeasonGroup.mockImplementation(
      (_season: number, groupId: string) => {
        if (groupId === '11') {
          return Promise.resolve({
            id: '11',
            name: 'Northwest',
            isConference: false,
          });
        }
        if (groupId === '6') {
          return Promise.resolve({
            id: '6',
            name: 'Western Conference',
            isConference: true,
          });
        }
        return Promise.resolve(null);
      },
    );
    espn.getTeamHeadCoach.mockResolvedValue({
      firstName: 'Chris',
      lastName: 'Finch',
    });

    await expect(service.findOne('16')).resolves.toMatchObject({
      id: '16',
      displayName: 'Minnesota Timberwolves',
      logo: 'https://logo/16.png',
      conference: 'Western Conference',
      division: 'Northwest',
      venue: 'Target Center',
      venueLocation: 'Minneapolis, MN',
      coach: 'Chris Finch',
      record: {
        season: 2026,
        seasonLabel: '2025–26',
        summary: '49-33',
        home: '26-15',
        road: '23-18',
        divisionRecord: '9-7',
        conferenceRecord: '31-21',
        pointsPerGame: '118.0',
        opponentPointsPerGame: '114.6',
        streak: 'W2',
        playoffSeed: '6',
      },
    });
    expect(espn.getTeamSeasonRecord).toHaveBeenCalledWith('16', 2026, 2027);
    expect(espn.getSeasonGroup).toHaveBeenCalledWith(2026, '11');
    expect(espn.getSeasonGroup).toHaveBeenCalledWith(2026, '6');
  });

  it('uses the current regular season once it has started', async () => {
    espn.getTeam.mockResolvedValue({
      team: {
        id: '13',
        name: 'Lakers',
        abbreviation: 'LAL',
        displayName: 'Los Angeles Lakers',
        location: 'Los Angeles',
        record: { items: [{ summary: '1-1' }] },
      },
    });
    espn.getTeamSeasonRecord.mockResolvedValue({
      items: [
        {
          type: 'total',
          summary: '10-2',
          stats: [{ name: 'playoffSeed', displayValue: '0', value: 0 }],
        },
      ],
    });

    const result = await service.findOne('13');

    expect(espn.getTeamSeasonRecord).toHaveBeenCalledWith('13', 2027, 2027);
    expect(result.record.summary).toBe('10-2');
    expect(result.record.seasonLabel).toBe('2026–27');
    expect(result.record.playoffSeed).toBeNull();
    expect(result.coach).toBeNull();
  });

  it('keeps the team when supplemental ESPN calls fail', async () => {
    espn.getTeam.mockResolvedValue({
      team: {
        id: '13',
        name: 'Lakers',
        abbreviation: 'LAL',
        displayName: 'Los Angeles Lakers',
        location: 'Los Angeles',
        groups: { id: '7', parent: { id: '5' } },
        record: { items: [{ summary: '1-1' }] },
      },
    });
    espn.getTeamSeasonRecord.mockRejectedValue(new Error('down'));
    espn.getSeasonGroup.mockRejectedValue(new Error('down'));
    espn.getTeamHeadCoach.mockRejectedValue(new Error('down'));

    const result = await service.findOne('13');

    expect(result.displayName).toBe('Los Angeles Lakers');
    expect(result.record.summary).toBeNull();
    expect(result.record.season).toBe(2027);
    expect(result.conference).toBeNull();
    expect(result.division).toBeNull();
    expect(result.coach).toBeNull();
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
      seasonComplete: false,
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
      seasonComplete: false,
      participated: false,
      players: [],
    });
  });

  it('marks a past season and the offseason complete', async () => {
    espn.getAthleteStats.mockResolvedValue(wolvesCareerStats);

    const past = await service.findSeasonStats('16', 2026);
    expect(past.seasonComplete).toBe(true);

    espn.resolveCurrentSeason.mockResolvedValue({
      year: 2027,
      type: 4,
      name: 'Off Season',
    });
    const offseason = await service.findSeasonStats('16');
    expect(offseason.seasonComplete).toBe(true);
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
    expect(result.seasonComplete).toBe(false);
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

describe('TeamsService.findSchedule', () => {
  let service: TeamsService;
  let espn: {
    resolveCurrentSeason: jest.Mock;
    getTeamSchedule: jest.Mock;
  };

  const espnScheduleFixture = {
    events: [
      {
        id: '401812482',
        date: '2025-10-04T02:00Z',
        name: 'Phoenix Suns at Los Angeles Lakers',
        shortName: 'PHX VS LAL',
        season: { year: 2026, displayName: '2025-26' },
        seasonType: {
          id: '1',
          type: 1,
          name: 'Preseason',
          abbreviation: 'pre',
        },
        competitions: [
          {
            id: '401812482',
            date: '2025-10-04T02:00Z',
            venue: { fullName: 'Acrisure Arena' },
            status: {
              period: 4,
              displayClock: '0.0',
              type: {
                state: 'post',
                description: 'Final',
                detail: 'Final',
                shortDetail: 'Final',
              },
            },
            competitors: [
              {
                id: '13',
                homeAway: 'home',
                winner: false,
                score: { value: 104, displayValue: '104' },
                team: {
                  id: '13',
                  abbreviation: 'LAL',
                  displayName: 'Los Angeles Lakers',
                  shortDisplayName: 'Lakers',
                  logos: [{ href: 'https://logo/lal.png' }],
                },
              },
              {
                id: '21',
                homeAway: 'away',
                winner: true,
                score: { value: 118, displayValue: '118' },
                team: {
                  id: '21',
                  abbreviation: 'PHX',
                  displayName: 'Phoenix Suns',
                  shortDisplayName: 'Suns',
                  logos: [{ href: 'https://logo/phx.png' }],
                },
              },
            ],
          },
        ],
      },
      {
        id: '401809244',
        date: '2025-10-22T02:00Z',
        name: 'Los Angeles Lakers at Golden State Warriors',
        shortName: 'LAL @ GS',
        season: { year: 2026, displayName: '2025-26' },
        seasonType: {
          id: '2',
          type: 2,
          name: 'Regular Season',
          abbreviation: 'reg',
        },
        competitions: [
          {
            id: '401809244',
            date: '2025-10-22T02:00Z',
            venue: { fullName: 'Chase Center' },
            status: {
              period: 4,
              displayClock: '0.0',
              type: {
                state: 'post',
                description: 'Final',
                detail: 'Final',
                shortDetail: 'Final',
              },
            },
            competitors: [
              {
                id: '9',
                homeAway: 'home',
                winner: false,
                score: { value: 109, displayValue: '109' },
                team: {
                  id: '9',
                  abbreviation: 'GSW',
                  displayName: 'Golden State Warriors',
                  shortDisplayName: 'Warriors',
                  logos: [{ href: 'https://logo/gsw.png' }],
                },
              },
              {
                id: '13',
                homeAway: 'away',
                winner: true,
                score: { value: 119, displayValue: '119' },
                team: {
                  id: '13',
                  abbreviation: 'LAL',
                  displayName: 'Los Angeles Lakers',
                  shortDisplayName: 'Lakers',
                  logos: [{ href: 'https://logo/lal.png' }],
                },
              },
            ],
          },
        ],
      },
      {
        id: '401809300',
        date: '2025-10-25T02:30Z',
        name: 'Sacramento Kings at Los Angeles Lakers',
        shortName: 'SAC @ LAL',
        season: { year: 2026, displayName: '2025-26' },
        seasonType: {
          id: '2',
          type: 2,
          name: 'Regular Season',
          abbreviation: 'reg',
        },
        competitions: [
          {
            id: '401809300',
            date: '2025-10-25T02:30Z',
            venue: { fullName: 'crypto.com Arena' },
            status: {
              period: 3,
              displayClock: '4:12',
              type: {
                state: 'in',
                description: 'In Progress',
                shortDetail: '4:12 - 3rd',
              },
            },
            competitors: [
              {
                id: '13',
                homeAway: 'home',
                score: { value: 82, displayValue: '82' },
                team: {
                  id: '13',
                  abbreviation: 'LAL',
                  displayName: 'Los Angeles Lakers',
                  shortDisplayName: 'Lakers',
                },
              },
              {
                id: '23',
                homeAway: 'away',
                score: { value: 79, displayValue: '79' },
                team: {
                  id: '23',
                  abbreviation: 'SAC',
                  displayName: 'Sacramento Kings',
                  shortDisplayName: 'Kings',
                },
              },
            ],
          },
        ],
      },
      {
        id: '401909092',
        date: '2025-10-28T02:00Z',
        name: 'Denver Nuggets at Los Angeles Lakers',
        shortName: 'DEN @ LAL',
        season: { year: 2026, displayName: '2025-26' },
        seasonType: {
          id: '2',
          type: 2,
          name: 'Regular Season',
          abbreviation: 'reg',
        },
        competitions: [
          {
            id: '401909092',
            date: '2025-10-28T02:00Z',
            venue: { fullName: 'crypto.com Arena' },
            status: {
              period: 0,
              displayClock: '0.0',
              type: {
                state: 'pre',
                description: 'Scheduled',
                shortDetail: '10/27 - 10:00 PM EDT',
              },
            },
            competitors: [
              {
                id: '13',
                homeAway: 'home',
                team: {
                  id: '13',
                  abbreviation: 'LAL',
                  displayName: 'Los Angeles Lakers',
                  shortDisplayName: 'Lakers',
                },
              },
              {
                id: '7',
                homeAway: 'away',
                team: {
                  id: '7',
                  abbreviation: 'DEN',
                  displayName: 'Denver Nuggets',
                  shortDisplayName: 'Nuggets',
                },
              },
            ],
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    espn = {
      resolveCurrentSeason: jest.fn().mockResolvedValue({
        year: 2026,
        type: 2,
        name: 'Regular Season',
      }),
      getTeamSchedule: jest.fn().mockResolvedValue(espnScheduleFixture),
    };
    service = new TeamsService(
      espn as unknown as EspnService,
      new CacheService(),
    );
  });

  it('normalizes final, live, and scheduled team schedule events including competition-level status', async () => {
    const schedule = await service.findSchedule('13');

    expect(espn.getTeamSchedule).toHaveBeenCalledWith('13', 2026, 2026);
    expect(schedule.season).toBe(2026);
    expect(schedule.seasonLabel).toBe('2025–26');
    expect(schedule.currentSeason).toBe(2026);
    const [preseason, regularFinal, live, scheduled] = schedule.games;
    expect(preseason).toMatchObject({
      id: '401812482',
      seasonType: 'preseason',
      status: 'final',
      statusDetail: 'Final',
      homeScore: 104,
      awayScore: 118,
      venue: 'Acrisure Arena',
      isHome: true,
      result: 'L',
    });
    expect(preseason?.homeTeam).toMatchObject({
      id: '13',
      name: 'Lakers',
      abbreviation: 'LAL',
    });
    expect(preseason?.awayTeam).toMatchObject({
      id: '21',
      name: 'Suns',
      abbreviation: 'PHX',
    });
    expect(regularFinal).toMatchObject({
      id: '401809244',
      seasonType: 'regular',
      status: 'final',
      homeScore: 109,
      awayScore: 119,
      venue: 'Chase Center',
      isHome: false,
      result: 'W',
    });
    expect(live).toMatchObject({
      id: '401809300',
      seasonType: 'regular',
      status: 'live',
      statusDetail: '4:12 - 3rd',
      period: 3,
      clock: '4:12',
      homeScore: 82,
      awayScore: 79,
      isHome: true,
      result: null,
    });
    expect(scheduled).toMatchObject({
      id: '401909092',
      seasonType: 'regular',
      status: 'scheduled',
      statusDetail: '10/27 - 10:00 PM EDT',
      homeScore: null,
      awayScore: null,
      isHome: true,
      result: null,
    });
  });

  it('forwards an explicit season to ESPN and turns 404 into NotFoundException', async () => {
    await service.findSchedule('13', 2025);
    expect(espn.getTeamSchedule).toHaveBeenCalledWith('13', 2025, 2026);

    espn.getTeamSchedule.mockRejectedValue(upstreamNotFound());
    await expect(service.findSchedule('999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
