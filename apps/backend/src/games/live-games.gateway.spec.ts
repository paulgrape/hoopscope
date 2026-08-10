import { type Socket } from 'socket.io';
import { LiveGamesGateway } from './live-games.gateway';
import { SimulationService, type LiveGameState } from './simulation.service';

describe('LiveGamesGateway', () => {
  let gateway: LiveGamesGateway;
  let simulation: {
    startAll: jest.Mock;
    startReplay: jest.Mock;
    setReplayPace: jest.Mock;
    seekReplay: jest.Mock;
    pauseReplay: jest.Mock;
    resumeReplay: jest.Mock;
    stopReplay: jest.Mock;
    stopClient: jest.Mock;
  };
  let client: { id: string; emit: jest.Mock };

  const state = { id: 'historic-1' } as LiveGameState;

  beforeEach(() => {
    simulation = {
      startAll: jest.fn(),
      startReplay: jest.fn(),
      setReplayPace: jest.fn(),
      seekReplay: jest.fn(),
      pauseReplay: jest.fn(),
      resumeReplay: jest.fn(),
      stopReplay: jest.fn(),
      stopClient: jest.fn(),
    };
    gateway = new LiveGamesGateway(simulation as unknown as SimulationService);
    client = { id: 'client-1', emit: jest.fn() };
  });

  it('starts all replays on init', () => {
    gateway.afterInit();

    expect(simulation.startAll).toHaveBeenCalled();
  });

  it('subscribes and wires game:update ticks', () => {
    simulation.startReplay.mockImplementation(
      (
        _clientId: string,
        _gameId: string,
        _pace: number,
        onTick: (next: LiveGameState) => void,
      ) => {
        onTick(state);
        return state;
      },
    );

    gateway.handleSubscribe(
      { gameId: 'historic-1', pace: 2 },
      client as unknown as Socket,
    );

    expect(simulation.startReplay).toHaveBeenCalledWith(
      'client-1',
      'historic-1',
      2,
      expect.any(Function),
    );
    expect(client.emit).toHaveBeenCalledWith('game:update', state);
    expect(client.emit).not.toHaveBeenCalledWith(
      'game:not-found',
      expect.anything(),
    );
  });

  it('defaults pace to 1 and emits game:not-found when missing', () => {
    simulation.startReplay.mockReturnValue(null);

    gateway.handleSubscribe(
      { gameId: 'missing' },
      client as unknown as Socket,
    );

    expect(simulation.startReplay).toHaveBeenCalledWith(
      'client-1',
      'missing',
      1,
      expect.any(Function),
    );
    expect(client.emit).toHaveBeenCalledWith('game:not-found', 'missing');
  });

  it('seeks when playIndex is provided', () => {
    simulation.seekReplay.mockImplementation(
      (
        _clientId: string,
        _gameId: string,
        _playIndex: number,
        onTick: (next: LiveGameState) => void,
      ) => {
        onTick(state);
      },
    );

    gateway.handleSeek(
      { gameId: 'historic-1', playIndex: 12 },
      client as unknown as Socket,
    );

    expect(simulation.seekReplay).toHaveBeenCalledWith(
      'client-1',
      'historic-1',
      12,
      expect.any(Function),
    );
    expect(client.emit).toHaveBeenCalledWith('game:update', state);
  });

  it('ignores seek when playIndex is missing', () => {
    gateway.handleSeek({ gameId: 'historic-1' }, client as unknown as Socket);

    expect(simulation.seekReplay).not.toHaveBeenCalled();
  });

  it('pauses and resumes the replay', () => {
    simulation.pauseReplay.mockImplementation(
      (
        _clientId: string,
        _gameId: string,
        onTick: (next: LiveGameState) => void,
      ) => {
        onTick(state);
      },
    );
    simulation.resumeReplay.mockImplementation(
      (
        _clientId: string,
        _gameId: string,
        onTick: (next: LiveGameState) => void,
      ) => {
        onTick(state);
      },
    );

    gateway.handlePause(
      { gameId: 'historic-1' },
      client as unknown as Socket,
    );
    gateway.handleResume(
      { gameId: 'historic-1' },
      client as unknown as Socket,
    );

    expect(simulation.pauseReplay).toHaveBeenCalledWith(
      'client-1',
      'historic-1',
      expect.any(Function),
    );
    expect(simulation.resumeReplay).toHaveBeenCalledWith(
      'client-1',
      'historic-1',
      expect.any(Function),
    );
    expect(client.emit).toHaveBeenCalledWith('game:update', state);
  });

  it('stops all client sessions on disconnect', () => {
    gateway.handleDisconnect(client as unknown as Socket);

    expect(simulation.stopClient).toHaveBeenCalledWith('client-1');
  });

  it('unsubscribes a single game', () => {
    gateway.handleUnsubscribe(
      { gameId: 'historic-1' },
      client as unknown as Socket,
    );

    expect(simulation.stopReplay).toHaveBeenCalledWith(
      'client-1',
      'historic-1',
    );
  });
});
