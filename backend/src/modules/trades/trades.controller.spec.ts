import 'reflect-metadata';
import { TradesController } from './trades.controller';
import { TradesService } from './trades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IUser } from 'src/shared/interface/user.interface';
import { CreateTradeDTO } from './dto/create-trade.dto';
import { UpdateTradeDTO } from './dto/update-trade.dto';
import { TradeSide } from 'prisma/generated/enums';

describe('TradesController', () => {
  let controller: TradesController;
  let tradesService: {
    getTrades: jest.Mock;
    createTrade: jest.Mock;
    cancelTrade: jest.Mock;
    updateTrade: jest.Mock;
  };

  const CURRENT_USER: IUser = {
    id: 'user-1',
    email: 'trader@example.com',
    username: 'trader1',
    createdAt: new Date(),
  };

  const GUARDED_METHODS = [
    'getTrades',
    'createTrade',
    'cancelTrade',
    'amendTrade',
  ] as const;

  beforeEach(() => {
    tradesService = {
      getTrades: jest.fn(),
      createTrade: jest.fn(),
      cancelTrade: jest.fn(),
      updateTrade: jest.fn(),
    };
    controller = new TradesController(
      tradesService as unknown as TradesService,
    );
  });

  it('guards every route with JwtAuthGuard', () => {
    for (const method of GUARDED_METHODS) {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const target: unknown = TradesController.prototype[method];
      const guards: unknown = Reflect.getMetadata('__guards__', target);
      expect(guards).toContain(JwtAuthGuard);
    }
  });

  describe('getTrades', () => {
    it('delegates to tradesService.getTrades and returns its result', async () => {
      const expected = [{ id: 'trade-1' }];
      tradesService.getTrades.mockResolvedValue(expected);

      const result = await controller.getTrades();

      expect(tradesService.getTrades).toHaveBeenCalledWith();
      expect(result).toBe(expected);
    });
  });

  describe('createTrade', () => {
    it('delegates to tradesService.createTrade with the current user id and dto', async () => {
      const dto: CreateTradeDTO = {
        traderId: 'ignored',
        symbol: 'AAPL',
        quantity: 10,
        price: 100,
        side: TradeSide.BUY,
        book: 'BOOK-A',
        counterparty: 'CPTY-A',
      };
      const expected = { message: 'Successfully created' };
      tradesService.createTrade.mockResolvedValue(expected);

      const result = await controller.createTrade(dto, CURRENT_USER);

      expect(tradesService.createTrade).toHaveBeenCalledWith(
        CURRENT_USER.id,
        dto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('cancelTrade', () => {
    it('delegates to tradesService.cancelTrade with the current user id and trade id', async () => {
      const expected = { message: 'Successfully cancelled trade: TRD-000001' };
      tradesService.cancelTrade.mockResolvedValue(expected);

      const result = await controller.cancelTrade('trade-1', CURRENT_USER);

      expect(tradesService.cancelTrade).toHaveBeenCalledWith(
        CURRENT_USER.id,
        'trade-1',
      );
      expect(result).toBe(expected);
    });
  });

  describe('amendTrade', () => {
    it('delegates to tradesService.updateTrade with the current user id, trade id, and dto', async () => {
      const dto: UpdateTradeDTO = { book: 'NEW-BOOK' } as UpdateTradeDTO;
      const expected = { message: 'Successfully updated' };
      tradesService.updateTrade.mockResolvedValue(expected);

      const result = await controller.amendTrade('trade-1', dto, CURRENT_USER);

      expect(tradesService.updateTrade).toHaveBeenCalledWith(
        CURRENT_USER.id,
        'trade-1',
        dto,
      );
      expect(result).toBe(expected);
    });
  });
});
