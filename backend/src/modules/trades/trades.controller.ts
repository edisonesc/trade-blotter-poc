import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { TradesService } from './trades.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { IUser } from 'src/shared/interface/user.interface';
import { UpdateTradeDTO } from './dto/update-trade.dto';
import { CreateTradeDTO } from './dto/create-trade.dto';
import { TradeEntity } from './entities/trade.entity';

@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: TradeEntity, isArray: true })
  @Get()
  getTrades() {
    return this.tradesService.getTrades();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  createTrade(@Body() dto: CreateTradeDTO, @CurrentUser() user: IUser) {
    return this.tradesService.createTrade(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('/:id/cancel')
  cancelTrade(@Param('id') tradeID: string, @CurrentUser() user: IUser) {
    return this.tradesService.cancelTrade(user.id, tradeID);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('/:id')
  amendTrade(
    @Param('id') tradeID: string,
    @Body() dto: UpdateTradeDTO,
    @CurrentUser() user: IUser,
  ) {
    return this.tradesService.updateTrade(user.id, tradeID, dto);
  }
}
