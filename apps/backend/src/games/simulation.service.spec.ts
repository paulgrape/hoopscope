import { SimulationService, type LiveGameState } from './simulation.service';

jest.mock('./data', () => ({
  HISTORIC_GAMES: [
    {
      id: 'game-1',
      name: 'Test Game',
      date: '2020-01-01T00:00:00Z',
      homeTeam: {
        id: 'h',
        name: 'Home',
        abbreviation: 'HOM',
        logo: '',
        color: '',
      },
      awayTeam: {
        id: 'a',
        name: 'Away',
        abbreviation: 'AWY',
        logo: '',
        color: '',
      },
      finalScore: { home: 4, away: 2 },
      plays: [
        {
          id: 'p1',
          period: 1,
          clock: '12:00',
          text: 'Tip-off',
          homeScore: 0,
          awayScore: 0,
        },
        {
          id: 'p2',
          period: 1,
          clock: '11:58',
          text: 'Home bucket',
          homeScore: 2,
          awayScore: 0,
        },
        {
          id: 'p3',
          period: 1,
          clock: '11:55',
          text: 'Away bucket',
          homeScore: 2,
          awayScore: 2,
        },
        {
          id: 'p4',
          period: 1,
          clock: '11:50',
          text: 'Home bucket',
          homeScore: 4,
          awayScore: 2,
        },
      ],
    },
  ],
}));

describe('SimulationService', () => {
  let service: SimulationService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new SimulationService();
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.useRealTimers();
  });

  it('exposes seeded games after startAll', () => {
    service.startAll();

    const games = service.getActiveGames();
    expect(games).toHaveLength(1);
    expect(games[0].id).toBe('game-1');
    expect(service.getGame('game-1')?.status).toBe('live');
    expect(service.getGame('unknown')).toBeNull();
  });

  it('replays plays over time and finishes with the final score', () => {
    const ticks: LiveGameState[] = [];
    const state = service.startReplay('client-1', 'game-1', 1, (tick) =>
      ticks.push(tick),
    );

    expect(state).not.toBeNull();
    // Initial tick with the first play.
    expect(ticks).toHaveLength(1);
    expect(ticks[0].playIndex).toBe(1);

    // Game-clock gaps: 2s, 3s, 5s between the plays.
    jest.advanceTimersByTime(2000);
    expect(ticks).toHaveLength(2);
    expect(ticks[1].homeScore).toBe(2);

    jest.advanceTimersByTime(3000);
    jest.advanceTimersByTime(5000);

    const finalTick = ticks[ticks.length - 1];
    expect(finalTick.status).toBe('final');
    expect(finalTick.homeScore).toBe(4);
    expect(finalTick.awayScore).toBe(2);
    expect(finalTick.playIndex).toBe(4);
  });

  it('speeds up the replay according to pace', () => {
    const ticks: LiveGameState[] = [];
    service.startReplay('client-1', 'game-1', 2, (tick) => ticks.push(tick));

    // At 2x pace the 2s gap fires after 1s.
    jest.advanceTimersByTime(999);
    expect(ticks).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(ticks).toHaveLength(2);
  });

  it('normalizes invalid pace values to 1x', () => {
    const ticks: LiveGameState[] = [];
    service.startReplay('client-1', 'game-1', 99, (tick) => ticks.push(tick));

    jest.advanceTimersByTime(1999);
    expect(ticks).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(ticks).toHaveLength(2);
  });

  it('stops emitting after stopReplay', () => {
    const ticks: LiveGameState[] = [];
    service.startReplay('client-1', 'game-1', 1, (tick) => ticks.push(tick));
    service.stopReplay('client-1', 'game-1');

    jest.advanceTimersByTime(60_000);
    expect(ticks).toHaveLength(1);
  });

  it('stops all sessions for a disconnecting client', () => {
    const ticks: LiveGameState[] = [];
    service.startReplay('client-1', 'game-1', 1, (tick) => ticks.push(tick));
    service.stopClient('client-1');

    jest.advanceTimersByTime(60_000);
    expect(ticks).toHaveLength(1);
  });

  it('returns null for unknown games', () => {
    expect(
      service.startReplay('client-1', 'nope', 1, () => undefined),
    ).toBeNull();
  });
});
