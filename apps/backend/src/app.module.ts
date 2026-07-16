import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from './cache/cache.module';
import { EspnModule } from './espn/espn.module';
import { GamesModule } from './games/games.module';
import { HealthModule } from './health/health.module';
import { PlayersModule } from './players/players.module';
import { NewsModule } from './news/news.module';
import { NbaStatsModule } from './nba-stats/nba-stats.module';
import { ShotsModule } from './shots/shots.module';
import { StandingsModule } from './standings/standings.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    CacheModule,
    EspnModule,
    NbaStatsModule,
    HealthModule,
    TeamsModule,
    PlayersModule,
    GamesModule,
    NewsModule,
    ShotsModule,
    StandingsModule,
  ],
})
export class AppModule {}
