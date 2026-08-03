import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaKeepaliveService } from './prisma-keepalive.service';

@Global()
@Module({
  providers: [PrismaService, PrismaKeepaliveService],
  exports: [PrismaService],
})
export class PrismaModule {}
