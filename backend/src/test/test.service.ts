import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TestService {
  constructor(private readonly prisma: PrismaService) {}

  async getDummyItem() {
    const existing = await this.prisma.client.dummyItem.findFirst();
    if (existing) {
      return existing;
    }

    const created = await this.prisma.client.dummyItem.create({
      data: {
        name: 'hello from database',
      },
    });

    return created;
  }
}
