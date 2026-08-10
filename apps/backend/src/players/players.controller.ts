import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeasonStatsQueryDto } from '../common/dto/season-stats-query.dto';
import { PlayersService } from './players.service';
import { PlayerNewsQueryDto } from './dto/player-news-query.dto';
import { PlayerSearchQueryDto } from './dto/player-search-query.dto';

const DEFAULT_NEWS_LIMIT = 6;
const DEFAULT_SEARCH_LIMIT = 60;

@ApiTags('players')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  @ApiOperation({ summary: 'Search players across every current roster' })
  search(@Query() query: PlayerSearchQueryDto) {
    return this.playersService.search({
      q: query.q,
      teamId: query.teamId,
      limit: query.limit ?? DEFAULT_SEARCH_LIMIT,
    });
  }

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
  findSeasonStats(
    @Param('id') id: string,
    @Query() query: SeasonStatsQueryDto,
  ) {
    return this.playersService.findSeasonStats(
      id,
      query.season,
      query.seasonType ?? 'regular',
    );
  }

  @Get(':id/news')
  @ApiOperation({ summary: 'Get player news articles' })
  findNews(@Param('id') id: string, @Query() query: PlayerNewsQueryDto) {
    return this.playersService.findNews(id, query.limit ?? DEFAULT_NEWS_LIMIT);
  }
}
