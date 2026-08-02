import { Controller, Patch, Body, UseGuards, UsePipes } from '@nestjs/common';
import { NegocioService } from './negocio.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  NegocioConfiguracionSchema,
  CredencialesUpdateSchema,
  ConfigurarNegocioDto,
  UpdateCredencialesDto,
} from './dto/negocio.dto';
import type { Negocio } from '../domain/types';

type SafeNegocio = Omit<Negocio, 'waAccessToken' | 'geminiApiKey'>;

@Controller('api/v1/negocio')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class NegocioController {
  constructor(private readonly negocioService: NegocioService) {}

  @Patch('/configurar')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(NegocioConfiguracionSchema))
  async configurarNegocio(
    @TenantId() negocioId: number,
    @Body() body: ConfigurarNegocioDto,
  ): Promise<{ success: boolean; negocio: SafeNegocio }> {
    const negocio = await this.negocioService.configurarNegocio(negocioId, body.nombre);
    return { success: true, negocio };
  }

  @Patch('/credenciales')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(CredencialesUpdateSchema))
  async actualizarCredenciales(
    @TenantId() negocioId: number,
    @Body() body: UpdateCredencialesDto,
  ): Promise<{ success: boolean; negocio: SafeNegocio }> {
    const negocio = await this.negocioService.actualizarCredenciales(negocioId, body);
    return { success: true, negocio };
  }
}
