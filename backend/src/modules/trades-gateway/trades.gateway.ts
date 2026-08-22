import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { AuthenticatedSocket } from './trades-gateway.types';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import {
  TRADE_EVENTS,
  TradeEventType,
  type TradeEventPayload,
} from '../trades/events/trade-lifecycle.events';
import { Trade } from 'prisma/generated/client';

@WebSocketGateway({
  namespace: '/trades',
  cors: { origin: process.env.WS_CORS_ORIGIN ?? '*' },
})
export class TradesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(TradesGateway.name);
  constructor(private readonly wsJwtGuard: WsJwtAuthGuard) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const user = await this.wsJwtGuard.authenticate(client);
      client.data.user = user;
      await client.join(`blotter`);
    } catch (err) {
      this.logger.warn(`WS auth failed: ${(err as Error).message}`);

      client.emit('exception', { message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {}

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('subscribeToSymbol')
  async handleSubscribeSymbol(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { symbol: string },
  ) {
    await client.join(`symbol:${data.symbol.toUpperCase()}`);
    return { event: 'subscribed', data: { symbol: data.symbol } };
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('unsubscribeToSymbol')
  async handleUnsubscribeSymbol(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { symbol: string },
  ) {
    await client.leave(`symbol:${data.symbol.toUpperCase()}`);
    return { event: 'unsubscribed', data: { symbol: data.symbol } };
  }

  @OnEvent(TRADE_EVENTS.CREATED)
  handleTradeCreated(payload: TradeEventPayload) {
    this.broadcast(TRADE_EVENTS.CREATED, payload.trade);
  }

  @OnEvent(TRADE_EVENTS.UPDATED)
  handleTradeUpdated(payload: TradeEventPayload) {
    this.broadcast(TRADE_EVENTS.UPDATED, payload.trade);
  }
  @OnEvent(TRADE_EVENTS.CANCELLED)
  handleTradeCancelled(payload: TradeEventPayload) {
    this.broadcast(TRADE_EVENTS.CANCELLED, payload.trade);
  }

  private broadcast(type: TradeEventType, trade: Trade) {
    const payload = { type, trade };
    this.server.to('blotter').emit('tradeUpdate', payload);
    this.server.to(`symbol:${trade.symbol}`).emit('tradeUpdate', payload);
  }
}
