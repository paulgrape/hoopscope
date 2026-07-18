/**
 * Builds ESPN athlete id → NBA Stats player id map for cached shot heatmaps.
 *
 * Usage:
 *   npx ts-node scripts/build-espn-nba-player-map.ts
 */
import axios from 'axios';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ESPN_BASE =
  process.env.ESPN_BASE_URL ??
  'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

const DELAY_MS = 200;

type HeatmapIndex = {
  players: Array<{ id: string; name: string; file: string; fga: number }>;
};

type EspnAthlete = { id: string; fullName: string };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function pushAthlete(entry: Record<string, unknown>, out: EspnAthlete[]) {
  const id = entry.id != null ? String(entry.id) : '';
  const fullName =
    (typeof entry.fullName === 'string' && entry.fullName) ||
    (typeof entry.displayName === 'string' && entry.displayName) ||
    '';
  if (id && fullName) out.push({ id, fullName });
}

/** ESPN roster is either flat athletes[] or position groups with items[]. */
function athletesFromRoster(data: unknown): EspnAthlete[] {
  const out: EspnAthlete[] = [];
  const root = data as { athletes?: unknown[] };
  const groups = Array.isArray(root?.athletes) ? root.athletes : [];

  for (const group of groups) {
    if (!group || typeof group !== 'object') continue;
    const obj = group as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      for (const item of obj.items) {
        if (item && typeof item === 'object') {
          pushAthlete(item as Record<string, unknown>, out);
        }
      }
    } else {
      pushAthlete(obj, out);
    }
  }

  return out;
}

async function fetchEspnAthletes(): Promise<EspnAthlete[]> {
  const teamsRes = await axios.get(`${ESPN_BASE}/teams`, { timeout: 30000 });
  const teams: Array<{ id: string; displayName?: string }> =
    teamsRes.data?.sports?.[0]?.leagues?.[0]?.teams?.map(
      ({ team }: { team: { id: string; displayName?: string } }) => ({
        id: String(team.id),
        displayName: team.displayName,
      }),
    ) ?? [];

  console.log(`Loaded ${teams.length} ESPN teams`);

  const byId = new Map<string, EspnAthlete>();

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    console.log(`[${i + 1}/${teams.length}] roster ${team.displayName ?? team.id}`);

    try {
      const rosterRes = await axios.get(`${ESPN_BASE}/teams/${team.id}/roster`, {
        timeout: 30000,
      });
      const found = athletesFromRoster(rosterRes.data);
      for (const athlete of found) {
        byId.set(athlete.id, athlete);
      }
      console.log(`  +${found.length} athletes (unique total ${byId.size})`);
    } catch (err) {
      console.error(
        `  FAILED roster ${team.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (i < teams.length - 1) await sleep(DELAY_MS);
  }

  return [...byId.values()];
}

async function main() {
  const frontendPublic = path.resolve(
    __dirname,
    '../../frontend/public/data',
  );
  const indexPath = path.join(frontendPublic, 'shot-heatmaps/index.json');
  const outPath = path.join(frontendPublic, 'espn-nba-player-ids.json');

  const index = JSON.parse(await readFile(indexPath, 'utf8')) as HeatmapIndex;
  const nbaPlayers = index.players ?? [];
  console.log(`Heatmap NBA players: ${nbaPlayers.length}`);

  const espnAthletes = await fetchEspnAthletes();
  console.log(`ESPN athletes collected: ${espnAthletes.length}`);

  const espnByNorm = new Map<string, EspnAthlete[]>();
  for (const athlete of espnAthletes) {
    const key = normalizeName(athlete.fullName);
    const list = espnByNorm.get(key) ?? [];
    list.push(athlete);
    espnByNorm.set(key, list);
  }

  const matches: Array<{ espnId: string; nbaId: string; name: string }> = [];
  const unmatchedNba: Array<{ nbaId: string; name: string }> = [];
  const byEspnId: Record<string, string> = {};

  for (const nba of nbaPlayers) {
    const key = normalizeName(nba.name);
    const candidates = espnByNorm.get(key) ?? [];
    const unique = [...new Map(candidates.map((c) => [c.id, c])).values()];

    if (unique.length === 1) {
      const espn = unique[0];
      matches.push({
        espnId: espn.id,
        nbaId: nba.id,
        name: nba.name,
      });
      byEspnId[espn.id] = nba.id;
      continue;
    }

    unmatchedNba.push({ nbaId: nba.id, name: nba.name });
  }

  // Roster miss (injured/two-way/G-League): fall back to ESPN player search
  if (unmatchedNba.length) {
    console.log(`\nSearching ESPN for ${unmatchedNba.length} unmatched…`);
    const stillUnmatched: Array<{ nbaId: string; name: string }> = [];

    for (const nba of unmatchedNba) {
      try {
        const { data } = await axios.get(
          'https://site.web.api.espn.com/apis/common/v3/search',
          {
            params: {
              query: nba.name,
              limit: 5,
              type: 'player',
              sport: 'basketball',
              league: 'nba',
            },
            timeout: 15000,
          },
        );
        const items: Array<{ id?: string; displayName?: string }> =
          data?.items ?? [];
        const hit = items.find(
          (item) =>
            item.id &&
            item.displayName &&
            normalizeName(item.displayName) === normalizeName(nba.name),
        );

        if (hit?.id) {
          matches.push({
            espnId: String(hit.id),
            nbaId: nba.nbaId,
            name: nba.name,
          });
          byEspnId[String(hit.id)] = nba.nbaId;
          console.log(`  search hit: ${nba.name} → ESPN ${hit.id}`);
        } else {
          stillUnmatched.push(nba);
          console.log(`  no search hit: ${nba.name}`);
        }
      } catch (err) {
        stillUnmatched.push(nba);
        console.error(
          `  search FAILED ${nba.name}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      await sleep(DELAY_MS);
    }

    unmatchedNba.length = 0;
    unmatchedNba.push(...stillUnmatched);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    matches,
    unmatchedNba,
    byEspnId,
  };

  await writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`\nMatched: ${matches.length}`);
  console.log(`Unmatched: ${unmatchedNba.length}`);
  if (unmatchedNba.length) {
    console.log(
      unmatchedNba
        .slice(0, 30)
        .map((p) => `  - ${p.name} (${p.nbaId})`)
        .join('\n'),
    );
  }
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
