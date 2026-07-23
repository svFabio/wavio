import { Module } from '@nestjs/common';
import { CitasController } from './citas.controller';
import { CitasService } from './citas.service';
import { CitasRepository } from './citas.repository';
import { AvailabilityRepository } from './availability.repository';
import { NegocioModule } from '../negocio/negocio.module';
import { ChatModule } from '../chat/chat.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [NegocioModule, ChatModule, EventsModule],
  controllers: [CitasController],
  providers: [
    CitasService,
    CitasRepository,
    AvailabilityRepository,
  ],
  exports: [CitasService, CitasRepository, AvailabilityRepository],
})
export class CitasModule {}
