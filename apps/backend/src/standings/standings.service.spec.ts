import { EspnService } from '../espn/espn.service';
import { StandingsService } from './standings.service';

function recordEntry(options: {
  id: string;
  name: string;
  wins: number;
  losses: number;
  conference?: string;
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
