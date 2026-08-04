import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

/** Widest real timezone offset is UTC+14, and browsers report the inverse sign. */
const MAX_OFFSET_MINUTES = 14 * 60;

export class ScheduleQueryDto {
  @ApiPropertyOptional({ example: '2026-01-31', description: 'Local date key' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must use YYYY-MM-DD format',
  })
  date?: string;

  @ApiPropertyOptional({
    example: -180,
    description: 'Client timezone offset as reported by getTimezoneOffset()',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offsetMinutes must be a whole number of minutes' })
  @Min(-MAX_OFFSET_MINUTES)
  @Max(MAX_OFFSET_MINUTES)
  offsetMinutes?: number;
}

export class NearestScheduleQueryDto extends ScheduleQueryDto {
  @ApiPropertyOptional({ enum: ['before', 'after'], default: 'before' })
  @IsOptional()
  @IsIn(['before', 'after'], {
    message: 'direction must be before or after',
  })
  direction?: 'before' | 'after';
}
