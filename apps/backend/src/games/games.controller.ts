import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  nearestSchedule(
    @Query('date') date?: string,
    @Query('offsetMinutes') offsetMinutes?: string,
    @Query('direction') direction?: string,
  ) {
    return this.gamesService.getNearestScheduleDate(
      date,
      offsetMinutes,
      direction,
    );
  }

  @Get('schedule')
  @ApiOperation({ summary: 'Real ESPN schedule for a local date' })
  schedule(
    @Query('date') date?: string,
    @Query('offsetMinutes') offsetMinutes?: string,
  ) {
    return this.gamesService.getSchedule(date, offsetMinutes);
  }

  @Get('live')
  @ApiOperation({ summary: 'Active simulated games' })
  live() {
    return this.gamesService.getActiveGames();
  }

  @Get('live/:id')
  @ApiOperation({ summary: 'Single simulated game state' })
  liveOne(@Param('id') id: string) {
    return this.gamesService.getGame(id);
  }

  @Get(':gameId')
  @ApiOperation({ summary: 'ESPN game summary with box totals and leaders' })
  async gameSummary(@Param('gameId') gameId: string) {
    if (gameId === 'schedule' || gameId === 'live' || gameId === 'scoreboard') {
      throw new NotFoundException();
    }
    return this.gamesService.getGameSummary(gameId);
  }
}
