import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PlayerNewsQueryDto {
  @ApiPropertyOptional({ example: 6, minimum: 1, maximum: 30, default: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be a positive number' })
  @Min(1)
  @Max(30)
  limit?: number;
}
