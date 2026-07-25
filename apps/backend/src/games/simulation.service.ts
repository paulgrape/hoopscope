import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  HISTORIC_GAMES,
  type HistoricGame,
  type HistoricPlayEvent,
  type PlayerStat,
  type TeamSnapshot,
} from './data';

export type ReplayPace = 1 | 1.5 | 2 | 3;

const REGULATION_PERIODS = 4;
const REGULATION_PERIOD_SECONDS = 12 * 60;
const OVERTIME_PERIOD_SECONDS = 5 * 60;

export interface LivePlayEvent {
  id: string;
  sequenceNumber: number;
  period: number;
  clock: string;
  elapsedSeconds: number;
  text: string;
  shortText?: string;
  scoringPlay: boolean;
  scoreValue: number;
  teamId?: string;
  homeScore: number;
  awayScore: number;
}

export interface ReplayTimelineEntry {
  index: number;
  period: number;
  elapsedSeconds: number;
}

export interface LiveGameState {
  id: string;
  name: string;
  date: string;
  venue?: string;
  homeTeam: TeamSnapshot;
  awayTeam: TeamSnapshot;
  homeScore: number;
  awayScore: number;
  quarter: number;
  clock: string;
  lastPlay: string;
  status: 'live' | 'final';
  paused: boolean;
  playIndex: number;
  totalPlays: number;
  plays: LivePlayEvent[];
  timeline: ReplayTimelineEntry[];
  periodScores?: {
    home: number[];
    away: number[];
  };
  finalPlayers?: {
    home: PlayerStat[];
    away: PlayerStat[];
  };
}

interface ReplaySession {
  game: HistoricGame;
  state: LiveGameState;
  nextIndex: number;
  pace: ReplayPace;
  paused: boolean;
  timer: NodeJS.Timeout | null;
  scheduledAt: number | null;
  scheduledBaseDelayMs: number;
  pendingBaseDelayMs: number | null;
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
  private livePlaysByGame = new Map<string, LivePlayEvent[]>();
  private timelinesByGame = new Map<string, ReplayTimelineEntry[]>();

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

