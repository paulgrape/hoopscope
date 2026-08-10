import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

describe('PlayersController', () => {
  let controller: PlayersController;
  let players: {
    search: jest.Mock;
    findOne: jest.Mock;
    findCareerStats: jest.Mock;
    findSeasonStats: jest.Mock;
    findNews: jest.Mock;
  };

  beforeEach(() => {
    players = {
      search: jest.fn(),
      findOne: jest.fn(),
      findCareerStats: jest.fn(),
      findSeasonStats: jest.fn(),
      findNews: jest.fn(),
    };
    controller = new PlayersController(players as unknown as PlayersService);
  });

  it('defaults the search limit to 60 when omitted', () => {
    const payload = { total: 0, players: [] };
    players.search.mockReturnValue(payload);

    expect(controller.search({ q: 'curry' })).toBe(payload);
    expect(players.search).toHaveBeenCalledWith({
      q: 'curry',
      teamId: undefined,
      limit: 60,
    });
  });

  it('forwards an explicit search limit and team filter', () => {
    players.search.mockReturnValue({ total: 0, players: [] });

    controller.search({ teamId: '13', limit: 10 });

    expect(players.search).toHaveBeenCalledWith({
      q: undefined,
      teamId: '13',
      limit: 10,
    });
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
