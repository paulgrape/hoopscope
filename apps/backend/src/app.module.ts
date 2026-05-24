import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { CacheModule } from './cache/cache.module';
import { EspnModule } from './espn/espn.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    HealthModule,
    CacheModule,
    EspnModule,
    TeamsModule,
  ],
})
export class AppModule {}
