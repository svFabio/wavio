import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
  crearCitaRecurrenteSchema,
  reprogramarCitaSchema,
  actualizarDescripcionSchema,
  agendaQuerySchema,
  horariosQuerySchema,
  serieIdQuerySchema,
} from './dto/citas.dto';
import type {
  CrearCitaAdminDto,
  CrearCitaRecurrenteDto,
  ValidarCitaDto,
  ReprogramarCitaDto,
  ActualizarDescripcionDto,
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
    return this.citasService.getAgenda(
      negocioId,
      query.fecha,
      query.desde,
      query.hasta,
      pagination.page,
      pagination.limit,
    );
  }

  @Get('/pendientes')
  async getPendientes(
    @TenantId() negocioId: number,
    @Pagination() pagination: PaginationParams,
  ): Promise<{
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
    @Body() body: CrearCitaAdminDto,
  ): Promise<Cita> {
    return this.citasService.crearCitaAdmin(negocioId, body);
  }

  @Post('/recurrentes')
  @Roles('ADMIN')
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(crearCitaRecurrenteSchema))
  async crearCitaRecurrente(
    @TenantId() negocioId: number,
    @Body() body: CrearCitaRecurrenteDto,
  ): Promise<{ base: Cita; instancesCreated: number }> {
    return this.citasService.crearCitaRecurrente(negocioId, body);
  }

  @Get('/series')
  @Roles('ADMIN')
  async getSeries(
    @TenantId() negocioId: number,
    @Query(new ZodValidationPipe(serieIdQuerySchema)) query: { serieId: string },
  ): Promise<Cita[]> {
    return this.citasService.getSeriesRecurrente(query.serieId, negocioId);
  }

  @Delete('/series/:serieId')
  @Roles('ADMIN')
  async cancelarSerie(
    @TenantId() negocioId: number,
    @Param('serieId') serieId: string,
  ): Promise<{ canceladas: number }> {
    const canceladas = await this.citasService.cancelarSerieRecurrente(serieId, negocioId);
    return { canceladas };
  }

  @Post('/:id/validar')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(validarCitaSchema))
  async validarCita(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ValidarCitaDto,
  ): Promise<Cita> {
    return this.citasService.validarCita(id, negocioId, body.accion);
  }

  @Put('/:id/reprogramar')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(reprogramarCitaSchema))
  async reprogramarCita(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ReprogramarCitaDto,
  ): Promise<Cita> {
    return this.citasService.reprogramarCita(id, negocioId, body.fecha, body.horario);
  }

  @Put('/:id/no-asistio')
  @Roles('ADMIN')
  async marcarNoAsistio(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Cita> {
    return this.citasService.cambiarEstado(id, negocioId, 'NO_ASISTIO');
  }

  @Put('/:id/asistio')
  @Roles('ADMIN')
  async marcarAsistio(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Cita> {
    return this.citasService.cambiarEstado(id, negocioId, 'CONFIRMADA');
  }

  @Put('/:id/descripcion')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(actualizarDescripcionSchema))
  async actualizarDescripcion(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarDescripcionDto,
  ): Promise<Cita> {
    return this.citasService.actualizarDescripcion(id, negocioId, body.descripcion ?? '');
  }
}
