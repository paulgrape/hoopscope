import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

describe('PlayersController', () => {
  let controller: PlayersController;
  let players: {
    findOne: jest.Mock;
    findCareerStats: jest.Mock;
    findSeasonStats: jest.Mock;
    findNews: jest.Mock;
  };

  beforeEach(() => {
    players = {
      findOne: jest.fn(),
      findCareerStats: jest.fn(),
      findSeasonStats: jest.fn(),
      findNews: jest.fn(),
    };
    controller = new PlayersController(players as unknown as PlayersService);
  });

  it('loads a player profile', () => {
    const payload = { id: '2544' };
    players.findOne.mockReturnValue(payload);

    expect(controller.findOne('2544')).toBe(payload);
    expect(players.findOne).toHaveBeenCalledWith('2544');
  });

  it('loads career stats', () => {
    const payload = { seasons: [] };
    players.findCareerStats.mockReturnValue(payload);

    expect(controller.findCareerStats('2544')).toBe(payload);
  });

  it('defaults season type to regular when omitted', () => {
    const payload = { averages: {} };
    players.findSeasonStats.mockReturnValue(payload);

    expect(controller.findSeasonStats('2544', { season: 2025 })).toBe(payload);
    expect(players.findSeasonStats).toHaveBeenCalledWith(
      '2544',
      2025,
      'regular',
    );
  });

  it('defaults news limit to 6 when omitted', () => {
    const payload = [{ id: 'n1' }];
    players.findNews.mockReturnValue(payload);

    expect(controller.findNews('2544', {})).toBe(payload);
    expect(players.findNews).toHaveBeenCalledWith('2544', 6);
  });

  it('forwards an explicit news limit', () => {
    players.findNews.mockReturnValue([]);

    controller.findNews('2544', { limit: 3 });

    expect(players.findNews).toHaveBeenCalledWith('2544', 3);
  });
});
