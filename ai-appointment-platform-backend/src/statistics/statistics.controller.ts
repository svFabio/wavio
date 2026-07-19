import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const monthsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(12).optional().default(6),
});

@Controller('api/v1/statistics')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('/')
  @Get('/overview')
  @Roles('ADMIN')
  async getOverview(@TenantId() negocioId: number) {
    return this.statisticsService.getOverview(negocioId);
  }

  @Get('/ingresos')
  @Get('/revenue')
  @Roles('ADMIN')
  async getRevenue(
    @TenantId() negocioId: number,
    @Query(new ZodValidationPipe(monthsQuerySchema)) query: { months: number },
  ) {
    return this.statisticsService.getRevenue(negocioId, query.months);
  }
}
