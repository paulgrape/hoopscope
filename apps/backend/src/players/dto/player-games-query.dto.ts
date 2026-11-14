import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PlayerGamesQueryDto {
  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 20, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be a positive number' })
  @Min(1)
  @Max(20)
  limit?: number;
}
