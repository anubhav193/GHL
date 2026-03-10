import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client = new PrismaClient();

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
