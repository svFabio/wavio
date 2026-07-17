import { Module } from '@nestjs/common';
import { ServiciosController } from './servicios.controller';
import { HorariosController } from './horarios.controller';
import { ServiciosService } from './servicios.service';
import { HorariosService } from './horarios.service';
import { ServiciosRepository } from '../repositories/servicios.repository';
import { HorariosNegocioRepository } from '../repositories/horariosNegocio.repository';
import { HorariosEspecialesRepository } from '../repositories/horariosEspeciales.repository';

@Module({
  controllers: [ServiciosController, HorariosController],
  providers: [
    ServiciosService,
    HorariosService,
    ServiciosRepository,
    HorariosNegocioRepository,
    HorariosEspecialesRepository,
  ],
})
export class ServiciosModule {}
