import axios from 'axios';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  HistoricGame,
  HistoricPlayEvent,
  PlayerStat,
  TeamSnapshot,
} from '../src/games/data';

const DEFAULT_EVENT_IDS = [
  '400878160', // 2016 NBA Finals Game 7: Cavaliers at Warriors
  '401246235', // 2020 Western Conference Finals Game 2: Nuggets at Lakers
  '401344140', // 2021 NBA Finals Game 6: Suns at Bucks
];

const ESPN_BASE_URL =
  process.env.ESPN_BASE_URL ??
  'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

type EspnSummary = Record<string, any>;

async function main() {
  const eventIds = process.argv.slice(2).filter(Boolean);
  const idsToSeed = eventIds.length > 0 ? eventIds : DEFAULT_EVENT_IDS;
  const games = await Promise.all(idsToSeed.map(fetchAndNormalizeGame));
  const outputPath = path.resolve(
    process.cwd(),
    'src/games/data/historic-games.json',
  );

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(games, null, 2)}\n`, 'utf8');
  console.log(`Saved ${games.length} historic games to ${outputPath}`);
}

async function fetchAndNormalizeGame(eventId: string): Promise<HistoricGame> {
  const url = `${ESPN_BASE_URL}/summary`;
  const { data } = await axios.get<EspnSummary>(url, {
    params: { event: eventId },
    timeout: 15000,
  });

  return normalizeGame(eventId, data);
}

function normalizeGame(eventId: string, data: EspnSummary): HistoricGame {
  const competition = data.header?.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = competitors.find((c: any) => c.homeAway === 'home');
  const away = competitors.find((c: any) => c.homeAway === 'away');

  if (!home?.team || !away?.team) {
    throw new Error(`Event ${eventId} does not include home/away teams`);
  }

  const plays = normalizePlays(eventId, data.plays ?? []);
  if (plays.length === 0) {
    throw new Error(`Event ${eventId} does not include replayable plays`);
  }

  const homeTeam = normalizeTeam(home.team);
  const awayTeam = normalizeTeam(away.team);
  const playerStats = normalizePlayerStats(data.boxscore?.players ?? []);

  return {
    id: eventId,
    name: data.header?.name ?? `${awayTeam.name} at ${homeTeam.name}`,
    date: data.header?.competitions?.[0]?.date ?? data.header?.date ?? '',
    status:
      data.header?.competitions?.[0]?.status?.type?.description ??
      data.header?.competitions?.[0]?.status?.type?.name ??
      'Final',
    venue: data.gameInfo?.venue?.fullName,
    homeTeam,
    awayTeam,
    homePlayers: playerStats.get(homeTeam.id) ?? [],
    awayPlayers: playerStats.get(awayTeam.id) ?? [],
    finalScore: {
      home: Number(home.score ?? plays.at(-1)?.homeScore ?? 0),
      away: Number(away.score ?? plays.at(-1)?.awayScore ?? 0),
    },
    periodScores: {
      home: normalizePeriodScores(home.linescores),
      away: normalizePeriodScores(away.linescores),
    },
    plays,
  };
}

function normalizeTeam(team: any): TeamSnapshot {
  const logo = team.logo ?? team.logos?.find((l: any) => l.href)?.href ?? '';

  return {
    id: String(team.id),
    name: team.displayName ?? team.name ?? team.location ?? String(team.id),
    abbreviation: team.abbreviation ?? '',
    logo,
    color: team.color ?? team.alternateColor ?? '',
  };
}

function normalizePlays(eventId: string, plays: any[]): HistoricPlayEvent[] {
  return plays
    .map((play, index) => ({
      id: String(play.id ?? `${eventId}-${index}`),
      sequenceNumber: Number(play.sequenceNumber ?? index + 1),
      period: Number(play.period?.number ?? 1),
      clock: play.clock?.displayValue ?? '',
      text: play.text ?? play.shortDescription ?? '',
      shortText: play.shortDescription,
      scoringPlay: Boolean(play.scoringPlay),
      scoreValue: Number(play.scoreValue ?? 0),
      teamId: play.team?.id ? String(play.team.id) : undefined,
      homeScore: Number(play.homeScore ?? 0),
      awayScore: Number(play.awayScore ?? 0),
    }))
    .filter((play) => play.text.length > 0)
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

function normalizePlayerStats(players: any[]): Map<string, PlayerStat[]> {
  const statsByTeam = new Map<string, PlayerStat[]>();

  for (const teamBox of players) {
    const scoring = teamBox.statistics?.find((stat: any) =>
      stat.labels?.includes('PTS'),
    );
    if (!teamBox.team?.id || !scoring?.labels || !scoring?.athletes) continue;

    const labels: string[] = scoring.labels;
    const pointsIndex = labels.indexOf('PTS');
    const reboundsIndex = labels.indexOf('REB');
    const assistsIndex = labels.indexOf('AST');
    const minutesIndex = labels.indexOf('MIN');

    statsByTeam.set(
      String(teamBox.team.id),
      scoring.athletes
        .filter((entry: any) => !entry.didNotPlay)
        .map((entry: any) => ({
          name: entry.athlete?.displayName ?? entry.athlete?.shortName ?? '',
          points: numberAt(entry.stats, pointsIndex),
          rebounds: numberAt(entry.stats, reboundsIndex),
          assists: numberAt(entry.stats, assistsIndex),
          minutes: stringAt(entry.stats, minutesIndex),
        }))
        .filter((player: PlayerStat) => player.name.length > 0),
    );
  }

  return statsByTeam;
}

function normalizePeriodScores(linescores: any[] | undefined): number[] {
  return (linescores ?? []).map((line) => Number(line.value ?? line.displayValue ?? 0));
}

function numberAt(stats: string[] | undefined, index: number): number {
  if (!stats || index < 0) return 0;
  return Number(stats[index] ?? 0);
}

function stringAt(stats: string[] | undefined, index: number): string {
  if (!stats || index < 0) return '';
  return String(stats[index] ?? '');
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
