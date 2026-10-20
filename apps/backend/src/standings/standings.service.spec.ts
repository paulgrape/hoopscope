import { EspnService } from '../espn/espn.service';
import { StandingsService } from './standings.service';

function recordEntry(options: {
  id: string;
  name: string;
  wins: number;
  losses: number;
  conference?: string;
  gamesBehind?: string;
}) {
  const stats: Array<{ name: string; value?: number; displayValue?: string }> =
    [
      { name: 'playoffSeed', value: 0 },
      { name: 'wins', value: options.wins },
      { name: 'losses', value: options.losses },
    ];
  if (options.conference) {
    stats.push({ name: 'vs. Conf.', displayValue: options.conference });
  }
  if (options.gamesBehind) {
    stats.push({ name: 'gamesBehind', displayValue: options.gamesBehind });
  }

  return {
    team: {
      id: options.id,
      name: options.name,
      displayName: `${options.name} Full`,
      shortDisplayName: options.name,
      abbreviation: options.name.slice(0, 3).toUpperCase(),
      logos: [{ href: `https://logo/${options.id}.png` }],
    },
    stats,
  };
}

function makeEntry(seed: number, name: string) {
  return {
    team: {
      id: String(seed),
      name,
      displayName: `${name} Full`,
      shortDisplayName: name,
      abbreviation: name.slice(0, 3).toUpperCase(),
      logos: [{ href: `https://logo/${seed}.png` }],
      color: '112233',
    },
    stats: [
      { name: 'playoffSeed', value: seed },
      { name: 'wins', value: 50 - seed },
      { name: 'losses', value: 20 + seed },
      { name: 'winPercent', displayValue: '.650' },
      { name: 'gamesBehind', displayValue: `${seed}.0` },
      { name: 'streak', displayValue: 'W3' },
    ],
  };
}

