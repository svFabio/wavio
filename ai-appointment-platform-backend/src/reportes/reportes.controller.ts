import { Controller, Get, Query, UseGuards, Res, Header } from '@nestjs/common';
import type { Response } from 'express';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { csvQuerySchema, resumenQuerySchema } from './reportes.dto';
import type { CsvQuery, ResumenQuery } from './reportes.dto';

@Controller('api/v1/reportes')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('/csv')
  @Roles('ADMIN')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(
    @TenantId() negocioId: number,
    @Query(new ZodValidationPipe(csvQuerySchema)) query: CsvQuery,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.reportesService.exportCitasCSV(negocioId, query.desde, query.hasta);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="citas-${query.desde}-${query.hasta}.csv"`,
    );
    res.send(csv);
  }

  @Get('/resumen')
  @Roles('ADMIN')
  async getResumen(
    @TenantId() negocioId: number,
    @Query(new ZodValidationPipe(resumenQuerySchema)) query: ResumenQuery,
  ): Promise<{
    totalCitas: number;
    confirmadas: number;
    canceladas: number;
    noShows: number;
    ingresos: number;
    servicios: Array<{ servicio: string; count: number; ingresos: number }>;
  }> {
    return this.reportesService.getResumenMensual(negocioId, query.year, query.month);
  }
}
