import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class PlayerSearchQueryDto {
  @ApiPropertyOptional({
    example: 'curry',
    description: 'Name fragment; accent and case insensitive',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'q must be 60 characters or fewer' })
  q?: string;

  @ApiPropertyOptional({ example: '9' })
  @IsOptional()
  @Matches(/^\d+$/, { message: 'teamId must be numeric' })
  teamId?: string;

  @ApiPropertyOptional({ example: 60, minimum: 1, maximum: 200, default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be a positive number' })
  @Min(1)
  @Max(200)
  limit?: number;
}
