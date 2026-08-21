import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TradesController } from './trades.controller';
import { TradesService } from './trades.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [UsersModule, PrismaModule],
  controllers: [TradesController],
  providers: [TradesService],
})
export class TradesModule {}
