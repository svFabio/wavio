import { Module } from '@nestjs/common';
import { ServiciosController } from './servicios.controller';
import { HorariosController } from './horarios.controller';
import { ServiciosService } from './servicios.service';
import { HorariosService } from './horarios.service';
import { ServiciosRepository } from './servicios.repository';
import { HorariosNegocioRepository } from './horariosNegocio.repository';
import { HorariosEspecialesRepository } from './horariosEspeciales.repository';
import { HorariosStaffRepository } from './horariosStaff.repository';

@Module({
  controllers: [ServiciosController, HorariosController],
  providers: [
    ServiciosService,
    HorariosService,
    ServiciosRepository,
    HorariosNegocioRepository,
    HorariosEspecialesRepository,
    HorariosStaffRepository,
  ],
  exports: [ServiciosRepository],
})
export class ServiciosModule {}
