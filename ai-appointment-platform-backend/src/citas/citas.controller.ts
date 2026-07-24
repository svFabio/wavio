import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  HttpCode,
  UseGuards,
  UsePipes,
  ParseIntPipe,
} from '@nestjs/common';
import { CitasService } from './citas.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Pagination, PaginationParams } from '../common/decorators/pagination.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  validarCitaSchema,
  crearCitaAdminSchema,
  reprogramarCitaSchema,
  actualizarDescripcionSchema,
  agendaQuerySchema,
  horariosQuerySchema,
} from './dto/citas.dto';
import type { Cita } from '../domain/types';

@Controller('api/v1/citas')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Get('/')
  async getAgenda(
    @TenantId() negocioId: number,
    @Pagination() pagination: PaginationParams,
    @Query(new ZodValidationPipe(agendaQuerySchema))
    query: {
      fecha?: string;
      desde?: string;
      hasta?: string;
    },
  ): Promise<{
    data: Cita[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    return this.citasService.getAgenda(negocioId, query.fecha, query.desde, query.hasta, pagination.page, pagination.limit);
  }

  @Get('/pendientes')
  async getPendientes(@TenantId() negocioId: number, @Pagination() pagination: PaginationParams): Promise<{
    data: Cita[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    return this.citasService.getPendientes(negocioId, pagination.page, pagination.limit);
  }

  @Get('/resumen')
  async getResumen(@TenantId() negocioId: number): Promise<{
    totalHoy: number;
    pendientes: number;
    completadas: number;
    ingresos: number;
  }> {
    return this.citasService.getResumen(negocioId);
  }

  @Get('/horarios-disponibles')
  async getHorariosDisponibles(
    @TenantId() negocioId: number,
    @Query(new ZodValidationPipe(horariosQuerySchema))
    query: {
      fecha: string;
      servicioId?: number;
      staffId?: number;
    },
  ): Promise<{ horarios: string[] }> {
    const horarios = await this.citasService.getHorariosDisponibles(
      negocioId,
      query.fecha,
      query.servicioId,
      query.staffId,
    );
    return { horarios };
  }

  @Post('/admin')
  @Roles('ADMIN')
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(crearCitaAdminSchema))
  async crearCitaAdmin(
    @TenantId() negocioId: number,
    @Body()
    body: {
      clienteNombre: string;
      clienteTelefono: string;
      fecha: string;
      horario: string;
      monto?: number;
      servicioId?: number;
      staffId?: number;
      duracionMinutos?: number;
    },
  ): Promise<Cita> {
    return this.citasService.crearCitaAdmin(negocioId, body);
  }

  @Post('/:id/validar')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(validarCitaSchema))
  async validarCita(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { accion: string },
  ): Promise<Cita> {
    return this.citasService.validarCita(id, negocioId, body.accion);
  }

  @Put('/:id/reprogramar')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(reprogramarCitaSchema))
  async reprogramarCita(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { fecha: string; horario: string },
  ): Promise<Cita> {
    return this.citasService.reprogramarCita(id, negocioId, body.fecha, body.horario);
  }

  @Put('/:id/no-asistio')
  @Roles('ADMIN')
  async marcarNoAsistio(@TenantId() negocioId: number, @Param('id', ParseIntPipe) id: number): Promise<Cita> {
    return this.citasService.cambiarEstado(id, negocioId, 'NO_ASISTIO');
  }

  @Put('/:id/asistio')
  @Roles('ADMIN')
  async marcarAsistio(@TenantId() negocioId: number, @Param('id', ParseIntPipe) id: number): Promise<Cita> {
    return this.citasService.cambiarEstado(id, negocioId, 'CONFIRMADA');
  }

  @Put('/:id/descripcion')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(actualizarDescripcionSchema))
  async actualizarDescripcion(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { descripcion?: string },
  ): Promise<Cita> {
    return this.citasService.actualizarDescripcion(id, negocioId, body.descripcion ?? '');
  }
}
