import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EspnSeasonType } from '../espn/espn.service';
import { PlayersService } from './players.service';

@ApiTags('players')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get player profile with team and injury status' })
  findOne(@Param('id') id: string) {
    return this.playersService.findOne(id);
  }

  @Get(':id/stats/career')
  @ApiOperation({ summary: 'Get player career stats by season' })
  findCareerStats(@Param('id') id: string) {
    return this.playersService.findCareerStats(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get player season averages (regular or playoffs)' })
  @ApiQuery({ name: 'season', required: false, type: Number })
  @ApiQuery({
    name: 'seasonType',
    required: false,
    enum: ['regular', 'playoffs'],
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

    const resolvedSeasonType = (seasonType ?? 'regular') as EspnSeasonType;
    if (resolvedSeasonType !== 'regular' && resolvedSeasonType !== 'playoffs') {
      throw new BadRequestException('seasonType must be regular or playoffs');
    }

    return this.playersService.findSeasonStats(
      id,
      parsedSeason,
      resolvedSeasonType,
    );
  }

  @Get(':id/news')
  @ApiOperation({ summary: 'Get player news articles' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findNews(@Param('id') id: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 6;
    if (limit && (!Number.isFinite(parsedLimit) || parsedLimit <= 0)) {
      throw new BadRequestException('limit must be a positive number');
    }

    return this.playersService.findNews(id, parsedLimit);
  }
}
