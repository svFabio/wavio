import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
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

  @Post('/:id/notify')
  @HttpCode(200)
  async notifyEntry(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ notified: boolean }> {
    await this.waitlistService.notifySpecificEntry(negocioId, id);
    return { notified: true };
  }

  @Delete('/:id')
  @HttpCode(200)
  async remove(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    await this.waitlistService.remove(negocioId, id);
    return { success: true };
  }
}
