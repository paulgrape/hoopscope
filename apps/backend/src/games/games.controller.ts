import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GameIdParamDto } from './dto/game-id-param.dto';
import {
  NearestScheduleQueryDto,
  ScheduleQueryDto,
} from './dto/schedule-query.dto';
import { GamesService } from './games.service';

@ApiTags('games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('scoreboard')
  @ApiOperation({ summary: 'Real ESPN scoreboard (today)' })
  scoreboard() {
    return this.gamesService.getScoreboard();
  }

  @Get('schedule/nearest')
  @ApiOperation({ summary: 'Nearest local date with NBA games' })
  nearestSchedule(@Query() query: NearestScheduleQueryDto) {
    return this.gamesService.getNearestScheduleDate(
      query.date,
      query.offsetMinutes,
      query.direction,
    );
  }

  @Get('schedule')
  @ApiOperation({ summary: 'Real ESPN schedule for a local date' })
  schedule(@Query() query: ScheduleQueryDto) {
    return this.gamesService.getSchedule(query.date, query.offsetMinutes);
  }

  @Get('live')
  @ApiOperation({ summary: 'Active simulated games' })
  live() {
    return this.gamesService.getActiveGames();
  }

  @Get('live/:id')
  @ApiOperation({ summary: 'Single simulated game state' })
  liveOne(@Param('id') id: string) {
    const game = this.gamesService.getGame(id);
    if (!game) {
      throw new NotFoundException(`Game ${id} not found`);
    }

    return game;
  }

  @Get(':gameId')
  @ApiOperation({
    summary:
      'ESPN game summary with line score, box score, totals, and leaders',
  })
  async gameSummary(@Param() params: GameIdParamDto) {
    return this.gamesService.getGameSummary(params.gameId);
  }
}
