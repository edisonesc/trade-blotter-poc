import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsPositive, IsString } from 'class-validator';
import { TradeSide } from 'prisma/generated/enums';

export class CreateTradeDTO {
  traderId: string;

  @ApiProperty()
  @IsString()
  symbol: string;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ enum: TradeSide })
  @IsEnum(TradeSide)
  side: TradeSide;

  @ApiProperty()
  @IsString()
  book: string;

  @ApiProperty()
  @IsString()
  counterparty: string;
}
