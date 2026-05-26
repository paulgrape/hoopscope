import { Module } from '@nestjs/common';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { EspnModule } from '../espn/espn.module';

@Module({
  imports: [EspnModule],
  controllers: [PlayersController],
  providers: [PlayersService],
})
export class PlayersModule {}
