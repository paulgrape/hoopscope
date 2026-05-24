import { Module, Global } from '@nestjs/common';
import { EspnService } from './espn.service';

@Global()
@Module({
  providers: [EspnService],
  exports: [EspnService],
})
export class EspnModule {}
