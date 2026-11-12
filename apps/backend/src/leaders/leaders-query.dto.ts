import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { SeasonStatsQueryDto } from '../common/dto/season-stats-query.dto';
import { LEADER_STATS, type LeaderStat } from './leaders.types';

export class LeadersQueryDto extends SeasonStatsQueryDto {
  @ApiPropertyOptional({ enum: LEADER_STATS })
  @IsOptional()
  @IsIn(LEADER_STATS)
  stat?: LeaderStat;

  @ApiPropertyOptional({ default: 5, minimum: 1, maximum: 50 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string' && typeof value !== 'number') return value;
    const number = Number(value);
    return Number.isInteger(number) ? Math.min(number, 50) : number;
  })
  @IsInt()
  @Min(1)
  limit?: number;
}
