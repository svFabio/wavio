import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsersAliasController } from './usersAlias.controller';
import { UsuariosService } from './usuarios.service';
import { UsuariosRepository } from './usuarios.repository';

@Module({
  controllers: [UsuariosController, UsersAliasController],
  providers: [UsuariosService, UsuariosRepository],
})
export class UsuariosModule {}
