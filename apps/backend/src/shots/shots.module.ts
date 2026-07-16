import { Module } from '@nestjs/common';
import { ShotsController } from './shots.controller';
import { ShotsService } from './shots.service';

@Module({
  controllers: [ShotsController],
  providers: [ShotsService],
})
export class ShotsModule {}
