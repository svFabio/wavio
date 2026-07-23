import { Module } from '@nestjs/common';
import { NoShowService } from './noshow.service';
import { NoShowRepository } from './noshow.repository';
import { NegocioModule } from '../negocio/negocio.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [NegocioModule, EventsModule],
  providers: [NoShowService, NoShowRepository],
  exports: [NoShowService],
})
export class NoShowModule {}
