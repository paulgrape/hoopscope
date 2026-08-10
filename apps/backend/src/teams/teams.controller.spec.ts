import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

describe('TeamsController', () => {
  let controller: TeamsController;
  let teams: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    findRoster: jest.Mock;
    findSeasonStats: jest.Mock;
  };

  beforeEach(() => {
    teams = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findRoster: jest.fn(),
      findSeasonStats: jest.fn(),
    };
    controller = new TeamsController(teams as unknown as TeamsService);
  });

  it('lists all teams', () => {
    const payload = [{ id: '1' }];
    teams.findAll.mockReturnValue(payload);

    expect(controller.findAll()).toBe(payload);
  });

  it('loads a team by id', () => {
    const payload = { id: '2' };
    teams.findOne.mockReturnValue(payload);

    expect(controller.findOne('2')).toBe(payload);
    expect(teams.findOne).toHaveBeenCalledWith('2');
  });

  it('loads a team roster', () => {
    const payload = [{ id: 'player-1' }];
    teams.findRoster.mockReturnValue(payload);

    expect(controller.findRoster('2')).toBe(payload);
    expect(teams.findRoster).toHaveBeenCalledWith('2');
  });

  it('defaults season type to regular when omitted', () => {
    const payload = { players: [] };
    teams.findSeasonStats.mockReturnValue(payload);

    expect(controller.findSeasonStats('2', { season: 2025 })).toBe(payload);
    expect(teams.findSeasonStats).toHaveBeenCalledWith('2', 2025, 'regular');
  });

  it('forwards an explicit season type', () => {
    teams.findSeasonStats.mockReturnValue({ players: [] });

    controller.findSeasonStats('2', { season: 2024, seasonType: 'playoffs' });

    expect(teams.findSeasonStats).toHaveBeenCalledWith('2', 2024, 'playoffs');
  });
});
