import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NbaSeasonType } from '../nba-stats/nba-stats.service';
import { ShotsService } from './shots.service';

const SEASON_TYPES: NbaSeasonType[] = [
  'Regular Season',
  'Playoffs',
  'Pre Season',
  'All Star',
];

@ApiTags('shots')
@Controller('shots')
export class ShotsController {
  private readonly defaultSeason: string;

  constructor(
    private readonly shotsService: ShotsService,
    config: ConfigService,
  ) {
    this.defaultSeason = config.get<string>('NBA_DEFAULT_SEASON') ?? '2025-26';
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Get player shot chart points for a heatmap' })
  @ApiQuery({ name: 'playerId', required: true, example: '201939' })
  @ApiQuery({ name: 'season', required: false, example: '2025-26' })
  @ApiQuery({
    name: 'seasonType',
    required: false,
    enum: SEASON_TYPES,
    example: 'Regular Season',
  })
  getHeatmap(
    @Query('playerId') playerId?: string,
    @Query('season') season?: string,
    @Query('seasonType') seasonType?: string,
  ) {
    if (!playerId?.trim()) {
      throw new BadRequestException('playerId is required');
    }

    const resolvedSeason = season?.trim() || this.defaultSeason;
    const resolvedSeasonType = (seasonType?.trim() ||
      'Regular Season') as NbaSeasonType;

    if (!SEASON_TYPES.includes(resolvedSeasonType)) {
      throw new BadRequestException(
        `seasonType must be one of: ${SEASON_TYPES.join(', ')}`,
      );
    }

    return this.shotsService.getHeatmap(
      playerId.trim(),
      resolvedSeason,
      resolvedSeasonType,
    );
  }
}
