import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/** Payload shared by every `game:*` WebSocket message. */
export class ReplayMessageDto {
  @IsString()
  @IsNotEmpty()
  gameId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(20)
  pace?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  playIndex?: number;
}
