import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NangoService } from './nango.service';

@Module({
  imports: [ConfigModule],
  providers: [NangoService],
  exports: [NangoService],
})
export class NangoModule {}
