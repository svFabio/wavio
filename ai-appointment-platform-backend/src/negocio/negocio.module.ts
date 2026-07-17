import { Module } from '@nestjs/common';
import { NegocioController } from './negocio.controller';
import { ConfiguracionController } from './configuracion.controller';
import { NegocioService } from './negocio.service';
import { ConfiguracionService } from './configuracion.service';
import { NegocioRepository } from '../repositories/negocio.repository';
import { ConfiguracionRepository } from '../repositories/configuracion.repository';

@Module({
  controllers: [NegocioController, ConfiguracionController],
  providers: [
    NegocioService,
    ConfiguracionService,
    NegocioRepository,
    ConfiguracionRepository,
  ],
  exports: [NegocioRepository, ConfiguracionRepository],
})
export class NegocioModule {}
