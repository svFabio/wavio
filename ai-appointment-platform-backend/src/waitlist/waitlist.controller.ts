import { Controller, Get, Post, Body, HttpCode, UseGuards, UsePipes } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { addToWaitlistSchema } from './dto/waitlist.dto';

@Controller('api/v1/waitlist')
@UseGuards(JwtAuthGuard, TenantGuard)
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Get('/')
  async getAll(@TenantId() negocioId: number): Promise<unknown[]> {
    return this.waitlistService.getAll(negocioId);
  }

  @Post('/')
  async add(
    @TenantId() negocioId: number,
    @Body(new ZodValidationPipe(addToWaitlistSchema))
    body: {
      clienteNombre: string;
      clienteTelefono: string;
      servicioId?: number;
      fechaPreferida: Date;
      horarioPreferido?: string;
    },
  ): Promise<{ id: number; message: string }> {
    return this.waitlistService.addToWaitlist(negocioId, body);
  }

  @Post('/notify')
  @HttpCode(200)
  async notify(@TenantId() negocioId: number): Promise<{ notified: number }> {
    const notified = await this.waitlistService.notifyAvailableSlot(negocioId, new Date());
    return { notified };
  }
}
