import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  HISTORIC_GAMES,
  type HistoricGame,
  type HistoricPlayEvent,
  type TeamSnapshot,
} from './data';

export type ReplayPace = 1 | 1.5 | 2 | 3;

export interface LivePlayEvent {
  id: string;
  period: number;
  clock: string;
  text: string;
  homeScore: number;
  awayScore: number;
}

export interface LiveGameState {
  id: string;
  name: string;
  date: string;
  homeTeam: TeamSnapshot;
  awayTeam: TeamSnapshot;
  homeScore: number;
  awayScore: number;
  quarter: number;
  clock: string;
  lastPlay: string;
  status: 'live' | 'final';
  playIndex: number;
  totalPlays: number;
  plays: LivePlayEvent[];
}

interface ReplaySession {
  game: HistoricGame;
  state: LiveGameState;
  nextIndex: number;
  pace: ReplayPace;
  timer: NodeJS.Timeout | null;
  scheduledAt: number | null;
  scheduledBaseDelayMs: number;
}

@Injectable()
export class SimulationService implements OnModuleDestroy {
  private readonly logger = new Logger(SimulationService.name);
  private readonly fallbackDelayMs = this.positiveNumber(
    process.env.HISTORIC_GAME_TICK_MS,
    1000,
    0,
  );
  private states = new Map<string, LiveGameState>();
  private sessions = new Map<string, ReplaySession>();

  onModuleDestroy() {
    this.stopAll();
  }

  getActiveGames(): LiveGameState[] {
    return [...this.states.values()];
  }

  getGame(id: string): LiveGameState | null {
    return this.states.get(id) ?? null;
  }

  startAll() {
    this.stopAll();

    if (HISTORIC_GAMES.length === 0) {
      this.logger.warn('No historic games loaded; simulation skipped');
      return;
    }

    for (const game of HISTORIC_GAMES) {
      if (game.plays.length === 0) {
        this.logger.warn(`Historic game ${game.id} has no plays; skipped`);
        continue;
      }

      this.states.set(game.id, this.createState(game, 0));
    }
  }

  startReplay(
    clientId: string,
    gameId: string,
    pace: number,
    onTick: (state: LiveGameState) => void,
  ): LiveGameState | null {
    const game = this.findGame(gameId);
    if (!game || game.plays.length === 0) return null;

    this.stopReplay(clientId, gameId);

    const state = this.createState(game, 0);
    const session: ReplaySession = {
      game,
      state,
      nextIndex: 1,
      pace: this.normalizePace(pace),
      timer: null,
      scheduledAt: null,
      scheduledBaseDelayMs: 0,
    };

    this.sessions.set(this.sessionKey(clientId, gameId), session);
    onTick(this.cloneState(state));
    this.scheduleNextPlay(clientId, gameId, onTick);

    return state;
  }

  setReplayPace(
    clientId: string,
    gameId: string,
    pace: number,
    onTick: (state: LiveGameState) => void,
  ): LiveGameState | null {
    const key = this.sessionKey(clientId, gameId);
    const session = this.sessions.get(key);
    if (!session) {
      return this.startReplay(clientId, gameId, pace, onTick);
    }

    const nextPace = this.normalizePace(pace);
    const remainingBaseDelayMs = this.remainingBaseDelay(session);
    if (session.timer) clearTimeout(session.timer);
    session.timer = null;
    session.pace = nextPace;
    this.scheduleNextPlay(clientId, gameId, onTick, remainingBaseDelayMs);

    return session.state;
  }

  stopReplay(clientId: string, gameId: string) {
    const key = this.sessionKey(clientId, gameId);
    const session = this.sessions.get(key);
    if (session?.timer) clearTimeout(session.timer);
    this.sessions.delete(key);
  }

  stopClient(clientId: string) {
    for (const key of this.sessions.keys()) {
      if (!key.startsWith(`${clientId}:`)) continue;
      const session = this.sessions.get(key);
      if (session?.timer) clearTimeout(session.timer);
      this.sessions.delete(key);
    }
  }

  private stopAll() {
    this.sessions.forEach((session) => {
      if (session.timer) clearTimeout(session.timer);
    });
    this.sessions.clear();
    this.states.clear();
  }

  private scheduleNextPlay(
    clientId: string,
    gameId: string,
    onTick: (state: LiveGameState) => void,
    remainingBaseDelayMs?: number,
  ) {
    const key = this.sessionKey(clientId, gameId);
    const session = this.sessions.get(key);
    if (!session || session.state.status === 'final') return;

    if (session.nextIndex >= session.game.plays.length) {
      this.finishReplay(clientId, gameId, onTick);
      return;
    }

    const previousPlay = session.game.plays[session.nextIndex - 1];
    const nextPlay = session.game.plays[session.nextIndex];
    const baseDelayMs =
      remainingBaseDelayMs ?? this.delayBetweenPlays(previousPlay, nextPlay);
    const delayMs = baseDelayMs / session.pace;

    session.scheduledAt = Date.now();
    session.scheduledBaseDelayMs = baseDelayMs;
    session.timer = setTimeout(() => {
      this.emitNextPlay(clientId, gameId, onTick);
    }, delayMs);
  }

