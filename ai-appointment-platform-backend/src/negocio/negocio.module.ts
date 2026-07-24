import { Module } from '@nestjs/common';
import { NegocioController } from './negocio.controller';
import { ConfiguracionController } from './configuracion.controller';
import { NegocioService } from './negocio.service';
import { ConfiguracionService } from './configuracion.service';
import { NegocioRepository } from './negocio.repository';
import { ConfiguracionRepository } from './configuracion.repository';

@Module({
  controllers: [NegocioController, ConfiguracionController],
  providers: [NegocioService, ConfiguracionService, NegocioRepository, ConfiguracionRepository],
  exports: [NegocioService],
})
export class NegocioModule {}
