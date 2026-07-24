import { EspnService } from '../espn/espn.service';
import { StandingsService } from './standings.service';

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

  it('maps conferences, sorts by seed, and resolves playoff status', async () => {
    espn.getStandings.mockResolvedValue({
      children: [
        {
          id: '5',
          name: 'Eastern Conference',
          abbreviation: 'East',
          standings: {
            seasonDisplayName: '2025-26',
            // Deliberately unsorted seeds.
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
    expect(teams.map((team) => team.seed)).toEqual([1, 7, 11]);
    expect(teams[0].playoffStatus).toBe('playoff');
    expect(teams[1].playoffStatus).toBe('play-in');
    expect(teams[2].playoffStatus).toBe('out');
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
