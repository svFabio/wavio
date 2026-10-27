import { Module, forwardRef } from '@nestjs/common';
import { CitasController } from './citas.controller';
import { CitasService } from './citas.service';
import { CitasRepository } from './citas.repository';
import { AvailabilityRepository } from './availability.repository';
import { AvailabilityService } from './availability.service';
import { NegocioModule } from '../negocio/negocio.module';
import { ChatModule } from '../chat/chat.module';
import { EventsModule } from '../events/events.module';
import { CalendarModule } from '../calendar/calendar.module';
import { PushModule } from '../push/push.module';
import { WaitlistModule } from '../waitlist/waitlist.module';

@Module({
  imports: [
    NegocioModule,
    ChatModule,
    EventsModule,
    forwardRef(() => CalendarModule),
    PushModule,
    forwardRef(() => WaitlistModule),
  ],
  controllers: [CitasController],
  providers: [CitasService, CitasRepository, AvailabilityRepository, AvailabilityService],
  exports: [CitasService, AvailabilityRepository, AvailabilityService],
})
export class CitasModule {}
