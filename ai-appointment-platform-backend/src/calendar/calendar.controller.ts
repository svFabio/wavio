import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { CitasService } from '../citas/citas.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { calendarCallbackSchema, CalendarCallbackDto } from './dto/calendar.dto';
import { NotFoundError, ValidationError } from '../domain/errors';

@Controller('api/v1/calendar')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CalendarController {
  constructor(
    private readonly googleCalendarService: GoogleCalendarService,
    @Inject(forwardRef(() => CitasService))
    private readonly citasService: CitasService,
  ) {}

  @Get('/auth')
  getAuthUrl(@TenantId() negocioId: number): { url: string } {
    const url = this.googleCalendarService.getAuthUrl(negocioId);
    return { url };
  }

  @Get('/callback')
  async handleCallback(
    @TenantId() negocioId: number,
    @Query(new ZodValidationPipe(calendarCallbackSchema)) query: CalendarCallbackDto,
  ): Promise<{ success: boolean; calendarId: string }> {
    const callbackNegocioId = parseInt(query.state, 10);
    if (isNaN(callbackNegocioId) || callbackNegocioId !== negocioId) {
      throw new ValidationError('State parameter does not match authenticated business');
    }

    const { calendarId } = await this.googleCalendarService.handleCallback(query.code, negocioId);
    return { success: true, calendarId };
  }

  @Post('/sync/:citaId')
  async syncCita(
    @TenantId() negocioId: number,
    @Param('citaId', ParseIntPipe) citaId: number,
  ): Promise<{ success: boolean; googleEventId: string | null }> {
    const cita = await this.citasService.getByIdAndNegocio(citaId, negocioId);
    if (!cita) throw new NotFoundError('Cita');

    const googleEventId = await this.googleCalendarService.createEvent(negocioId, cita);
    if (googleEventId) {
      await this.citasService.setGoogleEventId(citaId, negocioId, googleEventId);
    }
    return { success: true, googleEventId };
  }

  @Delete('/sync/:citaId')
  async removeCitaFromCalendar(
    @TenantId() negocioId: number,
    @Param('citaId', ParseIntPipe) citaId: number,
  ): Promise<{ success: boolean }> {
    const cita = await this.citasService.getByIdAndNegocio(citaId, negocioId);
    if (!cita) throw new NotFoundError('Cita');

    if (!cita.googleEventId) {
      return { success: true };
    }

    const deleted = await this.googleCalendarService.deleteEvent(negocioId, cita.googleEventId);
    if (deleted) {
      await this.citasService.setGoogleEventId(citaId, negocioId, null);
    }
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
