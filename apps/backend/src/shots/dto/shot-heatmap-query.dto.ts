import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import type { NbaSeasonType } from '../../nba-stats/nba-stats.service';

export const SEASON_TYPES: NbaSeasonType[] = [
  'Regular Season',
  'Playoffs',
  'Pre Season',
  'All Star',
];

export class ShotHeatmapQueryDto {
  @ApiProperty({ example: '201939' })
  @IsNotEmpty({ message: 'playerId is required' })
  @Matches(/^\d+$/, { message: 'playerId must be numeric' })
  playerId: string;

  @ApiPropertyOptional({ example: '2025-26' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'season must use YYYY-YY format' })
  season?: string;

  @ApiPropertyOptional({ enum: SEASON_TYPES, default: 'Regular Season' })
  @IsOptional()
  @IsIn(SEASON_TYPES, {
    message: `seasonType must be one of: ${SEASON_TYPES.join(', ')}`,
  })
  seasonType?: NbaSeasonType;
}
