import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import type { EspnSeasonType } from '../../espn/espn.service';

/** ESPN only carries box scores back to the BAA/NBA merger era. */
const FIRST_SEASON = 1947;
const LAST_SEASON = 2100;

/** Shared by the player and team season-average endpoints. */
export class SeasonStatsQueryDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'season must be a number' })
  @Min(FIRST_SEASON)
  @Max(LAST_SEASON)
  season?: number;

  @ApiPropertyOptional({ enum: ['regular', 'playoffs'], default: 'regular' })
  @IsOptional()
  @IsIn(['regular', 'playoffs'], {
    message: 'seasonType must be regular or playoffs',
  })
  seasonType?: EspnSeasonType;
}
