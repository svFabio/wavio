import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { NegocioService } from '../negocio/negocio.service';

@Controller('api/v1/whatsapp')
@UseGuards(JwtAuthGuard, TenantGuard)
export class WhatsAppStatusController {
  constructor(private readonly negocioService: NegocioService) {}

  @Get('status')
  async getStatus(@TenantId() negocioId: number) {
    return this.negocioService.getWaStatus(negocioId);
  }
}
