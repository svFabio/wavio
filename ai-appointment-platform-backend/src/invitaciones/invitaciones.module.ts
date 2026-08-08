import { Module } from '@nestjs/common';
import { InvitacionesController } from './invitaciones.controller';
import { InvitacionesService } from './invitaciones.service';
import { InvitacionesRepository } from './invitaciones.repository';

@Module({
  controllers: [InvitacionesController],
  providers: [InvitacionesService, InvitacionesRepository],
})
export class InvitacionesModule {}
