import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ReplayMessageDto } from './dto/replay-message.dto';
import { SimulationService } from './simulation.service';

const DEFAULT_PACE = 1;

// Without this, a rejected payload reaches the client as "Internal server error".
const replayValidationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  exceptionFactory: (errors) =>
    new WsException(
      errors.flatMap((error) => Object.values(error.constraints ?? {})),
    ),
});

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3001' },
  namespace: '/live',
})
@UsePipes(replayValidationPipe)
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
    @MessageBody() payload: ReplayMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const state = this.simulation.startReplay(
      client.id,
      payload.gameId,
      payload.pace ?? DEFAULT_PACE,
      (state) => {
        client.emit('game:update', state);
      },
    );

    if (!state) client.emit('game:not-found', payload.gameId);
    this.logger.log(`Client ${client.id} subscribed to game ${payload.gameId}`);
  }

  @SubscribeMessage('game:setPace')
  handleSetPace(
    @MessageBody() payload: ReplayMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.simulation.setReplayPace(
      client.id,
      payload.gameId,
      payload.pace ?? DEFAULT_PACE,
      (state) => {
        client.emit('game:update', state);
      },
    );
  }

  @SubscribeMessage('game:seek')
  handleSeek(
    @MessageBody() payload: ReplayMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (payload.playIndex == null) return;

    this.simulation.seekReplay(
      client.id,
      payload.gameId,
      payload.playIndex,
      (state) => {
        client.emit('game:update', state);
      },
    );
  }

  @SubscribeMessage('game:pause')
  handlePause(
    @MessageBody() payload: ReplayMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.simulation.pauseReplay(client.id, payload.gameId, (state) => {
      client.emit('game:update', state);
    });
  }

  @SubscribeMessage('game:resume')
  handleResume(
    @MessageBody() payload: ReplayMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.simulation.resumeReplay(client.id, payload.gameId, (state) => {
      client.emit('game:update', state);
    });
  }

  @SubscribeMessage('game:unsubscribe')
  handleUnsubscribe(
    @MessageBody() payload: ReplayMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.simulation.stopReplay(client.id, payload.gameId);
    this.logger.log(
      `Client ${client.id} unsubscribed from game ${payload.gameId}`,
    );
  }
}
