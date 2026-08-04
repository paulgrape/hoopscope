import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeasonStatsQueryDto } from '../common/dto/season-stats-query.dto';
import { TeamsService } from './teams.service';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all 30 NBA teams' })
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Get(':id/roster')
  @ApiOperation({ summary: 'Get team roster' })
  findRoster(@Param('id') id: string) {
    return this.teamsService.findRoster(id);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Team player averages (regular season or playoffs)',
  })
  findSeasonStats(
    @Param('id') id: string,
    @Query() query: SeasonStatsQueryDto,
  ) {
    return this.teamsService.findSeasonStats(
      id,
      query.season,
      query.seasonType ?? 'regular',
    );
  }
}
