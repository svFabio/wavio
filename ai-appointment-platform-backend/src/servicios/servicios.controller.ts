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
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createServicioSchema, updateServicioSchema } from './dto/servicios.dto';

@Controller('api/v1/servicios')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Get('/')
  async getAll(@TenantId() negocioId: number) {
    return this.serviciosService.getAll(negocioId);
  }

  @Post('/')
  @UsePipes(new ZodValidationPipe(createServicioSchema))
  async create(
    @TenantId() negocioId: number,
    @Body() body: { nombre: string; duracionMinutos?: number; bufferMinutos?: number; precio?: number },
  ) {
    return this.serviciosService.create(negocioId, body);
  }

  @Patch('/:id')
  @UsePipes(new ZodValidationPipe(updateServicioSchema))
  async update(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      nombre?: string;
      duracionMinutos?: number;
      bufferMinutos?: number;
      precio?: number;
      activo?: boolean;
    },
  ) {
    return this.serviciosService.update(negocioId, id, body);
  }

  @Delete('/:id')
  @HttpCode(204)
  async remove(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.serviciosService.remove(negocioId, id);
  }
}
