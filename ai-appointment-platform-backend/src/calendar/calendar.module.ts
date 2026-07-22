import { Module } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { CalendarController } from './calendar.controller';
import { CalendarRepository } from '../repositories/calendar.repository';
import { CitasModule } from '../citas/citas.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [CitasModule, PrismaModule],
  controllers: [CalendarController],
  providers: [GoogleCalendarService, CalendarRepository],
  exports: [GoogleCalendarService],
})
export class CalendarModule {}
