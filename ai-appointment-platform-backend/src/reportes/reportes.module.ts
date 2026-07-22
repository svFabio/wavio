import { Module } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { CitasModule } from '../citas/citas.module';

@Module({
  imports: [CitasModule],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
