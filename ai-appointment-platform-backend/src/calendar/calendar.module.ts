import { Module } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { CalendarController } from './calendar.controller';
import { CitasModule } from '../citas/citas.module';

@Module({
  imports: [CitasModule],
  controllers: [CalendarController],
  providers: [GoogleCalendarService],
  exports: [GoogleCalendarService],
})
export class CalendarModule {}
