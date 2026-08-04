import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class NewsQueryDto {
  @ApiPropertyOptional({ example: 12, minimum: 1, maximum: 30, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be a number' })
  @Min(1)
  @Max(30)
  limit?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset must be a number' })
  @Min(0)
  offset?: number;
}
