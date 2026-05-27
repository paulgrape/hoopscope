import { Controller, Get, Param } from '@nestjs/common';
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
}
