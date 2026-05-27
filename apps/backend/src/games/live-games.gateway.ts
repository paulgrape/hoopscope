import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SimulationService } from './simulation.service';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3001' },
  namespace: '/live',
})
export class LiveGamesGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(LiveGamesGateway.name);

  constructor(private readonly simulation: SimulationService) {}

  afterInit() {
    // Start simulation — emit to each game's room on every tick
    this.simulation.startAll((gameId, state) => {
      this.server.to(gameId).emit('game:update', state);
    });
    this.logger.log('LiveGamesGateway initialized, simulation started');
  }

  @SubscribeMessage('game:subscribe')
  handleSubscribe(
    @MessageBody() gameId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(gameId);
    const state = this.simulation.getGame(gameId);
    if (state) client.emit('game:update', state); // send current state immediately
    this.logger.log(`Client ${client.id} subscribed to game ${gameId}`);
  }

  @SubscribeMessage('game:unsubscribe')
  handleUnsubscribe(
    @MessageBody() gameId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(gameId);
    this.logger.log(`Client ${client.id} unsubscribed from game ${gameId}`);
  }
}
