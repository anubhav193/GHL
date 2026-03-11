import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { PrismaService } from '../prisma.service';
import { NangoModule } from '../nango/nango.module';

@Module({
  imports: [ConfigModule, NangoModule],
  controllers: [ChatsController],
  providers: [ChatsService, PrismaService],
})
export class ChatsModule {}
