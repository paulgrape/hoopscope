import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

type TeamStatLine = {
  name: string;
  label: string;
  displayValue: string;
};

type GameLeader = {
  category: string;
  displayName: string;
  athleteId: string | null;
  athleteName: string;
  shortName: string | null;
  headshot: string | null;
  teamId: string | null;
  teamAbbreviation: string | null;
  value: string;
  summary: string | null;
};

export type GameSummary = {
  id: string;
  name: string;
  shortName: string | null;
  date: string;
  status: ScoreboardStatus;
  statusDetail: string;
  period: number | null;
  clock: string | null;
  venue: string | null;
  homeTeam: ScoreboardTeam | null;
  awayTeam: ScoreboardTeam | null;
  homeScore: number | null;
  awayScore: number | null;
  homeTotals: TeamStatLine[];
  awayTotals: TeamStatLine[];
  leaders: GameLeader[];
};

const NEAREST_MAX_DAYS = 120;
const TEAM_TOTAL_KEYS = [
  'fieldGoalsMade-fieldGoalsAttempted',
  'threePointFieldGoalsMade-threePointFieldGoalsAttempted',
  'freeThrowsMade-freeThrowsAttempted',
  'totalRebounds',
  'assists',
  'steals',
  'blocks',
  'turnovers',
  'pointsInPaint',
  'fastBreakPoints',
  'fouls',
] as const;

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
    const { parsedOffset } = parseScheduleQuery(date, offsetMinutes);
    return this.loadScheduleForDate(date, parsedOffset);
  }

  async getNearestScheduleDate(
    date = getLocalDateKey(new Date()),
    offsetMinutes = '0',
    direction = 'before',
  ) {
    const { parsedOffset } = parseScheduleQuery(date, offsetMinutes);
    if (direction !== 'before' && direction !== 'after') {
      throw new BadRequestException('direction must be before or after');
    }

    const step = direction === 'before' ? -1 : 1;
    const origin = parseDateKey(date);
    const scoreboardCache = new Map<string, unknown>();

    for (let day = 1; day <= NEAREST_MAX_DAYS; day += 1) {
      const candidate = formatDateKeyUtc(addDays(origin, step * day));
      const games = await this.loadScheduleForDate(
        candidate,
        parsedOffset,
        scoreboardCache,
      );
      if (games.length > 0) {
        return { date: candidate };
      }
    }

    throw new NotFoundException('No NBA games found nearby');
  }

  async getGameSummary(gameId: string): Promise<GameSummary> {
    if (!gameId?.trim()) {
      throw new BadRequestException('gameId is required');
    }

    const data: any = await this.espn.getGameSummary(gameId);
    const competition = data?.header?.competitions?.[0];
    if (!competition) {
      throw new NotFoundException(`Game ${gameId} not found`);
    }

    const competitors = competition.competitors ?? [];
    const home = competitors.find((c: any) => c.homeAway === 'home');
    const away = competitors.find((c: any) => c.homeAway === 'away');
    const statusType = competition.status?.type ?? data?.header?.competitions?.[0]?.status?.type;
    const boxTeams: any[] = data?.boxscore?.teams ?? [];
    const homeBox = findBoxTeam(boxTeams, home?.team?.id);
    const awayBox = findBoxTeam(boxTeams, away?.team?.id);

    return {
      id: String(data?.header?.id ?? gameId),
      name: data?.header?.name ?? buildGameName(away, home),
      shortName: buildShortName(away, home),
      date: competition.date ?? data?.header?.date ?? '',
      status: normalizeStatus(statusType?.state),
      statusDetail:
        statusType?.shortDetail ??
        statusType?.detail ??
        statusType?.description ??
        'Scheduled',
      period: competition.status?.period ?? null,
      clock: competition.status?.displayClock ?? null,
      venue: data?.gameInfo?.venue?.fullName ?? competition?.venue?.fullName ?? null,
      homeTeam: normalizeSummaryTeam(home),
      awayTeam: normalizeSummaryTeam(away),
      homeScore: parseScore(home?.score),
      awayScore: parseScore(away?.score),
      homeTotals: normalizeTeamTotals(homeBox),
      awayTotals: normalizeTeamTotals(awayBox),
      leaders: normalizeLeaders(data?.leaders ?? []),
    };
  }

  private async loadScheduleForDate(
    date: string,
    parsedOffset: number,
    scoreboardCache?: Map<string, unknown>,
  ) {
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
        this.getScoreboardCached(scoreboardDate, scoreboardCache),
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

  private async getScoreboardCached(
    espnDate: string,
    scoreboardCache?: Map<string, unknown>,
  ) {
    if (scoreboardCache?.has(espnDate)) {
      return scoreboardCache.get(espnDate);
    }

    const scoreboard = await this.espn.getScoreboard(espnDate);
    scoreboardCache?.set(espnDate, scoreboard);
    return scoreboard;
  }
}

