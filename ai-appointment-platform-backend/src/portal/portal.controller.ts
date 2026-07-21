import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { Cita } from '../domain/types';
import { z } from 'zod';

const bookAppointmentSchema = z.object({
  fecha: z.string().min(1, 'Fecha es requerida'),
  horario: z.string().min(1, 'Horario es requerido'),
  servicioId: z.number().optional(),
});

@Controller('api/v1/portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Post('/generate/:clienteId')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @HttpCode(201)
  async generateMagicLink(
    @TenantId() negocioId: number,
    @Param('clienteId') clienteId: number,
  ): Promise<{ url: string; token: string }> {
    return this.portalService.generateMagicLink(negocioId, clienteId);
  }

  @Get('/:token')
  async validateMagicLink(@Param('token') token: string): Promise<{
    cliente: { id: number; nombre: string; telefono: string; email: string | null };
    negocio: { id: number; nombre: string };
  }> {
    return this.portalService.validateMagicLink(token);
  }

  @Get('/:token/appointments')
  async getClientAppointments(@Param('token') token: string): Promise<Cita[]> {
    return this.portalService.getClientAppointments(token);
  }

  @Get('/:token/services')
  async getServicios(
    @Param('token') token: string,
  ): Promise<Array<{ id: number; nombre: string; duracionMinutos: number; precio: number }>> {
    return this.portalService.getServiciosForPortal(token);
  }

  @Get('/:token/available-slots')
  async getAvailableSlots(
    @Param('token') token: string,
    @Query() query: { fecha: string; servicioId?: number },
  ): Promise<string[]> {
    return this.portalService.getHorariosDisponibles(token, query.fecha, query.servicioId);
  }

  @Post('/:token/book')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(bookAppointmentSchema))
  async bookAppointment(
    @Param('token') token: string,
    @Body() body: { fecha: string; horario: string; servicioId?: number },
  ): Promise<{ success: boolean; message: string }> {
    return this.portalService.bookAppointmentFromPortal(token, body);
  }
}
