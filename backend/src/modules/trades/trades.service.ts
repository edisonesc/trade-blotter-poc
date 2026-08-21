import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTradeDTO } from './dto/create-trade.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTradeDTO } from './dto/update-trade.dto';
import { Trade, TradeStatus } from 'prisma/generated/client';
import { isObjectEmpty } from 'src/shared/utils/common.util';

@Injectable()
export class TradesService {
  constructor(private readonly prisma: PrismaService) {}
  async createTrade(userID: string, dto: CreateTradeDTO) {
    await this.prisma.trade.create({
      data: { ...dto, traderId: userID },
    });

    return {
      message: 'Successfully created',
    };
  }

  async updateTrade(userID: string, tradeID: string, dto: UpdateTradeDTO) {
    if (isObjectEmpty(dto)) {
      throw new BadRequestException('Request Failed: Cannot be empty');
    }
    const trade = await this.getTrade(userID, tradeID);

    this.assertCancelled(trade);

    await this.prisma.trade.update({
      where: { id: tradeID },
      data: { ...dto },
    });

    return {
      message: 'Successfully updated',
    };
  }

  async getTrade(userID: string, tradeID: string) {
    const trade: Trade | null = await this.prisma.trade.findUnique({
      where: { id: tradeID },
    });

    if (!trade) throw new NotFoundException('Record not found');

    if (userID !== trade.traderId)
      throw new ForbiddenException(
        'Request Failed: Trade does not belong to current user',
      );

    return trade;
  }

  async cancelTrade(userID: string, tradeID: string) {
    const trade = await this.getTrade(userID, tradeID);

    this.assertCancelled(trade);

    await this.prisma.trade.update({
      where: { id: tradeID },
      data: { status: TradeStatus.CANCELLED },
    });

    return {
      message: `Successfully cancelled trade: ${tradeID}`,
    };
  }

  async getTrades() {
    const trades = await this.prisma.trade.findMany({
      include: { trader: { select: { username: true } } },
    });

    return trades.map((trade) => ({
      ...trade,
      tradeId: this.formatTradeId(trade.tradeSeq),
      trader: trade.trader.username,
    }));
  }

  private formatTradeId(tradeSeq: number): string {
    return `TRD-${tradeSeq.toString().padStart(6, '0')}`;
  }

  assertCancelled(trade: Trade) {
    if (trade.status == TradeStatus.CANCELLED) {
      throw new BadRequestException(
        'Request failed: Trade status is already CANCELLED',
      );
    }
  }
}
