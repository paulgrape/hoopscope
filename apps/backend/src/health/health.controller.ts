import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

const HEAP_LIMIT_BYTES = 512 * 1024 * 1024;
const ESPN_PING_URL =
  'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams?limit=1';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  /**
   * Liveness: is this process itself healthy? Deliberately free of upstream
   * checks so an ESPN outage cannot trigger a restart loop.
   */
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe (process only)' })
  @HealthCheck()
  live() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', HEAP_LIMIT_BYTES),
    ]);
  }

  /** Readiness: can this process serve useful traffic right now? */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (process plus ESPN reachability)' })
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', HEAP_LIMIT_BYTES),
      () => this.http.pingCheck('espn', ESPN_PING_URL),
    ]);
  }

  @Get()
  @ApiOperation({ summary: 'Alias for the readiness probe' })
  @HealthCheck()
  check() {
    return this.ready();
  }
}
