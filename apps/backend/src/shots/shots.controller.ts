import { Controller, Get, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShotHeatmapQueryDto } from './dto/shot-heatmap-query.dto';
import { ShotsService } from './shots.service';

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
  getHeatmap(@Query() query: ShotHeatmapQueryDto) {
    return this.shotsService.getHeatmap(
      query.playerId,
      query.season ?? this.defaultSeason,
      query.seasonType ?? 'Regular Season',
    );
  }
}
