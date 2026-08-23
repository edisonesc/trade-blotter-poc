import { Server } from 'socket.io';
import { TradesGateway } from './trades.gateway';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { TRADE_EVENTS } from '../trades/events/trade-lifecycle.events';
import { TradeSide, TradeStatus } from 'prisma/generated/enums';
import { AuthenticatedSocket } from './trades-gateway.types';

type MockClient = {
  data: { user?: unknown };
  join: jest.Mock;
  leave: jest.Mock;
  emit: jest.Mock;
  disconnect: jest.Mock;
};

describe('TradesGateway', () => {
  let gateway: TradesGateway;
  let wsJwtGuard: { authenticate: jest.Mock };
  let server: { to: jest.Mock; emit: jest.Mock };

  const USER = {
    id: 'user-1',
    email: 'trader@example.com',
    username: 'trader1',
    createdAt: new Date(),
  };

  const TRADE = {
    id: 'trade-1',
    tradeSeq: 1,
    symbol: 'AAPL',
    quantity: 10,
    price: 100,
    side: TradeSide.BUY,
    status: TradeStatus.ACTIVE,
    tradeTimestamp: new Date(),
    book: 'BOOK-A',
    counterparty: 'CPTY-A',
    traderId: USER.id,
  };

  const makeClient = (): MockClient => ({
    data: {},
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  });

  const asSocket = (client: MockClient) =>
    client as unknown as AuthenticatedSocket;

  beforeEach(() => {
    wsJwtGuard = { authenticate: jest.fn() };
    gateway = new TradesGateway(wsJwtGuard as unknown as WsJwtAuthGuard);
    server = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
    gateway.server = server as unknown as Server;
  });

  describe('handleConnection', () => {
    it('authenticates the client, caches the user, and joins the blotter room', async () => {
      const client = makeClient();
      wsJwtGuard.authenticate.mockResolvedValue(USER);

      await gateway.handleConnection(asSocket(client));

      expect(client.data.user).toEqual(USER);
      expect(client.join).toHaveBeenCalledWith('blotter');
    });

    it('emits an exception and disconnects when authentication fails, without joining any room', async () => {
      const client = makeClient();
      wsJwtGuard.authenticate.mockRejectedValue(new Error('Missing token'));

      await gateway.handleConnection(asSocket(client));

      expect(client.emit).toHaveBeenCalledWith('exception', {
        message: 'Unauthorized',
      });
      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.join).not.toHaveBeenCalled();
    });
  });

  describe('handleSubscribeSymbol / handleUnsubscribeSymbol', () => {
    it('joins the uppercased symbol room regardless of input case', async () => {
      const client = makeClient();

      const ack = await gateway.handleSubscribeSymbol(asSocket(client), {
        symbol: 'aapl',
      });

      expect(client.join).toHaveBeenCalledWith('symbol:AAPL');
      expect(ack).toEqual({ event: 'subscribed', data: { symbol: 'aapl' } });
    });

    it('leaves the uppercased symbol room regardless of input case', async () => {
      const client = makeClient();

      const ack = await gateway.handleUnsubscribeSymbol(asSocket(client), {
        symbol: 'aapl',
      });

      expect(client.leave).toHaveBeenCalledWith('symbol:AAPL');
      expect(ack).toEqual({ event: 'unsubscribed', data: { symbol: 'aapl' } });
    });
  });

  describe('trade lifecycle event broadcasting', () => {
    it('broadcasts a created trade to both the blotter room and the symbol room', () => {
      gateway.handleTradeCreated({ trade: TRADE });

      expect(server.to).toHaveBeenCalledWith('blotter');
      expect(server.to).toHaveBeenCalledWith(`symbol:${TRADE.symbol}`);
      expect(server.emit).toHaveBeenCalledWith('tradeUpdate', {
        type: TRADE_EVENTS.CREATED,
        trade: TRADE,
      });
    });

    it('broadcasts an updated trade', () => {
      gateway.handleTradeUpdated({ trade: TRADE });

      expect(server.emit).toHaveBeenCalledWith('tradeUpdate', {
        type: TRADE_EVENTS.UPDATED,
        trade: TRADE,
      });
    });

    it('broadcasts a cancelled trade', () => {
      gateway.handleTradeCancelled({ trade: TRADE });

      expect(server.emit).toHaveBeenCalledWith('tradeUpdate', {
        type: TRADE_EVENTS.CANCELLED,
        trade: TRADE,
      });
    });
  });

  describe('handleDisconnect', () => {
    it('does not throw (currently a no-op)', () => {
      const client = makeClient();
      expect(() => gateway.handleDisconnect(asSocket(client))).not.toThrow();
    });
  });
});
