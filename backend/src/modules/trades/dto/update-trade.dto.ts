import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateTradeDTO {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  @IsOptional()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  book: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  counterparty: string;
}
