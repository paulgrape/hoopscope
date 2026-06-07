import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SimulationService } from './simulation.service';

type ReplaySubscriptionPayload =
  | string
  | {
      gameId: string;
      pace?: number;
    };

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3001' },
  namespace: '/live',
})
export class LiveGamesGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(LiveGamesGateway.name);

  constructor(private readonly simulation: SimulationService) {}

  afterInit() {
    this.simulation.startAll();
    this.logger.log('LiveGamesGateway initialized, replays ready');
  }

  handleDisconnect(client: Socket) {
    this.simulation.stopClient(client.id);
  }

  @SubscribeMessage('game:subscribe')
  handleSubscribe(
    @MessageBody() payload: ReplaySubscriptionPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { gameId, pace } = this.parsePayload(payload);
    const state = this.simulation.startReplay(
      client.id,
      gameId,
      pace,
      (state) => {
        client.emit('game:update', state);
      },
    );

    if (!state) client.emit('game:not-found', gameId);
    this.logger.log(`Client ${client.id} subscribed to game ${gameId}`);
  }

  @SubscribeMessage('game:setPace')
  handleSetPace(
    @MessageBody() payload: ReplaySubscriptionPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { gameId, pace } = this.parsePayload(payload);
    this.simulation.setReplayPace(client.id, gameId, pace, (state) => {
      client.emit('game:update', state);
    });
  }

  @SubscribeMessage('game:unsubscribe')
  handleUnsubscribe(
    @MessageBody() payload: ReplaySubscriptionPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { gameId } = this.parsePayload(payload);
    this.simulation.stopReplay(client.id, gameId);
    this.logger.log(`Client ${client.id} unsubscribed from game ${gameId}`);
  }

  private parsePayload(payload: ReplaySubscriptionPayload) {
    if (typeof payload === 'string') {
      return { gameId: payload, pace: 1 };
    }

    return {
      gameId: payload.gameId,
      pace: payload.pace ?? 1,
    };
  }
}
