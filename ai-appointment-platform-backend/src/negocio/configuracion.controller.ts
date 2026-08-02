import { Controller, Get, Patch, Post, Body, UseGuards, UsePipes } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  ConfiguracionUpdateSchema,
  QrUploadSchema,
  UpdateConfiguracionDto,
  UploadQrDto,
} from './dto/negocio.dto';

@Controller('api/v1/configuracion')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  @Get('/')
  async getConfiguracion(@TenantId() negocioId: number): Promise<unknown> {
    return this.configuracionService.getConfiguracion(negocioId);
  }

  @Patch('/')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(ConfiguracionUpdateSchema))
  async updateConfiguracion(
    @TenantId() negocioId: number,
    @Body() body: UpdateConfiguracionDto,
  ): Promise<unknown> {
    return this.configuracionService.updateConfiguracion(negocioId, body);
  }

  @Post('/qr')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(QrUploadSchema))
  async uploadQR(
    @TenantId() negocioId: number,
    @Body() body: UploadQrDto,
  ): Promise<{ qrFotoUrl: string }> {
    return this.configuracionService.uploadQR(negocioId, body.imagen);
  }
}
