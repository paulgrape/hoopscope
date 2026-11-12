import type { EspnSeasonType } from '../espn/espn.service';
import {
  LeaderCategory,
  LeaderSeasonRow,
  LeaderStat,
  QualificationStat,
} from './leaders.types';

const CATEGORIES: Array<{
  stat: LeaderStat;
  label: string;
  abbreviation: string;
  qualificationStat?: QualificationStat;
  makes?: number;
}> = [
  { stat: 'pts', label: 'Points', abbreviation: 'PTS' },
  { stat: 'reb', label: 'Rebounds', abbreviation: 'REB' },
  { stat: 'ast', label: 'Assists', abbreviation: 'AST' },
  { stat: 'stl', label: 'Steals', abbreviation: 'STL' },
  { stat: 'blk', label: 'Blocks', abbreviation: 'BLK' },
  { stat: 'min', label: 'Minutes', abbreviation: 'MIN' },
  { stat: 'threePm', label: 'Threes made', abbreviation: '3PM' },
  {
    stat: 'fgPct',
    label: 'Field goal percentage',
    abbreviation: 'FG%',
    qualificationStat: 'fgm',
    makes: 300,
  },
  {
    stat: 'threePointPct',
    label: 'Three-point percentage',
    abbreviation: '3P%',
    qualificationStat: 'threePmTotal',
    makes: 82,
  },
  {
    stat: 'freeThrowPct',
    label: 'Free throw percentage',
    abbreviation: 'FT%',
    qualificationStat: 'ftm',
    makes: 125,
  },
];

export function rankLeaders(
  rows: LeaderSeasonRow[],
  seasonType: EspnSeasonType,
  stat?: LeaderStat,
  limit = 5,
): LeaderCategory[] {
  const maxGames = rows.reduce((max, row) => Math.max(max, row.gamesPlayed), 0);
  const teamGames =
    seasonType === 'regular' ? Math.min(82, maxGames) : maxGames;
  const count = Number.isFinite(limit)
    ? Math.max(1, Math.min(50, Math.floor(limit)))
    : 5;

  return CATEGORIES.filter((category) => !stat || category.stat === stat).map(
    (category) => {
      const qualificationStat = category.qualificationStat ?? 'gp';
      const minimum =
        category.makes != null
          ? (category.makes * teamGames) / 82
          : Math.max(1, Math.ceil(0.7 * teamGames));
      const qualified = rows.filter(
        (row) =>
          row.gamesPlayed > 0 &&
          row.values[category.stat] != null &&
          (qualificationStat === 'gp'
            ? row.gamesPlayed
            : row[qualificationStat]) >= minimum,
      );
      qualified.sort(
        (a, b) =>
          b.values[category.stat]! - a.values[category.stat]! ||
          b.gamesPlayed - a.gamesPlayed ||
          a.name.localeCompare(b.name) ||
          a.playerId.localeCompare(b.playerId),
      );
      let rank = 0;
      let previousValue: number | undefined;
      const leaders = qualified.slice(0, count).map((row, index) => {
        const value = row.values[category.stat]!;
        if (value !== previousValue) rank = index + 1;
        previousValue = value;
        const {
          values: _values,
          fgm: _fgm,
          ftm: _ftm,
          threePmTotal: _threePmTotal,
          ...player
        } = row;
        return { ...player, rank, value };
      });
      return {
        stat: category.stat,
        label: category.label,
        abbreviation: category.abbreviation,
        format: category.makes != null ? 'percent' : 'average',
        qualification: { stat: qualificationStat, minimum, teamGames },
        leaders,
      };
    },
  );
}
