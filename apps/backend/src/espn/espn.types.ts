/**
 * Structural types for the raw ESPN JSON we consume. They describe the subset
 * of each payload the mappers read, not the full upstream schema, so nearly
 * every field is optional: ESPN omits keys freely between game states.
 */

export interface EspnLogo {
  href?: string;
}

export interface EspnTeamCore {
  id?: string;
  name?: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  location?: string;
  logo?: string;
  logos?: EspnLogo[];
  color?: string;
  alternateColor?: string;
  record?: {
    items?: Array<{ summary?: string }>;
  };
}

export interface EspnStatusType {
  state?: string;
  description?: string;
  detail?: string;
  shortDetail?: string;
}

export interface EspnStatus {
  period?: number;
  displayClock?: string;
  type?: EspnStatusType;
}

export interface EspnLinescore {
  value?: number | string;
  displayValue?: string;
}

export interface EspnCompetitor {
  id?: string;
  homeAway?: string;
  score?: string | number;
  team?: EspnTeamCore;
  linescores?: EspnLinescore[];
}

export interface EspnCompetition {
  id?: string;
  date?: string;
  status?: EspnStatus;
  venue?: { fullName?: string };
  competitors?: EspnCompetitor[];
}

export interface EspnScoreboardEvent {
  id: string;
  name?: string;
  shortName?: string;
  date?: string;
  status?: EspnStatus;
  competitions?: EspnCompetition[];
}

export interface EspnScoreboardResponse {
  events?: EspnScoreboardEvent[];
}

export interface EspnAthleteRef {
  id?: string;
  displayName?: string;
  fullName?: string;
  shortName?: string;
  jersey?: string;
  position?: {
    abbreviation?: string;
    name?: string;
    displayName?: string;
  };
  /** The core API returns an object; the byathlete feed sometimes a bare URL. */
  headshot?: { href?: string } | string;
}

export interface EspnBoxScoreStat {
  name?: string;
  label?: string;
  abbreviation?: string;
  displayValue?: string;
}

export interface EspnBoxScoreTeam {
  team?: EspnTeamCore;
  statistics?: EspnBoxScoreStat[];
}

export interface EspnBoxScoreAthleteEntry {
  athlete?: EspnAthleteRef;
  starter?: boolean;
  didNotPlay?: boolean;
  stats?: string[];
}

export interface EspnBoxScorePlayerGroup {
  team?: EspnTeamCore;
  statistics?: Array<{
    labels?: string[];
    athletes?: EspnBoxScoreAthleteEntry[];
  }>;
}

export interface EspnLeaderEntry {
  value?: number | string;
  displayValue?: string;
  summary?: string;
  athlete?: EspnAthleteRef;
}

export interface EspnLeaderCategory {
  name?: string;
  displayName?: string;
  leaders?: EspnLeaderEntry[];
}

export interface EspnTeamLeaderGroup {
  team?: EspnTeamCore;
  leaders?: EspnLeaderCategory[];
}

export interface EspnGameSummaryResponse {
  header?: {
    id?: string;
    name?: string;
    date?: string;
    competitions?: EspnCompetition[];
  };
  boxscore?: {
    teams?: EspnBoxScoreTeam[];
    players?: EspnBoxScorePlayerGroup[];
  };
  gameInfo?: {
    venue?: { fullName?: string };
  };
  leaders?: EspnTeamLeaderGroup[];
}

export interface EspnTeamsResponse {
  sports?: Array<{
    leagues?: Array<{
      teams?: Array<{ team: EspnTeamCore }>;
    }>;
  }>;
}

export interface EspnTeamResponse {
  team?: EspnTeamCore;
}

/** One row of the `statistics/byathlete` feed, or the athlete itself. */
export interface EspnByAthleteEntry extends EspnAthleteRef {
  athlete?: EspnAthleteRef;
}

export interface EspnByAthleteResponse {
  athletes?: EspnByAthleteEntry[];
  items?: EspnByAthleteEntry[];
  leaders?: EspnByAthleteEntry[];
  categories?: Array<{ leaders?: EspnByAthleteEntry[] }>;
}

export function espnHeadshotHref(
  headshot: EspnAthleteRef['headshot'],
): string | null {
  if (!headshot) return null;
  return typeof headshot === 'string' ? headshot : (headshot.href ?? null);
}
