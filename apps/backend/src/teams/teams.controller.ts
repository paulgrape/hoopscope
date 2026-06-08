import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TeamSeasonType, TeamsService } from './teams.service';

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
    @Query('season') season?: string,
    @Query('seasonType') seasonType?: string,
  ) {
    const parsedSeason = season ? Number(season) : undefined;
    if (season && !Number.isFinite(parsedSeason)) {
      throw new BadRequestException('season must be a number');
    }

    const resolvedSeasonType = (seasonType ?? 'regular') as TeamSeasonType;
    if (resolvedSeasonType !== 'regular' && resolvedSeasonType !== 'playoffs') {
      throw new BadRequestException('seasonType must be regular or playoffs');
    }

    return this.teamsService.findSeasonStats(
      id,
      parsedSeason,
      resolvedSeasonType,
    );
  }
}
