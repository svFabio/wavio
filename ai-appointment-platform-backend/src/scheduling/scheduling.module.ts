import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupService } from './cleanup.service';
import { ReminderService } from './reminder.service';
import { SurveyService } from './survey.service';
import { CleanupRepository } from '../repositories/cleanup.repository';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [ScheduleModule.forRoot(), EventsModule],
  providers: [CleanupService, ReminderService, SurveyService, CleanupRepository, AppointmentRepository],
  exports: [CleanupService, ReminderService, SurveyService],
})
export class SchedulingModule {}
