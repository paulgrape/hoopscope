import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeasonStatsQueryDto } from '../common/dto/season-stats-query.dto';
import { TeamStatsService } from './team-stats.service';

@ApiTags('team-stats')
@Controller('team-stats')
export class TeamStatsController {
  constructor(private readonly teamStats: TeamStatsService) {}

  @Get()
  @ApiOperation({ summary: 'League team season stat sheet' })
  findAll(@Query() query: SeasonStatsQueryDto) {
    return this.teamStats.findAll(query);
  }
}
