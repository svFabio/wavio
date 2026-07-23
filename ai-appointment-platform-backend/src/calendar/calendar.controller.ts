import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { CitasRepository } from '../citas/citas.repository';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { NotFoundError, ValidationError } from '../domain/errors';

@Controller('api/v1/calendar')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CalendarController {
  constructor(
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly citasRepository: CitasRepository,
  ) {}

  @Get('/auth')
  getAuthUrl(@TenantId() negocioId: number): { url: string } {
    const url = this.googleCalendarService.getAuthUrl(negocioId);
    return { url };
  }

  @Get('/callback')
  async handleCallback(
    @TenantId() negocioId: number,
    @Query('code') code: string,
    @Query('state') state: string,
  ): Promise<{ success: boolean; calendarId: string }> {
    if (!code) throw new ValidationError('Missing authorization code');
    if (!state) throw new ValidationError('Missing state parameter');

    const callbackNegocioId = parseInt(state, 10);
    if (isNaN(callbackNegocioId) || callbackNegocioId !== negocioId) {
      throw new ValidationError('State parameter does not match authenticated business');
    }

    const { calendarId } = await this.googleCalendarService.handleCallback(code, negocioId);
    return { success: true, calendarId };
  }

  @Post('/sync/:citaId')
  async syncCita(
    @TenantId() negocioId: number,
    @Param('citaId', ParseIntPipe) citaId: number,
  ): Promise<{ success: boolean; googleEventId: string | null }> {
    const cita = await this.citasRepository.getByIdAndNegocio(citaId, negocioId);
    if (!cita) throw new NotFoundError('Cita');

    const googleEventId = await this.googleCalendarService.createEvent(negocioId, cita);
    return { success: true, googleEventId };
  }

  @Delete('/sync/:citaId')
  async removeCitaFromCalendar(
    @TenantId() negocioId: number,
    @Param('citaId', ParseIntPipe) citaId: number,
  ): Promise<{ success: boolean }> {
    const cita = await this.citasRepository.getByIdAndNegocio(citaId, negocioId);
    if (!cita) throw new NotFoundError('Cita');

    const deleted = await this.googleCalendarService.deleteEvent(negocioId, String(citaId));
    return { success: deleted };
  }

  @Delete('/disconnect')
  async disconnect(@TenantId() negocioId: number): Promise<{ success: boolean }> {
    await this.googleCalendarService.disconnect(negocioId);
    return { success: true };
  }

  @Get('/status')
  async getStatus(@TenantId() negocioId: number): Promise<{ connected: boolean }> {
    const connected = await this.googleCalendarService.isConnected(negocioId);
    return { connected };
  }
}
