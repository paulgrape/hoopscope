import { NotFoundException } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { type LiveGameState } from './simulation.service';

describe('GamesController.liveOne', () => {
  let controller: GamesController;
  let games: { getGame: jest.Mock };

  beforeEach(() => {
    games = { getGame: jest.fn() };
    controller = new GamesController(games as unknown as GamesService);
  });

  it('returns the simulated game state', () => {
    const game = { id: 'game-1' } as LiveGameState;
    games.getGame.mockReturnValue(game);

    expect(controller.liveOne('game-1')).toBe(game);
  });

  it('answers 404 for an unknown game instead of an empty body', () => {
    games.getGame.mockReturnValue(null);

    expect(() => controller.liveOne('nope')).toThrow(NotFoundException);
  });
});
