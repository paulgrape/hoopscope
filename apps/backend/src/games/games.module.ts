import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { LiveGamesGateway } from './live-games.gateway';
import { SimulationService } from './simulation.service';

@Module({
  controllers: [GamesController],
  providers: [GamesService, SimulationService, LiveGamesGateway],
})
export class GamesModule {}
