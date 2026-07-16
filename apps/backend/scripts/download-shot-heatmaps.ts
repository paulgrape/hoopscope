/**
 * Downloads shot-heatmap JSONs via the local Nest shots API.
 *
 * Default: next 100 PPG leaders not already cached under
 * apps/frontend/public/data/shot-heatmaps/
 *
 * Usage (backend running on :3000):
 *   npm run download:shot-heatmaps
 *   npm run download:shot-heatmaps -- --limit 100
 *   npm run download:shot-heatmaps -- --limit 50 --force
 */
import axios from 'axios';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SEASON = '2025-26';
const SEASON_TYPE = 'Regular Season';
const API_BASE = process.env.API_URL ?? 'http://localhost:3000';
const DELAY_MS = Number(process.env.SHOT_DOWNLOAD_DELAY_MS ?? 1500);

type Leader = { id: string; name: string; pts: number; gp: number };
type IndexPlayer = {
  id: string;
  name: string;
  file: string;
  season: string;
  seasonType: string;
  fga: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv: string[]) {
  let limit = 100;
  let force = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--limit' && argv[i + 1]) {
      limit = Math.max(1, Number(argv[++i]) || 100);
    } else if (argv[i] === '--force') {
      force = true;
    }
  }
  return { limit, force };
}

async function fetchPpgLeaders(): Promise<Leader[]> {
  const { data } = await axios.get(
    'https://stats.nba.com/stats/leaguedashplayerstats',
    {
      timeout: 60000,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        Origin: 'https://www.nba.com',
        Referer: 'https://www.nba.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'x-nba-stats-origin': 'stats',
        'x-nba-stats-token': 'true',
      },
      params: {
        College: '',
        Conference: '',
        Country: '',
        DateFrom: '',
        DateTo: '',
        Division: '',
        DraftPick: '',
        DraftYear: '',
        GameScope: '',
        GameSegment: '',
        Height: '',
        LastNGames: 0,
        LeagueID: '00',
        Location: '',
        MeasureType: 'Base',
        Month: 0,
        OpponentTeamID: 0,
        Outcome: '',
        PORound: 0,
        PaceAdjust: 'N',
        PerMode: 'PerGame',
        Period: 0,
        PlayerExperience: '',
        PlayerPosition: '',
        PlusMinus: 'N',
        PointDiff: '',
        Rank: 'N',
        Season: SEASON,
        SeasonSegment: '',
        SeasonType: SEASON_TYPE,
        ShotClockRange: '',
        StarterBench: '',
        TeamID: 0,
        VsConference: '',
        VsDivision: '',
        Weight: '',
      },
    },
  );

  const set = data?.resultSets?.[0];
  if (!set) throw new Error('No leaguedashplayerstats result set');

  const index = Object.fromEntries(
    set.headers.map((header: string, i: number) => [header, i]),
  ) as Record<string, number>;

  const leaders: Leader[] = set.rowSet.map((row: unknown[]) => ({
    id: String(row[index.PLAYER_ID]),
    name: String(row[index.PLAYER_NAME] ?? ''),
    pts: Number(row[index.PTS] ?? 0),
    gp: Number(row[index.GP] ?? 0),
  }));

  leaders.sort((a, b) => b.pts - a.pts || b.gp - a.gp);
  return leaders;
}

async function existingPlayerIds(outDir: string): Promise<Set<string>> {
  const ids = new Set<string>();
  let files: string[] = [];
  try {
    files = await readdir(outDir);
  } catch {
    return ids;
  }

  for (const file of files) {
    if (!/^\d+\.json$/.test(file)) continue;
    try {
      const raw = JSON.parse(await readFile(path.join(outDir, file), 'utf8'));
      if (Array.isArray(raw.shots) && raw.shots.length > 0) {
        ids.add(String(raw.playerId ?? file.replace(/\.json$/, '')));
      }
    } catch {
      // ignore corrupt file
    }
  }
  return ids;
}

async function rebuildIndex(outDir: string) {
  const files = (await readdir(outDir)).filter((f) => /^\d+\.json$/.test(f));
  const players: IndexPlayer[] = [];

  for (const file of files) {
    try {
      const raw = JSON.parse(await readFile(path.join(outDir, file), 'utf8'));
      const fga = Array.isArray(raw.shots) ? raw.shots.length : 0;
      if (fga <= 0) continue;
      players.push({
        id: String(raw.playerId ?? file.replace(/\.json$/, '')),
        name: String(raw.playerName ?? file),
        file,
        season: String(raw.season ?? SEASON),
        seasonType: String(raw.seasonType ?? SEASON_TYPE),
        fga,
      });
    } catch {
      // skip
    }
  }

  players.sort((a, b) => a.name.localeCompare(b.name));
  await writeFile(
    path.join(outDir, 'index.json'),
    JSON.stringify(
      {
        season: SEASON,
        seasonType: SEASON_TYPE,
        generatedAt: new Date().toISOString(),
        players,
      },
      null,
      2,
    ),
    'utf8',
  );
  return players.length;
}

async function main() {
  const { limit, force } = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(
    __dirname,
    '../../frontend/public/data/shot-heatmaps',
  );
  await mkdir(outDir, { recursive: true });

  console.log(`Fetching ${SEASON} PPG leaders from stats.nba.com…`);
  const leaders = await fetchPpgLeaders();
  const have = force ? new Set<string>() : await existingPlayerIds(outDir);
  const queue = leaders.filter((p) => p.gp > 0 && (force || !have.has(p.id))).slice(0, limit);

  console.log(
    `Cached with shots: ${have.size}. Downloading next ${queue.length} (limit=${limit}, force=${force})…`,
  );

  for (let i = 0; i < queue.length; i++) {
    const player = queue[i];
    const params = new URLSearchParams({
      playerId: player.id,
      season: SEASON,
      seasonType: SEASON_TYPE,
    });
    const url = `${API_BASE}/shots/heatmap?${params.toString()}`;

    console.log(
      `[${i + 1}/${queue.length}] ${player.name} (${player.id}) — ${player.pts.toFixed(1)} PPG`,
    );

    try {
      const { data } = await axios.get(url, { timeout: 60000 });
      const file = `${player.id}.json`;
      const payload = {
        ...data,
        playerName: data.playerName || player.name,
      };
      await writeFile(
        path.join(outDir, file),
        JSON.stringify(payload, null, 2),
        'utf8',
      );
      console.log(
        `  saved ${file} (${payload.shots?.length ?? 0} shots, ${payload.leagueZones?.length ?? 0} zones)`,
      );
    } catch (err) {
      console.error(
        `  FAILED: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (i < queue.length - 1) await sleep(DELAY_MS);
  }

  const total = await rebuildIndex(outDir);
  console.log(`\nRebuilt index.json with ${total} players → ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
