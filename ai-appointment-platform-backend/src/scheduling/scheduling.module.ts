import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupService } from './cleanup.service';
import { ReminderService } from './reminder.service';
import { SurveyService } from './survey.service';
import { CleanupRepository } from '../repositories/cleanup.repository';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { NegocioRepository } from '../repositories/negocio.repository';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), EventsModule, PrismaModule],
  providers: [
    CleanupService,
    ReminderService,
    SurveyService,
    CleanupRepository,
    AppointmentRepository,
    NegocioRepository,
  ],
  exports: [CleanupService, ReminderService, SurveyService],
})
export class SchedulingModule {}
