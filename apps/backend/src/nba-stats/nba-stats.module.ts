import { Global, Module } from '@nestjs/common';
import { NbaStatsService } from './nba-stats.service';

@Global()
@Module({
  providers: [NbaStatsService],
  exports: [NbaStatsService],
})
export class NbaStatsModule {}
