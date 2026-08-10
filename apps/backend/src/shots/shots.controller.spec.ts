import { ConfigService } from '@nestjs/config';
import { ShotsController } from './shots.controller';
import { ShotsService } from './shots.service';

describe('ShotsController', () => {
  let shots: { getHeatmap: jest.Mock };

  function buildController(season?: string) {
    shots = { getHeatmap: jest.fn() };
    const config = {
      get: jest.fn().mockReturnValue(season),
    };
    return new ShotsController(
      shots as unknown as ShotsService,
      config as unknown as ConfigService,
    );
  }

  it('forwards playerId with defaults from config and Regular Season', () => {
    const controller = buildController('2024-25');
    const payload = { points: [] };
    shots.getHeatmap.mockReturnValue(payload);

    expect(controller.getHeatmap({ playerId: '2544' })).toBe(payload);
    expect(shots.getHeatmap).toHaveBeenCalledWith(
      '2544',
      '2024-25',
      'Regular Season',
    );
  });

  it('falls back to 2025-26 when NBA_DEFAULT_SEASON is unset', () => {
    const controller = buildController(undefined);
    shots.getHeatmap.mockReturnValue({ points: [] });

    controller.getHeatmap({ playerId: '2544' });

    expect(shots.getHeatmap).toHaveBeenCalledWith(
      '2544',
      '2025-26',
      'Regular Season',
    );
  });

  it('forwards explicit season and seasonType', () => {
    const controller = buildController('2025-26');
    shots.getHeatmap.mockReturnValue({ points: [] });

    controller.getHeatmap({
      playerId: '2544',
      season: '2023-24',
      seasonType: 'Playoffs',
    });

    expect(shots.getHeatmap).toHaveBeenCalledWith(
      '2544',
      '2023-24',
      'Playoffs',
    );
  });
});
