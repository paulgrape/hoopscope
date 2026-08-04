import {
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let health: { check: jest.Mock };
  let http: { pingCheck: jest.Mock };
  let memory: { checkHeap: jest.Mock };

  async function runIndicators() {
    const [indicators] = health.check.mock.calls.at(-1) as [
      Array<() => unknown>,
    ];
    await Promise.all(indicators.map((indicator) => indicator()));
  }

  beforeEach(() => {
    health = { check: jest.fn().mockResolvedValue({ status: 'ok' }) };
    http = { pingCheck: jest.fn().mockResolvedValue({}) };
    memory = { checkHeap: jest.fn().mockResolvedValue({}) };

    controller = new HealthController(
      health as unknown as HealthCheckService,
      http as unknown as HttpHealthIndicator,
      memory as unknown as MemoryHealthIndicator,
    );
  });

  it('keeps liveness free of upstream checks', async () => {
    await controller.live();
    await runIndicators();

    expect(memory.checkHeap).toHaveBeenCalled();
    expect(http.pingCheck).not.toHaveBeenCalled();
  });

  it('checks ESPN reachability for readiness', async () => {
    await controller.ready();
    await runIndicators();

    expect(memory.checkHeap).toHaveBeenCalled();
    expect(http.pingCheck).toHaveBeenCalledWith(
      'espn',
      expect.stringContaining('site.api.espn.com'),
    );
  });

  it('keeps /health as a readiness alias', async () => {
    await controller.check();
    await runIndicators();

    expect(http.pingCheck).toHaveBeenCalled();
  });
});
