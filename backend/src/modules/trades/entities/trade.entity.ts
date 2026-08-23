import { ApiProperty } from '@nestjs/swagger';
import { TradeSide, TradeStatus } from 'prisma/generated/enums';

export class TradeEntity {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'TRD-000123' })
  tradeId: string;

  @ApiProperty()
  tradeSeq: number;

  @ApiProperty()
  symbol: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  price: number;

  @ApiProperty({ enum: TradeSide })
  side: TradeSide;

  @ApiProperty({ enum: TradeStatus })
  status: TradeStatus;

  @ApiProperty()
  tradeTimestamp: Date;

  @ApiProperty()
  book: string;

  @ApiProperty()
  counterparty: string;

  @ApiProperty()
  traderId: string;

  @ApiProperty({ description: 'Username of the trader' })
  trader: string;
}
