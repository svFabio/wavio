import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ParseIntPipe,
} from '@nestjs/common';
import { InvitacionesService } from './invitaciones.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { TenantUser } from '../common/guards/tenant.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  InvitacionSchema,
  AceptarInvitacionSchema,
  ListarInvitacionesSchema,
} from './dto/invitaciones.dto';

type CreateInvitacionResult = Awaited<ReturnType<InvitacionesService['createInvitacion']>>;
type AceptarInvitacionResult = Awaited<ReturnType<InvitacionesService['aceptarInvitacion']>>;
type ListarInvitacionesResult = Awaited<ReturnType<InvitacionesService['listarInvitaciones']>>;
type ReenviarInvitacionResult = Awaited<ReturnType<InvitacionesService['reenviarInvitacion']>>;
type CancelarInvitacionResult = Awaited<ReturnType<InvitacionesService['cancelarInvitacion']>>;

@Controller('api/v1/invitaciones')
export class InvitacionesController {
  constructor(private readonly invitacionesService: InvitacionesService) {}

  @Post('/')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(InvitacionSchema))
  async create(
    @TenantId() negocioId: number,
    @Body() body: { email: string; rol?: 'ADMIN' | 'STAFF' },
    @CurrentUser() user: TenantUser,
  ): Promise<CreateInvitacionResult> {
    return this.invitacionesService.createInvitacion(negocioId, body, user.rol, user.id);
  }

  @Post('aceptar')
  @UsePipes(new ZodValidationPipe(AceptarInvitacionSchema))
  async aceptar(
    @Body() body: { token: string; nombre: string; password: string },
  ): Promise<AceptarInvitacionResult> {
    return this.invitacionesService.aceptarInvitacion(body.token, body.nombre, body.password);
  }

  @Get('/')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('ADMIN')
  async listar(
    @TenantId() negocioId: number,
    @Query(new ZodValidationPipe(ListarInvitacionesSchema)) query: { estado?: string },
  ): Promise<ListarInvitacionesResult> {
    return this.invitacionesService.listarInvitaciones(negocioId, query.estado);
  }

  @Post(':id/reenviar')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('ADMIN')
  async reenviar(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ReenviarInvitacionResult> {
    return this.invitacionesService.reenviarInvitacion(id, negocioId);
  }

  @Post(':id/cancelar')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('ADMIN')
  async cancelar(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CancelarInvitacionResult> {
    return this.invitacionesService.cancelarInvitacion(id, negocioId);
  }
}
