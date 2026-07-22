import { Module } from '@nestjs/common';
import { CitasController } from './citas.controller';
import { CitasService } from './citas.service';
import { CitasRepository } from '../repositories/citas.repository';
import { AvailabilityRepository } from '../repositories/availability.repository';
import { ChatRepository } from '../repositories/chat.repository';
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
    // ChatRepository provided via ChatModule export — kept here for CitasService injection
    ChatRepository,
  ],
  exports: [CitasService, CitasRepository, AvailabilityRepository],
})
export class CitasModule {}