  private emitNextPlay(
    clientId: string,
    gameId: string,
    onTick: (state: LiveGameState) => void,
  ) {
    const key = this.sessionKey(clientId, gameId);
    const session = this.sessions.get(key);
    if (!session || session.state.status === 'final') return;
    session.timer = null;
    session.scheduledAt = null;
    session.scheduledBaseDelayMs = 0;

    const nextPlay = session.game.plays[session.nextIndex];
    if (!nextPlay) {
      this.finishReplay(clientId, gameId, onTick);
      return;
    }

    this.applyPlay(session.state, nextPlay, session.nextIndex);
    session.nextIndex += 1;

    if (session.nextIndex >= session.game.plays.length) {
      session.state.status = 'final';
      session.state.homeScore = session.game.finalScore.home;
      session.state.awayScore = session.game.finalScore.away;
      this.sessions.delete(key);
    }

    onTick(this.cloneState(session.state));

    if (session.state.status !== 'final') {
      this.scheduleNextPlay(clientId, gameId, onTick);
    }
  }

  private finishReplay(
    clientId: string,
    gameId: string,
    onTick: (state: LiveGameState) => void,
  ) {
    const key = this.sessionKey(clientId, gameId);
    const session = this.sessions.get(key);
    if (!session) return;

    session.state.status = 'final';
    session.state.homeScore = session.game.finalScore.home;
    session.state.awayScore = session.game.finalScore.away;
    session.state.playIndex = session.game.plays.length;
    this.sessions.delete(key);
    onTick(this.cloneState(session.state));
  }

  private createState(game: HistoricGame, playIndex: number): LiveGameState {
    const play = game.plays[playIndex];
    const state: LiveGameState = {
      id: game.id,
      name: game.name,
      date: game.date,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      homeScore: play.homeScore,
      awayScore: play.awayScore,
      quarter: play.period,
      clock: play.clock,
      lastPlay: play.text,
      status: 'live',
      playIndex: playIndex + 1,
      totalPlays: game.plays.length,
      plays: [this.toLivePlay(play)],
    };

    return state;
  }

  private applyPlay(
    state: LiveGameState,
    play: HistoricPlayEvent,
    playIndex: number,
  ) {
    state.homeScore = play.homeScore;
    state.awayScore = play.awayScore;
    state.quarter = play.period;
    state.clock = play.clock;
    state.lastPlay = play.text;
    state.playIndex = playIndex + 1;
    state.plays.push(this.toLivePlay(play));
  }

  private toLivePlay(play: HistoricPlayEvent): LivePlayEvent {
    return {
      id: play.id,
      period: play.period,
      clock: play.clock,
      text: play.text,
      homeScore: play.homeScore,
      awayScore: play.awayScore,
    };
  }

  private delayBetweenPlays(
    previousPlay: HistoricPlayEvent,
    nextPlay: HistoricPlayEvent,
  ) {
    if (previousPlay.period !== nextPlay.period) return 0;

    const previousSeconds = this.clockToSeconds(previousPlay.clock);
    const nextSeconds = this.clockToSeconds(nextPlay.clock);
    if (previousSeconds === null || nextSeconds === null) {
      return this.fallbackDelayMs;
    }

    return Math.max(0, previousSeconds - nextSeconds) * 1000;
  }

  private clockToSeconds(clock: string): number | null {
    const [minutes, seconds] = clock.split(':').map(Number);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
    return minutes * 60 + seconds;
  }

  private cloneState(state: LiveGameState): LiveGameState {
    return {
      ...state,
      plays: [...state.plays],
    };
  }

  private findGame(gameId: string) {
    return HISTORIC_GAMES.find((game) => game.id === gameId) ?? null;
  }

  private normalizePace(pace: number): ReplayPace {
    if (pace === 1.5 || pace === 2 || pace === 3) return pace;
    return 1;
  }

  private remainingBaseDelay(session: ReplaySession) {
    if (session.scheduledAt === null) return undefined;

    const elapsedBaseMs = (Date.now() - session.scheduledAt) * session.pace;
    return Math.max(0, session.scheduledBaseDelayMs - elapsedBaseMs);
  }

  private sessionKey(clientId: string, gameId: string) {
    return `${clientId}:${gameId}`;
  }

  private positiveNumber(
    value: string | undefined,
    fallback: number,
    min: number,
  ) {
    const parsed = Number(value ?? fallback);
    return Number.isFinite(parsed) ? Math.max(min, parsed) : fallback;
  }
}
