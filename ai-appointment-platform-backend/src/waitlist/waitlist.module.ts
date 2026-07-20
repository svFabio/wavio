import { Module } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { WaitlistRepository } from '../repositories/waitlist.repository';
import { EventsModule } from '../events/events.module';
import { NegocioModule } from '../negocio/negocio.module';

@Module({
  imports: [EventsModule, NegocioModule],
  providers: [WaitlistService, WaitlistRepository],
  exports: [WaitlistService],
})
export class WaitlistModule {}
