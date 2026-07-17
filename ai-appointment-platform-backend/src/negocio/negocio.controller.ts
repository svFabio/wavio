import { Controller, Patch, Body, UseGuards, UsePipes } from '@nestjs/common';
import { NegocioService } from './negocio.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { configurarNegocioSchema } from './dto/negocio.dto';

@Controller('api/v1/negocio')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class NegocioController {
  constructor(private readonly negocioService: NegocioService) {}

  @Patch('/configurar')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(configurarNegocioSchema))
  async configurarNegocio(
    @TenantId() negocioId: number,
    @Body() body: { nombre: string },
  ) {
    const negocio = await this.negocioService.configurarNegocio(negocioId, body.nombre);
    return { success: true, negocio };
  }
}
