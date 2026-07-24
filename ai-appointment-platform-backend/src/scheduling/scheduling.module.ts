import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupService } from './cleanup.service';
import { ReminderService } from './reminder.service';
import { SurveyService } from './survey.service';
import { CleanupRepository } from './cleanup.repository';
import { AppointmentRepository } from './appointment.repository';
import { EventsModule } from '../events/events.module';
import { NegocioModule } from '../negocio/negocio.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), EventsModule, NegocioModule, PrismaModule],
  providers: [
    CleanupService,
    ReminderService,
    SurveyService,
    CleanupRepository,
    AppointmentRepository,
    // NegocioRepository now available via NegocioModule import
  ],
  exports: [CleanupService, ReminderService, SurveyService],
})
export class SchedulingModule {}
