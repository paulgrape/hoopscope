export type StandingSplit = {
  wins: number;
  losses: number;
};

export type RankableTeam = {
  id: string;
  wins: number;
  losses: number;
  conference: StandingSplit;
  division: StandingSplit;
  differential: number;
};

export type NbaDivision = {
  id: string;
  name: string;
  conference: 'east' | 'west';
};

/** Display order: East divisions, then West. */
const DIVISION_CATALOG: readonly NbaDivision[] = [
  { id: 'atlantic', name: 'Atlantic', conference: 'east' },
  { id: 'central', name: 'Central', conference: 'east' },
  { id: 'southeast', name: 'Southeast', conference: 'east' },
  { id: 'northwest', name: 'Northwest', conference: 'west' },
  { id: 'pacific', name: 'Pacific', conference: 'west' },
  { id: 'southwest', name: 'Southwest', conference: 'west' },
];

/** ESPN team ids grouped by division. Ids are stable for the current 30 clubs. */
const DIVISION_BY_TEAM_ID: Readonly<Record<string, string>> = {
  '2': 'atlantic',
  '17': 'atlantic',
  '18': 'atlantic',
  '20': 'atlantic',
  '28': 'atlantic',
  '4': 'central',
  '5': 'central',
  '8': 'central',
  '11': 'central',
  '15': 'central',
  '1': 'southeast',
  '14': 'southeast',
  '19': 'southeast',
  '27': 'southeast',
  '30': 'southeast',
  '7': 'northwest',
  '16': 'northwest',
  '22': 'northwest',
  '25': 'northwest',
  '26': 'northwest',
  '9': 'pacific',
  '12': 'pacific',
  '13': 'pacific',
  '21': 'pacific',
  '23': 'pacific',
  '3': 'southwest',
  '6': 'southwest',
  '10': 'southwest',
  '24': 'southwest',
  '29': 'southwest',
};

export function divisionsForConference(
  conference: 'east' | 'west',
): NbaDivision[] {
  return DIVISION_CATALOG.filter(
    (division) => division.conference === conference,
  );
}

export function divisionIdForTeam(teamId: string): string | null {
  return DIVISION_BY_TEAM_ID[teamId] ?? null;
}

/**
 * Places for one conference.
 * Teams that have not played keep a unique place. Teams that have played
 * share a place only when the record and every tiebreaker still match,
 * and the next place skips ahead (1, 2, 2, 4).
 */
export function assignPlaces<T extends RankableTeam>(
  teams: readonly T[],
): Array<T & { seed: number }> {
  const sorted = teams
    .map((team, index) => ({ team, index }))
    .sort((left, right) => {
      const order = compareTeams(left.team, right.team);
      return order === 0 ? left.index - right.index : order;
    });

  const placed: Array<T & { seed: number }> = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index].team;
    const previous = index > 0 ? sorted[index - 1].team : null;
    const share =
      previous !== null &&
      hasPlayed(current) &&
      hasPlayed(previous) &&
      compareTeams(previous, current) === 0;
    const seed = share ? placed[index - 1].seed : index + 1;
    placed.push({ ...current, seed });
  }
  return placed;
}

/** Negative when `left` should rank above `right`. */
function compareTeams(left: RankableTeam, right: RankableTeam): number {
  const winningPercentage = compareHigherRateFirst(
    rate(left.wins, left.losses, true),
    rate(right.wins, right.losses, true),
  );
  if (winningPercentage !== 0) return winningPercentage;
  if (left.wins !== right.wins) return right.wins - left.wins;
  if (left.losses !== right.losses) return left.losses - right.losses;

  const conference = compareSplit(left.conference, right.conference);
  if (conference !== 0) return conference;

  if (sameDivision(left.id, right.id)) {
    const division = compareSplit(left.division, right.division);
    if (division !== 0) return division;
  }

  if (left.differential !== right.differential) {
    return right.differential - left.differential;
  }
  return 0;
}

function hasPlayed(team: RankableTeam): boolean {
  return team.wins + team.losses > 0;
}

function sameDivision(leftId: string, rightId: string): boolean {
  const division = DIVISION_BY_TEAM_ID[leftId];
  return division !== undefined && division === DIVISION_BY_TEAM_ID[rightId];
}

/**
 * Unplayed teams use a .500 rate so they sit below winning records and
 * above losing records. Split records with no games stay at 0.
 */
function rate(
  wins: number,
  losses: number,
  neutralWhenUnplayed: boolean,
): { wins: number; games: number } {
  const games = wins + losses;
  if (games === 0) {
    return neutralWhenUnplayed ? { wins: 1, games: 2 } : { wins: 0, games: 1 };
  }
  return { wins, games };
}

/** Positive when `right` has the higher rate, so `left` sorts later. */
function compareHigherRateFirst(
  left: { wins: number; games: number },
  right: { wins: number; games: number },
): number {
  return right.wins * left.games - left.wins * right.games;
}

function compareSplit(left: StandingSplit, right: StandingSplit): number {
  const percentage = compareHigherRateFirst(
    rate(left.wins, left.losses, false),
    rate(right.wins, right.losses, false),
  );
  if (percentage !== 0) return percentage;
  return right.wins - left.wins;
}