      this.states.set(game.id, this.buildStateAt(game, 0));
    }
  }

  startReplay(
    clientId: string,
    gameId: string,
    pace: number,
    onTick: (state: LiveGameState) => void,
    startIndex = 0,
  ): LiveGameState | null {
    const game = this.findGame(gameId);
    if (!game || game.plays.length === 0) return null;

    this.stopReplay(clientId, gameId);

    const index = this.clampIndex(game, startIndex);
    const state = this.buildStateAt(game, index);
    const session: ReplaySession = {
      game,
      state,
      nextIndex: index + 1,
      pace: this.normalizePace(pace),
      paused: false,
      timer: null,
      scheduledAt: null,
      scheduledBaseDelayMs: 0,
      pendingBaseDelayMs: null,
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
    const session = this.sessions.get(this.sessionKey(clientId, gameId));
    if (!session) {
      return this.startReplay(clientId, gameId, pace, onTick);
    }

    const remainingBaseDelayMs = this.remainingBaseDelay(session);
    this.clearTimer(session);
    session.pace = this.normalizePace(pace);
    this.scheduleNextPlay(clientId, gameId, onTick, remainingBaseDelayMs);

    return session.state;
  }

  seekReplay(
    clientId: string,
    gameId: string,
    playIndex: number,
    onTick: (state: LiveGameState) => void,
  ): LiveGameState | null {
    const session = this.sessions.get(this.sessionKey(clientId, gameId));
    if (!session) {
      return this.startReplay(clientId, gameId, 1, onTick, playIndex);
    }

    const index = this.clampIndex(session.game, playIndex);
    this.clearTimer(session);
    session.pendingBaseDelayMs = null;
    session.state = this.buildStateAt(session.game, index, session.paused);
    session.nextIndex = index + 1;

    onTick(this.cloneState(session.state));
    this.scheduleNextPlay(clientId, gameId, onTick);

    return session.state;
  }

  pauseReplay(
    clientId: string,
    gameId: string,
    onTick: (state: LiveGameState) => void,
  ): LiveGameState | null {
    const session = this.sessions.get(this.sessionKey(clientId, gameId));
    if (!session) return null;
    if (session.paused) return session.state;

    session.pendingBaseDelayMs = this.remainingBaseDelay(session) ?? null;
    this.clearTimer(session);
    session.paused = true;
    session.state.paused = true;
    onTick(this.cloneState(session.state));

    return session.state;
  }

  resumeReplay(
    clientId: string,
    gameId: string,
    onTick: (state: LiveGameState) => void,
  ): LiveGameState | null {
    const session = this.sessions.get(this.sessionKey(clientId, gameId));
    if (!session) return null;
    if (!session.paused) return session.state;

    const remainingBaseDelayMs = session.pendingBaseDelayMs ?? undefined;
    session.paused = false;
    session.state.paused = false;
    session.pendingBaseDelayMs = null;
    onTick(this.cloneState(session.state));
    this.scheduleNextPlay(clientId, gameId, onTick, remainingBaseDelayMs);

    return session.state;
  }

  stopReplay(clientId: string, gameId: string) {
    const key = this.sessionKey(clientId, gameId);
    const session = this.sessions.get(key);
    if (session) this.clearTimer(session);
    this.sessions.delete(key);
  }

  stopClient(clientId: string) {
    for (const key of this.sessions.keys()) {
      if (!key.startsWith(`${clientId}:`)) continue;
      const session = this.sessions.get(key);
      if (session) this.clearTimer(session);
      this.sessions.delete(key);
    }
  }

  private stopAll() {
    this.sessions.forEach((session) => this.clearTimer(session));
    this.sessions.clear();
    this.states.clear();
  }

  private scheduleNextPlay(
    clientId: string,
    gameId: string,
    onTick: (state: LiveGameState) => void,
    remainingBaseDelayMs?: number,
  ) {
    const session = this.sessions.get(this.sessionKey(clientId, gameId));
    if (!session) return;
    if (session.nextIndex >= session.game.plays.length) return;

    const previousPlay = session.game.plays[session.nextIndex - 1];
    const nextPlay = session.game.plays[session.nextIndex];
    const baseDelayMs =
      remainingBaseDelayMs ?? this.delayBetweenPlays(previousPlay, nextPlay);

    if (session.paused) {
      session.pendingBaseDelayMs = baseDelayMs;
      return;
    }

    session.scheduledAt = Date.now();
    session.scheduledBaseDelayMs = baseDelayMs;
    session.pendingBaseDelayMs = null;
    session.timer = setTimeout(() => {
      this.emitNextPlay(clientId, gameId, onTick);
    }, baseDelayMs / session.pace);
  }

  private emitNextPlay(
    clientId: string,
    gameId: string,
    onTick: (state: LiveGameState) => void,
  ) {
    const session = this.sessions.get(this.sessionKey(clientId, gameId));
    if (!session || session.paused) return;

    session.timer = null;
    session.scheduledAt = null;
    session.scheduledBaseDelayMs = 0;

    const nextPlay = session.game.plays[session.nextIndex];
    if (!nextPlay) return;

    this.applyPlay(session.state, session.game, session.nextIndex);
    session.nextIndex += 1;

    if (session.nextIndex >= session.game.plays.length) {
      this.applyFinalScore(session.state, session.game);
    }

    onTick(this.cloneState(session.state));
    this.scheduleNextPlay(clientId, gameId, onTick);
  }

  private buildStateAt(
    game: HistoricGame,
    playIndex: number,
    paused = false,
  ): LiveGameState {
    const index = this.clampIndex(game, playIndex);
    const livePlays = this.getLivePlays(game);
    const play = livePlays[index];
    const state: LiveGameState = {
      id: game.id,
      name: game.name,
      date: game.date,
      venue: game.venue,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      homeScore: play.homeScore,
      awayScore: play.awayScore,
      quarter: play.period,
      clock: play.clock,
      lastPlay: play.text,
      status: 'live',
      paused,
      playIndex: index + 1,
      totalPlays: livePlays.length,
      plays: livePlays.slice(0, index + 1),
      timeline: this.getTimeline(game),
    };

    if (index >= livePlays.length - 1) {
      this.applyFinalScore(state, game);
    }

    return state;
  }

  private applyPlay(
    state: LiveGameState,
    game: HistoricGame,
    playIndex: number,
  ) {
    const play = this.getLivePlays(game)[playIndex];

    state.homeScore = play.homeScore;
    state.awayScore = play.awayScore;
    state.quarter = play.period;
    state.clock = play.clock;
    state.lastPlay = play.text;
    state.playIndex = playIndex + 1;
    state.plays.push(play);
  }

  private applyFinalScore(state: LiveGameState, game: HistoricGame) {
    state.status = 'final';
    state.homeScore = game.finalScore.home;
    state.awayScore = game.finalScore.away;
    state.playIndex = game.plays.length;

    if (game.periodScores) {
      state.periodScores = game.periodScores;
    }

    state.finalPlayers = {
      home: game.homePlayers ?? [],
      away: game.awayPlayers ?? [],
    };
  }

  private getLivePlays(game: HistoricGame): LivePlayEvent[] {
    const cached = this.livePlaysByGame.get(game.id);
    if (cached) return cached;

    const livePlays = game.plays.map((play, index) =>
      this.toLivePlay(play, index),
    );
    this.livePlaysByGame.set(game.id, livePlays);

    return livePlays;
  }

  private getTimeline(game: HistoricGame): ReplayTimelineEntry[] {
    const cached = this.timelinesByGame.get(game.id);
    if (cached) return cached;

    const timeline = this.getLivePlays(game).map((play, index) => ({
      index,
      period: play.period,
      elapsedSeconds: play.elapsedSeconds,
    }));
    this.timelinesByGame.set(game.id, timeline);

    return timeline;
  }

  private toLivePlay(play: HistoricPlayEvent, index: number): LivePlayEvent {
    return {
      id: play.id,
      sequenceNumber: play.sequenceNumber ?? index + 1,
      period: play.period,
      clock: play.clock,
      elapsedSeconds: this.elapsedSeconds(play),
      text: play.text,
      shortText: play.shortText,
      scoringPlay: Boolean(play.scoringPlay),
      scoreValue: play.scoreValue ?? 0,
      teamId: play.teamId,
      homeScore: play.homeScore,
      awayScore: play.awayScore,
    };
  }

  /** Absolute game time consumed since tip-off, so replays can be scrubbed by clock. */
  private elapsedSeconds(play: HistoricPlayEvent): number {
    const period = Number.isFinite(play.period) ? Math.max(1, play.period) : 1;
    let elapsed = 0;

    for (let earlier = 1; earlier < period; earlier += 1) {
      elapsed += this.periodDuration(earlier);
    }

    const remaining = this.clockToSeconds(play.clock);
    const duration = this.periodDuration(period);
    if (remaining === null) return elapsed;

    return elapsed + Math.max(0, duration - remaining);
  }

  private periodDuration(period: number) {
    return period <= REGULATION_PERIODS
      ? REGULATION_PERIOD_SECONDS
      : OVERTIME_PERIOD_SECONDS;
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

  private clampIndex(game: HistoricGame, playIndex: number) {
    if (!Number.isFinite(playIndex)) return 0;
    const index = Math.trunc(playIndex);
    return Math.min(Math.max(0, index), game.plays.length - 1);
  }

  private normalizePace(pace: number): ReplayPace {
    if (pace === 1.5 || pace === 2 || pace === 3) return pace;
    return 1;
  }

  private clearTimer(session: ReplaySession) {
    if (session.timer) clearTimeout(session.timer);
    session.timer = null;
    session.scheduledAt = null;
    session.scheduledBaseDelayMs = 0;
  }

  private remainingBaseDelay(session: ReplaySession) {
    if (session.pendingBaseDelayMs !== null) return session.pendingBaseDelayMs;
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
