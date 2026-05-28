import { BadRequestException, Injectable } from '@nestjs/common';
import { EspnService } from '../espn/espn.service';
import { SimulationService } from './simulation.service';

type ScoreboardStatus = 'scheduled' | 'live' | 'final';

type ScoreboardTeam = {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  logo: string | null;
  color: string | null;
};

type ScoreboardGame = {
  id: string;
  name: string;
  shortName: string | null;
  date: string;
  status: ScoreboardStatus;
  statusDetail: string;
  homeTeam: ScoreboardTeam | null;
  awayTeam: ScoreboardTeam | null;
  homeScore: number | null;
  awayScore: number | null;
  period: number | null;
  clock: string | null;
  venue: string | null;
};

@Injectable()
export class GamesService {
  constructor(
    private readonly espn: EspnService,
    private readonly simulation: SimulationService,
  ) {}

  getActiveGames() {
    return this.simulation.getActiveGames();
  }
  getGame(id: string) {
    return this.simulation.getGame(id);
  }

  async getScoreboard() {
    const data: any = await this.espn.getScoreboard();
    return (
      data.events?.map((e: any) => ({
        id: e.id,
        name: e.name,
        date: e.date,
        status: e.status?.type?.description,
        homeTeam: e.competitions?.[0]?.competitors?.find(
          (c: any) => c.homeAway === 'home',
        ),
        awayTeam: e.competitions?.[0]?.competitors?.find(
          (c: any) => c.homeAway === 'away',
        ),
      })) ?? []
    );
  }

  async getSchedule(date = getLocalDateKey(new Date()), offsetMinutes = '0') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must use YYYY-MM-DD format');
    }

    const parsedOffset = Number(offsetMinutes);
    if (!Number.isFinite(parsedOffset)) {
      throw new BadRequestException('offsetMinutes must be a number');
    }

    const selectedDate = parseDateKey(date);
    const localDayStart = new Date(
      selectedDate.getTime() + parsedOffset * 60 * 1000,
    );
    const localDayEnd = new Date(localDayStart.getTime() + 24 * 60 * 60 * 1000);

    const scoreboardDates = [-1, 0, 1].map(dayOffset =>
      formatEspnDate(addDays(selectedDate, dayOffset)),
    );
    const scoreboards = await Promise.all(
      scoreboardDates.map(scoreboardDate =>
        this.espn.getScoreboard(scoreboardDate),
      ),
    );

    const games = new Map<string, ScoreboardGame>();
    for (const scoreboard of scoreboards) {
      for (const event of (scoreboard as any).events ?? []) {
        const gameDate = new Date(event.date);
        if (
          !Number.isFinite(gameDate.getTime()) ||
          gameDate < localDayStart ||
          gameDate >= localDayEnd ||
          games.has(event.id)
        ) {
          continue;
        }

        games.set(event.id, normalizeScoreboardEvent(event));
      }
    }

    return [...games.values()].sort(
      (first, second) =>
        new Date(first.date).getTime() - new Date(second.date).getTime(),
    );
  }
}

function normalizeScoreboardEvent(event: any): ScoreboardGame {
  const competition = event.competitions?.[0];
  const home = competition?.competitors?.find(
    (competitor: any) => competitor.homeAway === 'home',
  );
  const away = competition?.competitors?.find(
    (competitor: any) => competitor.homeAway === 'away',
  );
  const statusType = event.status?.type;

  return {
    id: event.id,
    name: event.name,
    shortName: event.shortName ?? null,
    date: event.date,
    status: normalizeStatus(statusType?.state),
    statusDetail:
      statusType?.shortDetail ?? statusType?.detail ?? statusType?.description ?? 'Scheduled',
    homeTeam: normalizeTeam(home),
    awayTeam: normalizeTeam(away),
    homeScore: parseScore(home?.score),
    awayScore: parseScore(away?.score),
    period: event.status?.period ?? null,
    clock: event.status?.displayClock ?? null,
    venue: competition?.venue?.fullName ?? null,
  };
}

function normalizeTeam(competitor: any): ScoreboardTeam | null {
  const team = competitor?.team;
  if (!team) return null;

  return {
    id: team.id,
    name: team.name,
    displayName: team.displayName ?? team.shortDisplayName ?? team.name,
    abbreviation: team.abbreviation,
    logo: team.logo ?? team.logos?.[0]?.href ?? null,
    color: team.color ?? null,
  };
}

function normalizeStatus(state?: string): ScoreboardStatus {
  if (state === 'in') return 'live';
  if (state === 'post') return 'final';
  return 'scheduled';
}

function parseScore(score: unknown) {
  const parsedScore = Number(score);
  return Number.isFinite(parsedScore) ? parsedScore : null;
}

function parseDateKey(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function formatEspnDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
