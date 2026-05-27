import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { GAME_SNAPSHOTS, GameSnapshot } from './data';

export interface LiveGameState {
  id: string;
  homeTeam: { name: string; abbreviation: string; logo: string; color: string };
  awayTeam: { name: string; abbreviation: string; logo: string; color: string };
  homeScore: number;
  awayScore: number;
  quarter: number;
  clock: string;
  lastPlay: string;
  status: 'live' | 'final';
}

@Injectable()
export class SimulationService implements OnModuleDestroy {
  private readonly logger = new Logger(SimulationService.name);
  private states = new Map<string, LiveGameState>();
  private timers = new Map<string, NodeJS.Timeout>();
  private tickCallbacks = new Map<string, (state: LiveGameState) => void>();

  onModuleDestroy() {
    this.timers.forEach((t) => clearInterval(t));
  }

  getActiveGames(): LiveGameState[] {
    return [...this.states.values()];
  }

  getGame(id: string): LiveGameState | null {
    return this.states.get(id) ?? null;
  }

  startAll(onTick: (gameId: string, state: LiveGameState) => void) {
    if (GAME_SNAPSHOTS.length === 0) {
      this.logger.warn('No game snapshots loaded — simulation skipped');
      return;
    }
    for (const snapshot of GAME_SNAPSHOTS) {
      this.startGame(snapshot, (state) => onTick(snapshot.id, state));
    }
  }

  private startGame(
    snapshot: GameSnapshot,
    onTick: (state: LiveGameState) => void,
  ) {
    const state: LiveGameState = {
      id: snapshot.id,
      homeTeam: snapshot.homeTeam,
      awayTeam: snapshot.awayTeam,
      homeScore: 0,
      awayScore: 0,
      quarter: 1,
      clock: '12:00',
      lastPlay: 'Tip-off',
      status: 'live',
    };

    this.states.set(snapshot.id, state);
    this.tickCallbacks.set(snapshot.id, onTick);

    // Spread final score across ~48 ticks (one per simulated minute)
    const totalTicks = 48;
    const homePer = snapshot.finalScore.home / totalTicks;
    const awayPer = snapshot.finalScore.away / totalTicks;
    let tick = 0;

    const timer = setInterval(() => {
      if (tick >= totalTicks) {
        state.status = 'final';
        state.clock = '0:00';
        state.quarter = 4;
        clearInterval(timer);
        onTick(state);
        return;
      }

      const quarter = Math.min(4, Math.floor(tick / 12) + 1);
      const minInQ = 12 - (tick % 12);
      state.quarter = quarter;
      state.clock = `${minInQ}:00`;
      state.homeScore = Math.round(homePer * tick + (Math.random() - 0.5) * 2);
      state.awayScore = Math.round(awayPer * tick + (Math.random() - 0.5) * 2);
      state.lastPlay = this.randomPlay(snapshot);

      tick++;
      onTick(state);
    }, 4000); // emit every 4 seconds

    this.timers.set(snapshot.id, timer);
  }

  private randomPlay(snapshot: GameSnapshot): string {
    const allPlayers = [
      ...snapshot.homePlayers.map((p) => ({
        ...p,
        team: snapshot.homeTeam.abbreviation,
      })),
      ...snapshot.awayPlayers.map((p) => ({
        ...p,
        team: snapshot.awayTeam.abbreviation,
      })),
    ];
    const player = allPlayers[Math.floor(Math.random() * allPlayers.length)];
    const plays = [
      `${player.name} makes a jump shot`,
      `${player.name} drives to the basket`,
      `${player.name} hits a three-pointer`,
      `${player.name} makes both free throws`,
      `${player.name} with the slam dunk`,
      `${player.name} finds the open man`,
    ];
    return plays[Math.floor(Math.random() * plays.length)];
  }
}
