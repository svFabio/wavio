import { Module } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ReportesRepository } from './reportes.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ReportesService, ReportesRepository],
  exports: [ReportesService],
})
export class ReportesModule {}
