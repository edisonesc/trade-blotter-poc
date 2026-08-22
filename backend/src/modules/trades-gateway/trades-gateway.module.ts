import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { TradesGateway } from './trades.gateway';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';

@Module({
  imports: [UsersModule, AuthModule],
  providers: [TradesGateway, WsJwtAuthGuard],
})
export class TradesGatewayModule {}
