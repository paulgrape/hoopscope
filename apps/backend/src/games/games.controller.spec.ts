import { NotFoundException } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { type LiveGameState } from './simulation.service';

describe('GamesController', () => {
  let controller: GamesController;
  let games: {
    getScoreboard: jest.Mock;
    getNearestScheduleDate: jest.Mock;
    getSchedule: jest.Mock;
    getActiveGames: jest.Mock;
    getGame: jest.Mock;
    getGameSummary: jest.Mock;
  };

  beforeEach(() => {
    games = {
      getScoreboard: jest.fn(),
      getNearestScheduleDate: jest.fn(),
      getSchedule: jest.fn(),
      getActiveGames: jest.fn(),
      getGame: jest.fn(),
      getGameSummary: jest.fn(),
    };
    controller = new GamesController(games as unknown as GamesService);
  });

  it('returns the scoreboard', () => {
    const payload = [{ id: '1' }];
    games.getScoreboard.mockReturnValue(payload);

    expect(controller.scoreboard()).toBe(payload);
  });

  it('forwards nearest-schedule query params', () => {
    const payload = { date: '2026-01-14' };
    games.getNearestScheduleDate.mockReturnValue(payload);

    expect(
      controller.nearestSchedule({
        date: '2026-01-15',
        offsetMinutes: 60,
        direction: 'before',
      }),
    ).toBe(payload);
    expect(games.getNearestScheduleDate).toHaveBeenCalledWith(
      '2026-01-15',
      60,
      'before',
    );
  });

  it('forwards schedule query params', () => {
    const payload = [{ id: '1' }];
    games.getSchedule.mockReturnValue(payload);

    expect(controller.schedule({ date: '2026-01-14', offsetMinutes: 0 })).toBe(
      payload,
    );
    expect(games.getSchedule).toHaveBeenCalledWith('2026-01-14', 0);
  });

  it('lists active simulated games', () => {
    const payload = [{ id: 'sim-1' }];
    games.getActiveGames.mockReturnValue(payload);

    expect(controller.live()).toBe(payload);
  });

  it('returns the simulated game state', () => {
    const game = { id: 'game-1' } as LiveGameState;
    games.getGame.mockReturnValue(game);

    expect(controller.liveOne('game-1')).toBe(game);
  });

  it('answers 404 for an unknown live game instead of an empty body', () => {
    games.getGame.mockReturnValue(null);

    expect(() => controller.liveOne('nope')).toThrow(NotFoundException);
  });

  it('loads an ESPN game summary', async () => {
    const payload = { id: '401585601' };
    games.getGameSummary.mockResolvedValue(payload);

    await expect(controller.gameSummary({ gameId: '401585601' })).resolves.toBe(
      payload,
    );
    expect(games.getGameSummary).toHaveBeenCalledWith('401585601');
  });
});
