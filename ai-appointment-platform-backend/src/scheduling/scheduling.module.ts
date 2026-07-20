import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupService } from './cleanup.service';
import { ReminderService } from './reminder.service';
import { SurveyService } from './survey.service';
import { CleanupRepository } from '../repositories/cleanup.repository';
import { CitasModule } from '../citas/citas.module';
import { NegocioModule } from '../negocio/negocio.module';

@Module({
  imports: [ScheduleModule.forRoot(), CitasModule, NegocioModule],
  providers: [CleanupService, ReminderService, SurveyService, CleanupRepository],
  exports: [CleanupService, ReminderService, SurveyService],
})
export class SchedulingModule {}
