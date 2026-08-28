import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  UseGuards,
  UsePipes,
  ParseIntPipe,
} from '@nestjs/common';
import { ServiciosService } from './servicios.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createServicioSchema, updateServicioSchema } from './dto/servicios.dto';
import type { Servicio } from '../domain/types';

@Controller('api/v1/servicios')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Get('/')
  async getAll(@TenantId() negocioId: number): Promise<Servicio[]> {
    return this.serviciosService.getAll(negocioId);
  }

  @Post('/')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(createServicioSchema))
  async create(
    @TenantId() negocioId: number,
    @Body()
    body: { nombre: string; duracionMinutos?: number; bufferMinutos?: number; precio?: number },
  ): Promise<Servicio> {
    return this.serviciosService.create(negocioId, body);
  }

  @Patch('/:id')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(updateServicioSchema))
  async update(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      nombre?: string;
      duracionMinutos?: number;
      bufferMinutos?: number;
      precio?: number;
      activo?: boolean;
    },
  ): Promise<Servicio> {
    return this.serviciosService.update(negocioId, id, body);
  }

  @Delete('/:id')
  @Roles('ADMIN')
  @HttpCode(204)
  async remove(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.serviciosService.remove(negocioId, id);
  }
}
