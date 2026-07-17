import { Module } from '@nestjs/common';
import { CitasController } from './citas.controller';
import { CitasService } from './citas.service';
import { CitasRepository } from '../repositories/citas.repository';
import { AvailabilityRepository } from '../repositories/availability.repository';
import { ChatRepository } from '../repositories/chat.repository';
import { NegocioModule } from '../negocio/negocio.module';

@Module({
  imports: [NegocioModule],
  controllers: [CitasController],
  providers: [
    CitasService,
    CitasRepository,
    AvailabilityRepository,
    // TODO: ChatRepository moves to ChatModule in Phase 3
    ChatRepository,
  ],
})
export class CitasModule {}