describe('StandingsService', () => {
  let service: StandingsService;
  let espn: { getStandings: jest.Mock };

  beforeEach(() => {
    espn = { getStandings: jest.fn() };
    service = new StandingsService(espn as unknown as EspnService);
  });

  it('maps conferences, ranks by record, and resolves playoff status', async () => {
    espn.getStandings.mockResolvedValue({
      children: [
        {
          id: '5',
          name: 'Eastern Conference',
          abbreviation: 'East',
          standings: {
            seasonDisplayName: '2025-26',
            // Deliberately unsorted, with ESPN seeds that must not be displayed.
            entries: [
              makeEntry(11, 'Wizards'),
              makeEntry(1, 'Celtics'),
              makeEntry(7, 'Heat'),
            ],
          },
        },
      ],
    });

    const result = await service.findAll();

    expect(result.season).toBe('2025-26');
    expect(result.conferences).toHaveLength(1);

    const teams = result.conferences[0].teams;
    expect(teams.map((team) => team.shortName)).toEqual([
      'Celtics',
      'Heat',
      'Wizards',
    ]);
    expect(teams.map((team) => team.seed)).toEqual([1, 2, 3]);
    expect(teams.every((team) => team.playoffStatus === 'playoff')).toBe(true);
  });

  it('numbers a conference that has not played 1 through n', async () => {
    espn.getStandings.mockResolvedValue({
      children: [
        {
          id: '5',
          name: 'Eastern Conference',
          abbreviation: 'East',
          standings: {
            entries: [
              recordEntry({ id: '1', name: 'Hawks', wins: 0, losses: 0 }),
              recordEntry({ id: '2', name: 'Celtics', wins: 0, losses: 0 }),
              recordEntry({ id: '4', name: 'Bulls', wins: 0, losses: 0 }),
            ],
          },
        },
      ],
    });

    const teams = (await service.findAll()).conferences[0].teams;

    expect(teams.map((team) => team.shortName)).toEqual([
      'Hawks',
      'Celtics',
      'Bulls',
    ]);
    expect(teams.map((team) => team.seed)).toEqual([1, 2, 3]);
  });

  it('keeps unplayed teams between the winner and the loser of the only game', async () => {
    espn.getStandings.mockResolvedValue({
      children: [
        {
          id: '5',
          name: 'Eastern Conference',
          abbreviation: 'East',
          standings: {
            entries: [
              recordEntry({ id: '1', name: 'Hawks', wins: 0, losses: 0 }),
              recordEntry({ id: '2', name: 'Celtics', wins: 1, losses: 0 }),
              recordEntry({ id: '4', name: 'Bulls', wins: 0, losses: 0 }),
              recordEntry({ id: '5', name: 'Cavaliers', wins: 0, losses: 1 }),
            ],
          },
        },
      ],
    });

    const teams = (await service.findAll()).conferences[0].teams;

    expect(teams.map((team) => team.shortName)).toEqual([
      'Celtics',
      'Hawks',
      'Bulls',
      'Cavaliers',
    ]);
    expect(teams.map((team) => team.seed)).toEqual([1, 2, 3, 4]);
    expect(teams[0].playoffStatus).toBe('playoff');
    expect(teams[3].playoffStatus).toBe('playoff');
  });

  it('shares a place for identical records and skips the next number', async () => {
    espn.getStandings.mockResolvedValue({
      children: [
        {
          id: '5',
          name: 'Eastern Conference',
          abbreviation: 'East',
          standings: {
            entries: [
              recordEntry({ id: '1', name: 'Hawks', wins: 12, losses: 4 }),
              recordEntry({ id: '2', name: 'Celtics', wins: 10, losses: 6 }),
              recordEntry({ id: '4', name: 'Bulls', wins: 10, losses: 6 }),
              recordEntry({ id: '5', name: 'Cavaliers', wins: 8, losses: 8 }),
            ],
          },
        },
      ],
    });

    const teams = (await service.findAll()).conferences[0].teams;

    expect(teams.map((team) => team.seed)).toEqual([1, 2, 2, 4]);
    expect(teams[1].playoffStatus).toBe('playoff');
    expect(teams[2].playoffStatus).toBe('playoff');
  });

  it('separates the same record by conference record', async () => {
    espn.getStandings.mockResolvedValue({
      children: [
        {
          id: '5',
          name: 'Eastern Conference',
          abbreviation: 'East',
          standings: {
            entries: [
              recordEntry({
                id: '4',
                name: 'Bulls',
                wins: 10,
                losses: 6,
                conference: '4-6',
              }),
              recordEntry({
                id: '2',
                name: 'Celtics',
                wins: 10,
                losses: 6,
                conference: '8-2',
              }),
            ],
          },
        },
      ],
    });

    const teams = (await service.findAll()).conferences[0].teams;

    expect(teams.map((team) => team.shortName)).toEqual(['Celtics', 'Bulls']);
    expect(teams.map((team) => team.seed)).toEqual([1, 2]);
  });

  it('marks places 7-10 as play-in and 11-15 as out', async () => {
    espn.getStandings.mockResolvedValue({
      children: [
        {
          id: '5',
          name: 'Eastern Conference',
          abbreviation: 'East',
          standings: {
            entries: Array.from({ length: 15 }, (_, index) =>
              recordEntry({
                id: String(index + 1),
                name: `Team ${index + 1}`,
                wins: 15 - index,
                losses: index,
              }),
            ),
          },
        },
      ],
    });

    const teams = (await service.findAll()).conferences[0].teams;

    expect(teams.map((team) => team.seed)).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 1),
    );
    expect(teams[5].playoffStatus).toBe('playoff');
    expect(teams[6].playoffStatus).toBe('play-in');
    expect(teams[9].playoffStatus).toBe('play-in');
    expect(teams[10].playoffStatus).toBe('out');
  });

  it('ranks each division 1-5 and keeps the conference playoff status', async () => {
    const eastIds = [
      '1',
      '2',
      '4',
      '5',
      '8',
      '11',
      '14',
      '15',
      '17',
      '18',
      '19',
      '20',
      '27',
      '28',
      '30',
    ];
    const atlantic = new Set(['2', '17', '18', '20', '28']);
    const otherWins = new Map(
      eastIds
        .filter((id) => !atlantic.has(id))
        .map((id, index) => [id, 40 - index]),
    );

    espn.getStandings.mockResolvedValue({
      children: [
        {
          id: '5',
          name: 'Eastern Conference',
          abbreviation: 'East',
          standings: {
            entries: eastIds.map((id) => {
              const wins = otherWins.get(id);
              if (wins != null) {
                return recordEntry({
                  id,
                  name: `Team ${id}`,
                  wins,
                  losses: 10,
                  gamesBehind: '4.0',
                });
              }
              const atlanticRecord: Record<string, [number, number]> = {
                '2': [15, 20],
                '17': [10, 25],
                '18': [8, 27],
                '20': [6, 29],
                '28': [4, 31],
              };
              const [atlanticWins, atlanticLosses] = atlanticRecord[id];
              return recordEntry({
                id,
                name: id === '2' ? 'Celtics' : `Team ${id}`,
                wins: atlanticWins,
                losses: atlanticLosses,
                gamesBehind: '9.0',
              });
            }),
          },
        },
        {
          id: '6',
          name: 'Western Conference',
          abbreviation: 'West',
          standings: {
            entries: [
              recordEntry({ id: '7', name: 'Nuggets', wins: 12, losses: 4 }),
            ],
          },
        },
      ],
    });

    const [east, west] = (await service.findAll()).conferences;
    const celtics = east.teams.find((team) => team.id === '2');
    const atlanticDivision = east.divisions.find(
      (division) => division.id === 'atlantic',
    );

    expect(east.divisions.map((division) => division.name)).toEqual([
      'Atlantic',
      'Central',
      'Southeast',
    ]);
    expect(atlanticDivision?.teams.map((team) => team.id)).toEqual([
      '2',
      '17',
      '18',
      '20',
      '28',
    ]);
    expect(atlanticDivision?.teams.map((team) => team.seed)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(atlanticDivision?.teams.map((team) => team.gamesBehind)).toEqual([
      '-',
      '5.0',
      '7.0',
      '9.0',
      '11.0',
    ]);
    expect(celtics?.seed).toBe(11);
    expect(celtics?.playoffStatus).toBe('out');
    expect(celtics?.gamesBehind).toBe('9.0');
    expect(atlanticDivision?.teams[0].playoffStatus).toBe('out');
    expect(atlanticDivision?.teams[0].gamesBehind).toBe('-');
    expect(west.divisions.map((division) => division.name)).toEqual([
      'Northwest',
    ]);
  });

  it('extracts stats with displayValue over raw value', async () => {
    espn.getStandings.mockResolvedValue({
      children: [
        {
          id: '5',
          name: 'East',
          abbreviation: 'E',
          standings: { entries: [makeEntry(3, 'Knicks')] },
        },
      ],
    });

    const [team] = (await service.findAll()).conferences[0].teams;

    expect(team.wins).toBe(47);
    expect(team.losses).toBe(23);
    expect(team.winPct).toBe('.650');
    expect(team.gamesBehind).toBe('3.0');
    expect(team.streak).toBe('W3');
    expect(team.logo).toBe('https://logo/3.png');
    // Missing stats fall back to an em dash placeholder.
    expect(team.home).toBe('—');
    expect(team.lastTen).toBe('—');
  });

  it('handles an empty upstream response', async () => {
    espn.getStandings.mockResolvedValue({});

    const result = await service.findAll();

    expect(result.season).toBe('Current Season');
    expect(result.conferences).toEqual([]);
  });
});
