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
      venue: 'Test Arena',
      periodScores: { home: [4], away: [2] },
      homePlayers: [
        {
          name: 'Home Star',
          points: 4,
          rebounds: 3,
          assists: 2,
          minutes: '30',
        },
      ],
      awayPlayers: [
        {
          name: 'Away Star',
          points: 2,
          rebounds: 5,
          assists: 1,
          minutes: '28',
        },
      ],
      finalScore: { home: 4, away: 2 },
      plays: [
        {
          id: 'p1',
          sequenceNumber: 1,
          period: 1,
          clock: '12:00',
          text: 'Tip-off',
          shortText: 'Jump Ball',
          scoringPlay: false,
          scoreValue: 0,
          homeScore: 0,
          awayScore: 0,
        },
        {
          id: 'p2',
          sequenceNumber: 2,
          period: 1,
          clock: '11:58',
          text: 'Home bucket',
          shortText: '+2 Points',
          scoringPlay: true,
          scoreValue: 2,
          teamId: 'h',
          homeScore: 2,
          awayScore: 0,
        },
        {
          id: 'p3',
          sequenceNumber: 3,
          period: 1,
          clock: '11:55',
          text: 'Away bucket',
          shortText: '+2 Points',
          scoringPlay: true,
          scoreValue: 2,
          teamId: 'a',
          homeScore: 2,
          awayScore: 2,
        },
        {
          id: 'p4',
          sequenceNumber: 4,
          period: 1,
          clock: '11:50',
          text: 'Home bucket',
          shortText: '+2 Points',
          scoringPlay: true,
          scoreValue: 2,
          teamId: 'h',
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

  it('exposes an elapsed-time timeline and enriched plays', () => {
    const state = service.startReplay('client-1', 'game-1', 1, () => undefined);

    expect(state?.venue).toBe('Test Arena');
    expect(state?.paused).toBe(false);
    expect(state?.timeline).toHaveLength(4);
    // Q1 starts at 12:00, so a play at 11:58 sits 2 seconds into the game.
    expect(state?.timeline[1]).toEqual({
      index: 1,
      period: 1,
      elapsedSeconds: 2,
    });
    expect(state?.plays[0].shortText).toBe('Jump Ball');
    expect(state?.plays[0].scoringPlay).toBe(false);
  });

  it('reveals final period scores and players only at the end', () => {
    const ticks: LiveGameState[] = [];
    service.startReplay('client-1', 'game-1', 1, (tick) => ticks.push(tick));

    expect(ticks[0].periodScores).toBeUndefined();
    expect(ticks[0].finalPlayers).toBeUndefined();

    jest.advanceTimersByTime(60_000);

    const finalTick = ticks[ticks.length - 1];
    expect(finalTick.periodScores).toEqual({ home: [4], away: [2] });
    expect(finalTick.finalPlayers?.home[0].name).toBe('Home Star');
  });

  it('seeks forward and backward within the replay', () => {
    const ticks: LiveGameState[] = [];
    service.startReplay('client-1', 'game-1', 1, (tick) => ticks.push(tick));

    const forward = service.seekReplay('client-1', 'game-1', 2, (tick) =>
      ticks.push(tick),
    );
    expect(forward?.playIndex).toBe(3);
    expect(forward?.status).toBe('live');
    expect(forward?.plays).toHaveLength(3);
    expect(forward?.awayScore).toBe(2);

    const backward = service.seekReplay('client-1', 'game-1', 0, (tick) =>
      ticks.push(tick),
    );
    expect(backward?.playIndex).toBe(1);
    expect(backward?.plays).toHaveLength(1);
    expect(backward?.homeScore).toBe(0);

    // Replay keeps ticking from the new position.
    const tickCount = ticks.length;
    jest.advanceTimersByTime(2000);
    expect(ticks).toHaveLength(tickCount + 1);
    expect(ticks[ticks.length - 1].playIndex).toBe(2);
  });

  it('clamps seek targets to the available plays', () => {
    service.startReplay('client-1', 'game-1', 1, () => undefined);

    const beyondEnd = service.seekReplay(
      'client-1',
      'game-1',
      99,
      () => undefined,
    );
    expect(beyondEnd?.playIndex).toBe(4);
    expect(beyondEnd?.status).toBe('final');

    const beforeStart = service.seekReplay(
      'client-1',
      'game-1',
      -5,
      () => undefined,
    );
    expect(beforeStart?.playIndex).toBe(1);
    expect(beforeStart?.status).toBe('live');
  });

  it('stays seekable after the replay reaches the end', () => {
    const ticks: LiveGameState[] = [];
    service.startReplay('client-1', 'game-1', 1, (tick) => ticks.push(tick));
    jest.advanceTimersByTime(60_000);
    expect(ticks[ticks.length - 1].status).toBe('final');

    const replayed = service.seekReplay('client-1', 'game-1', 1, (tick) =>
      ticks.push(tick),
    );
    expect(replayed?.status).toBe('live');
    expect(replayed?.playIndex).toBe(2);

    const tickCount = ticks.length;
    jest.advanceTimersByTime(3000);
    expect(ticks.length).toBeGreaterThan(tickCount);
  });

  it('pauses the replay and resumes with the remaining gap', () => {
    const ticks: LiveGameState[] = [];
    service.startReplay('client-1', 'game-1', 1, (tick) => ticks.push(tick));

    // 1.2s into the 2s gap before the second play.
    jest.advanceTimersByTime(1200);
    const paused = service.pauseReplay('client-1', 'game-1', (tick) =>
      ticks.push(tick),
    );
    expect(paused?.paused).toBe(true);
    const pausedTickCount = ticks.length;

    jest.advanceTimersByTime(60_000);
    expect(ticks).toHaveLength(pausedTickCount);

    service.resumeReplay('client-1', 'game-1', (tick) => ticks.push(tick));
    // Resume tick only, the play is still 800ms away.
    expect(ticks).toHaveLength(pausedTickCount + 1);
    expect(ticks[ticks.length - 1].paused).toBe(false);

    jest.advanceTimersByTime(799);
    expect(ticks).toHaveLength(pausedTickCount + 1);
    jest.advanceTimersByTime(1);
    expect(ticks[ticks.length - 1].playIndex).toBe(2);
  });

  it('keeps a seek paused while the replay is paused', () => {
    const ticks: LiveGameState[] = [];
    service.startReplay('client-1', 'game-1', 1, (tick) => ticks.push(tick));
    service.pauseReplay('client-1', 'game-1', (tick) => ticks.push(tick));

    const seeked = service.seekReplay('client-1', 'game-1', 2, (tick) =>
      ticks.push(tick),
    );
    expect(seeked?.paused).toBe(true);

    const tickCount = ticks.length;
    jest.advanceTimersByTime(60_000);
    expect(ticks).toHaveLength(tickCount);
  });

  it('returns null when pausing or resuming without a session', () => {
    expect(
      service.pauseReplay('client-1', 'game-1', () => undefined),
    ).toBeNull();
    expect(
      service.resumeReplay('client-1', 'game-1', () => undefined),
    ).toBeNull();
  });

  it('returns null for unknown games', () => {
    expect(
      service.startReplay('client-1', 'nope', 1, () => undefined),
    ).toBeNull();
  });
});
