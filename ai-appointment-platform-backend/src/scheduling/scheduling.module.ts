import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupService } from './cleanup.service';
import { ReminderService } from './reminder.service';
import { SurveyService } from './survey.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [CleanupService, ReminderService, SurveyService],
})
export class SchedulingModule {}
