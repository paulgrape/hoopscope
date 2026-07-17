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

export type BoxScorePlayer = {
  athleteId: string | null;
  name: string;
  shortName: string | null;
  jersey: string | null;
  position: string | null;
  starter: boolean;
  minutes: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fieldGoals: string | null;
  threePointers: string | null;
  freeThrows: string | null;
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
  periodScores: {
    home: number[];
    away: number[];
  };
  homeTotals: TeamStatLine[];
  awayTotals: TeamStatLine[];
  homePlayers: BoxScorePlayer[];
  awayPlayers: BoxScorePlayer[];
  leaders: GameLeader[];
};

const NEAREST_MAX_DAYS = 120;
const CALENDAR_VERIFY_ATTEMPTS = 5;
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

    const scoreboardCache = new Map<string, unknown>();
    const calendarHit = await this.findNearestViaCalendar(
      date,
      direction,
      parsedOffset,
      scoreboardCache,
    );
    if (calendarHit) {
      return { date: calendarHit };
    }

    const step = direction === 'before' ? -1 : 1;
    const origin = parseDateKey(date);

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

  private async findNearestViaCalendar(
    originDate: string,
    direction: 'before' | 'after',
    parsedOffset: number,
    scoreboardCache: Map<string, unknown>,
  ): Promise<string | null> {
    let calendar: string[];
    try {
      calendar = await this.espn.getScheduleCalendar();
    } catch {
      return null;
    }

    if (calendar.length === 0) return null;

    const candidates =
      direction === 'before'
        ? calendar.filter((entry) => entry < originDate).reverse()
        : calendar.filter((entry) => entry > originDate);

    for (const candidate of candidates.slice(0, CALENDAR_VERIFY_ATTEMPTS)) {
      // ESPN calendar days are slate dates; tip-offs can land on an adjacent
      // local date depending on timezone — probe candidate ± 1 day.
      const verifyDates = calendarVerifyDates(candidate, originDate, direction);
      for (const verifyDate of verifyDates) {
        const games = await this.loadScheduleForDate(
          verifyDate,
          parsedOffset,
          scoreboardCache,
        );
        if (games.length > 0) {
          return verifyDate;
        }
      }
    }

    return null;
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
    const playersByTeam = normalizeBoxPlayers(data?.boxscore?.players ?? []);
    const homeTeamId = home?.team?.id ? String(home.team.id) : null;
    const awayTeamId = away?.team?.id ? String(away.team.id) : null;

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
      periodScores: {
        home: normalizePeriodScores(home?.linescores),
        away: normalizePeriodScores(away?.linescores),
      },
      homeTotals: normalizeTeamTotals(homeBox),
      awayTotals: normalizeTeamTotals(awayBox),
      homePlayers: homeTeamId ? (playersByTeam.get(homeTeamId) ?? []) : [],
      awayPlayers: awayTeamId ? (playersByTeam.get(awayTeamId) ?? []) : [],
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

function calendarVerifyDates(
  candidate: string,
  originDate: string,
  direction: 'before' | 'after',
): string[] {
  const base = parseDateKey(candidate);
  const probes = [
    candidate,
    formatDateKeyUtc(addDays(base, 1)),
    formatDateKeyUtc(addDays(base, -1)),
  ];

  return probes.filter((date) =>
    direction === 'before' ? date < originDate : date > originDate,
  );
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

function normalizePeriodScores(linescores: any[] | undefined): number[] {
  return (linescores ?? [])
    .map(line => Number(line?.value ?? line?.displayValue ?? NaN))
    .filter(value => Number.isFinite(value));
}

function normalizeBoxPlayers(players: any[]): Map<string, BoxScorePlayer[]> {
  const statsByTeam = new Map<string, BoxScorePlayer[]>();

  for (const teamBox of players) {
    const teamId = teamBox?.team?.id ? String(teamBox.team.id) : null;
    const scoring = teamBox?.statistics?.find((stat: any) =>
      stat.labels?.includes('PTS'),
    );
    if (!teamId || !scoring?.labels || !scoring?.athletes) continue;

    const labels: string[] = scoring.labels;
    const index = {
      min: labels.indexOf('MIN'),
      fg: labels.indexOf('FG'),
      three: labels.indexOf('3PT'),
      ft: labels.indexOf('FT'),
      reb: labels.indexOf('REB'),
      ast: labels.indexOf('AST'),
      stl: labels.indexOf('STL'),
      blk: labels.indexOf('BLK'),
      to: labels.indexOf('TO'),
      pf: labels.indexOf('PF'),
      pts: labels.indexOf('PTS'),
    };

    const rows = scoring.athletes
      .filter((entry: any) => !entry.didNotPlay)
      .map((entry: any): BoxScorePlayer | null => {
        const athlete = entry.athlete;
        const name =
          athlete?.displayName ?? athlete?.fullName ?? athlete?.shortName ?? '';
        if (!name) return null;

        const stats: string[] | undefined = entry.stats;
        return {
          athleteId: athlete?.id ? String(athlete.id) : null,
          name,
          shortName: athlete?.shortName ?? null,
          jersey: athlete?.jersey ? String(athlete.jersey) : null,
          position:
            athlete?.position?.abbreviation ??
            athlete?.position?.name ??
            null,
          starter: Boolean(entry.starter),
          minutes: stringAt(stats, index.min),
          points: numberAt(stats, index.pts),
          rebounds: numberAt(stats, index.reb),
          assists: numberAt(stats, index.ast),
          steals: numberAt(stats, index.stl),
          blocks: numberAt(stats, index.blk),
          turnovers: numberAt(stats, index.to),
          fouls: numberAt(stats, index.pf),
          fieldGoals: nullableStringAt(stats, index.fg),
          threePointers: nullableStringAt(stats, index.three),
          freeThrows: nullableStringAt(stats, index.ft),
        };
      })
      .filter((player: BoxScorePlayer | null): player is BoxScorePlayer => player !== null)
      .sort(compareBoxPlayers);

    statsByTeam.set(teamId, rows);
  }

  return statsByTeam;
}

function compareBoxPlayers(a: BoxScorePlayer, b: BoxScorePlayer) {
  if (a.starter !== b.starter) return a.starter ? -1 : 1;

  const minutesDiff = parseMinutes(b.minutes) - parseMinutes(a.minutes);
  if (minutesDiff !== 0) return minutesDiff;

  return b.points - a.points;
}

function parseMinutes(value: string) {
  if (!value) return 0;
  const [minutes, seconds] = value.split(':').map(Number);
  if (!Number.isFinite(minutes)) return 0;
  if (!Number.isFinite(seconds)) return minutes;
  return minutes + seconds / 60;
}

function numberAt(stats: string[] | undefined, index: number): number {
  if (!stats || index < 0) return 0;
  const parsed = Number(stats[index] ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringAt(stats: string[] | undefined, index: number): string {
  if (!stats || index < 0) return '';
  return String(stats[index] ?? '');
}

function nullableStringAt(stats: string[] | undefined, index: number): string | null {
  if (!stats || index < 0) return null;
  const value = String(stats[index] ?? '').trim();
  return value.length > 0 ? value : null;
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