function parseScheduleQuery(date: string, offsetMinutes: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new BadRequestException('date must use YYYY-MM-DD format');
  }

  const parsedOffset = Number(offsetMinutes);
  if (!Number.isFinite(parsedOffset)) {
    throw new BadRequestException('offsetMinutes must be a number');
  }

  return { parsedOffset };
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
    id: String(team.id),
    name: team.name,
    displayName: team.displayName ?? team.shortDisplayName ?? team.name,
    abbreviation: team.abbreviation,
    logo: team.logo ?? team.logos?.[0]?.href ?? null,
    color: team.color ?? null,
  };
}

function normalizeSummaryTeam(competitor: any): ScoreboardTeam | null {
  return normalizeTeam(competitor);
}

function findBoxTeam(boxTeams: any[], teamId?: string) {
  if (!teamId) return null;
  return (
    boxTeams.find((entry: any) => String(entry?.team?.id) === String(teamId)) ??
    null
  );
}

function normalizeTeamTotals(boxTeam: any): TeamStatLine[] {
  const stats: any[] = boxTeam?.statistics ?? [];
  const byName = new Map(stats.map((stat: any) => [stat.name, stat]));

  return TEAM_TOTAL_KEYS.flatMap(key => {
    const stat = byName.get(key);
    if (!stat?.displayValue) return [];
    return [
      {
        name: String(stat.name),
        label: String(stat.label ?? stat.abbreviation ?? stat.name),
        displayValue: String(stat.displayValue),
      },
    ];
  });
}

function normalizeLeaders(teamLeaderGroups: any[]): GameLeader[] {
  const bestByCategory = new Map<string, GameLeader & { numericValue: number }>();

  for (const group of teamLeaderGroups) {
    const teamId = group?.team?.id ? String(group.team.id) : null;
    const teamAbbreviation = group?.team?.abbreviation ?? null;

    for (const category of group?.leaders ?? []) {
      const categoryName = String(category?.name ?? '');
      if (!['points', 'rebounds', 'assists'].includes(categoryName)) continue;

      const top = category?.leaders?.[0];
      if (!top?.athlete) continue;

      const numericValue = Number(top.value ?? top.displayValue);
      if (!Number.isFinite(numericValue)) continue;

      const candidate = {
        category: categoryName,
        displayName: String(category.displayName ?? categoryName),
        athleteId: top.athlete.id ? String(top.athlete.id) : null,
        athleteName:
          top.athlete.displayName ??
          top.athlete.fullName ??
          top.athlete.shortName ??
          'Player',
        shortName: top.athlete.shortName ?? null,
        headshot: top.athlete.headshot?.href ?? null,
        teamId,
        teamAbbreviation,
        value: String(top.displayValue ?? top.value ?? ''),
        summary: top.summary ?? null,
        numericValue,
      };

      const existing = bestByCategory.get(categoryName);
      if (!existing || candidate.numericValue > existing.numericValue) {
        bestByCategory.set(categoryName, candidate);
      }
    }
  }

  const order = { points: 0, rebounds: 1, assists: 2 } as Record<string, number>;
  return [...bestByCategory.values()]
    .sort((a, b) => (order[a.category] ?? 99) - (order[b.category] ?? 99))
    .map(({ numericValue: _numericValue, ...leader }) => leader);
}

function buildGameName(away: any, home: any) {
  const awayName =
    away?.team?.displayName ?? away?.team?.name ?? away?.team?.abbreviation ?? 'Away';
  const homeName =
    home?.team?.displayName ?? home?.team?.name ?? home?.team?.abbreviation ?? 'Home';
  return `${awayName} at ${homeName}`;
}

function buildShortName(away: any, home: any) {
  const awayAbbr = away?.team?.abbreviation;
  const homeAbbr = home?.team?.abbreviation;
  if (!awayAbbr || !homeAbbr) return null;
  return `${awayAbbr} @ ${homeAbbr}`;
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

function formatDateKeyUtc(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
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
