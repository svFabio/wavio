import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NoShowService } from './noshow.service';
import { NoShowRepository } from '../repositories/noshow.repository';
import { NegocioModule } from '../negocio/negocio.module';

@Module({
  imports: [ScheduleModule.forRoot(), NegocioModule],
  providers: [NoShowService, NoShowRepository],
  exports: [NoShowService],
})
export class NoShowModule {}

