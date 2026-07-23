import { Module } from '@nestjs/common';
import { NoShowService } from './noshow.service';
import { NoShowRepository } from './noshow.repository';
import { NegocioModule } from '../negocio/negocio.module';

@Module({
  imports: [NegocioModule],
  providers: [NoShowService, NoShowRepository],
  exports: [NoShowService],
})
export class NoShowModule {}
