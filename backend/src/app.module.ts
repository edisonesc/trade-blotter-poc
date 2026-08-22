import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TradesModule } from './modules/trades/trades.module';
import { TradesGatewayModule } from './modules/trades-gateway/trades-gateway.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    TradesModule,

    EventEmitterModule.forRoot(),
    TradesGatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
