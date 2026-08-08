import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { MonthsQuerySchema, type MonthsQuery } from './statistics.dto';

type OverviewResult = Awaited<ReturnType<StatisticsService['getOverview']>>;
type RevenueResult = Awaited<ReturnType<StatisticsService['getRevenue']>>;

@Controller('api/v1/statistics')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('/overview')
  @Roles('ADMIN')
  async getOverview(@TenantId() negocioId: number): Promise<OverviewResult> {
    return this.statisticsService.getOverview(negocioId);
  }

  @Get('/revenue')
  @Roles('ADMIN')
  async getRevenue(
    @TenantId() negocioId: number,
    @Query(new ZodValidationPipe(MonthsQuerySchema)) query: MonthsQuery,
  ): Promise<RevenueResult> {
    return this.statisticsService.getRevenue(negocioId, query.months);
  }
}
