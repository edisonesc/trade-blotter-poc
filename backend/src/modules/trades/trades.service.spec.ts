import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TradesService } from './trades.service';
import { UpdateTradeDTO } from './dto/update-trade.dto';
import { PrismaService } from '../prisma/prisma.service';
import { TradeStatus, TradeSide } from 'prisma/generated/enums';
import { TRADE_EVENTS } from './events/trade-lifecycle.events';
import { CreateTradeDTO } from './dto/create-trade.dto';

describe('TradesService', () => {
  let service: TradesService;
  let prisma: {
    trade: {
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let eventEmitter: { emit: jest.Mock };

  const USER_ID = 'user-1';
  const OTHER_USER_ID = 'user-2';
  const TRADE_ID = 'trade-1';

  const makeTrade = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: TRADE_ID,
    tradeSeq: 123,
    symbol: 'AAPL',
    quantity: 10,
    price: 100,
    side: TradeSide.BUY,
    status: TradeStatus.ACTIVE,
    tradeTimestamp: new Date(),
    book: 'BOOK-A',
    counterparty: 'CPTY-A',
    traderId: USER_ID,
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      trade: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
      },
    };
    eventEmitter = { emit: jest.fn() };

    service = new TradesService(
      prisma as unknown as PrismaService,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  describe('createTrade', () => {
    const dto: CreateTradeDTO = {
      traderId: 'ignored-client-supplied-id',
      symbol: 'AAPL',
      quantity: 10,
      price: 100,
      side: TradeSide.BUY,
      book: 'BOOK-A',
      counterparty: 'CPTY-A',
    };

    it('forces traderId to the authenticated user, not the DTO value', async () => {
      const created = makeTrade();
      prisma.trade.create.mockResolvedValue(created);

      await service.createTrade(USER_ID, dto);

      expect(prisma.trade.create).toHaveBeenCalledWith({
        data: { ...dto, traderId: USER_ID },
      });
    });

    it('emits TRADE_EVENTS.CREATED with the created trade and returns a success message', async () => {
      const created = makeTrade();
      prisma.trade.create.mockResolvedValue(created);

      const result = await service.createTrade(USER_ID, dto);

      expect(eventEmitter.emit).toHaveBeenCalledWith(TRADE_EVENTS.CREATED, {
        trade: created,
      });
      expect(result).toEqual({ message: 'Successfully created' });
    });
  });

  describe('getTrade', () => {
    it('throws NotFoundException when the trade does not exist', async () => {
      prisma.trade.findUnique.mockResolvedValue(null);

      await expect(service.getTrade(USER_ID, TRADE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the trade belongs to a different user', async () => {
      prisma.trade.findUnique.mockResolvedValue(
        makeTrade({ traderId: OTHER_USER_ID }),
      );

      await expect(service.getTrade(USER_ID, TRADE_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns the trade when it exists and belongs to the caller', async () => {
      const trade = makeTrade();
      prisma.trade.findUnique.mockResolvedValue(trade);

      await expect(service.getTrade(USER_ID, TRADE_ID)).resolves.toEqual(trade);
    });
  });

  describe('updateTrade', () => {
    it('throws BadRequestException when the DTO is empty and never touches the DB', async () => {
      await expect(
        service.updateTrade(USER_ID, TRADE_ID, {} as UpdateTradeDTO),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.trade.findUnique).not.toHaveBeenCalled();
      expect(prisma.trade.update).not.toHaveBeenCalled();
    });

    it('propagates NotFoundException from ownership lookup', async () => {
      prisma.trade.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTrade(USER_ID, TRADE_ID, { book: 'NEW-BOOK' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('propagates ForbiddenException when the trade belongs to another user', async () => {
      prisma.trade.findUnique.mockResolvedValue(
        makeTrade({ traderId: OTHER_USER_ID }),
      );

      await expect(
        service.updateTrade(USER_ID, TRADE_ID, { book: 'NEW-BOOK' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when the trade is already cancelled', async () => {
      prisma.trade.findUnique.mockResolvedValue(
        makeTrade({ status: TradeStatus.CANCELLED }),
      );

      await expect(
        service.updateTrade(USER_ID, TRADE_ID, { book: 'NEW-BOOK' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.trade.update).not.toHaveBeenCalled();
    });

    it('updates the trade, emits TRADE_EVENTS.UPDATED, and returns a success message', async () => {
      const existing = makeTrade();
      const updated = makeTrade({ book: 'NEW-BOOK' });
      prisma.trade.findUnique.mockResolvedValue(existing);
      prisma.trade.update.mockResolvedValue(updated);

      const result = await service.updateTrade(USER_ID, TRADE_ID, {
        book: 'NEW-BOOK',
      });

      expect(prisma.trade.update).toHaveBeenCalledWith({
        where: { id: TRADE_ID },
        data: { book: 'NEW-BOOK' },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(TRADE_EVENTS.UPDATED, {
        trade: updated,
      });
      expect(result).toEqual({ message: 'Successfully updated' });
    });
  });

  describe('cancelTrade', () => {
    it('propagates NotFoundException from ownership lookup', async () => {
      prisma.trade.findUnique.mockResolvedValue(null);

      await expect(service.cancelTrade(USER_ID, TRADE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates ForbiddenException when the trade belongs to another user', async () => {
      prisma.trade.findUnique.mockResolvedValue(
        makeTrade({ traderId: OTHER_USER_ID }),
      );

      await expect(service.cancelTrade(USER_ID, TRADE_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when the trade is already cancelled', async () => {
      prisma.trade.findUnique.mockResolvedValue(
        makeTrade({ status: TradeStatus.CANCELLED }),
      );

      await expect(service.cancelTrade(USER_ID, TRADE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.trade.updateMany).not.toHaveBeenCalled();
    });

    it('cancels the trade, emits TRADE_EVENTS.CANCELLED, and returns a formatted trade id', async () => {
      prisma.trade.findUnique.mockResolvedValue(makeTrade());
      prisma.trade.updateMany.mockResolvedValue({ count: 1 });
      const cancelled = makeTrade({
        status: TradeStatus.CANCELLED,
        tradeSeq: 123,
      });
      prisma.trade.findUniqueOrThrow.mockResolvedValue(cancelled);

      const result = await service.cancelTrade(USER_ID, TRADE_ID);

      expect(prisma.trade.updateMany).toHaveBeenCalledWith({
        where: { id: TRADE_ID, status: { not: TradeStatus.CANCELLED } },
        data: { status: TradeStatus.CANCELLED },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(TRADE_EVENTS.CANCELLED, {
        trade: cancelled,
      });
      expect(result).toEqual({
        message: 'Successfully cancelled trade: TRD-000123',
      });
    });

    it('throws ConflictException on a concurrent cancel race and does not refetch or emit', async () => {
      prisma.trade.findUnique.mockResolvedValue(makeTrade());
      prisma.trade.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.cancelTrade(USER_ID, TRADE_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.trade.findUniqueOrThrow).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('getTrades', () => {
    it('returns all trades unscoped, with a formatted tradeId and a flattened trader username', async () => {
      prisma.trade.findMany.mockResolvedValue([
        { ...makeTrade({ tradeSeq: 7 }), trader: { username: 'alice' } },
        {
          ...makeTrade({
            id: 'trade-2',
            traderId: OTHER_USER_ID,
            tradeSeq: 42,
          }),
          trader: { username: 'bob' },
        },
      ]);

      const result = await service.getTrades();

      expect(prisma.trade.findMany).toHaveBeenCalledWith({
        include: { trader: { select: { username: true } } },
      });
      expect(result).toEqual([
        expect.objectContaining({ tradeId: 'TRD-000007', trader: 'alice' }),
        expect.objectContaining({ tradeId: 'TRD-000042', trader: 'bob' }),
      ]);
    });
  });

  describe('assertCancelled', () => {
    it('throws only when the trade status is CANCELLED', () => {
      expect(() =>
        service.assertCancelled(makeTrade({ status: TradeStatus.CANCELLED })),
      ).toThrow(BadRequestException);
    });

    it('does not throw for an ACTIVE trade', () => {
      expect(() =>
        service.assertCancelled(makeTrade({ status: TradeStatus.ACTIVE })),
      ).not.toThrow();
    });
  });
});
