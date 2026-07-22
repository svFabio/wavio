import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  UseGuards,
  UsePipes,
  ParseIntPipe,
} from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const addToWaitlistSchema = z.object({
  clienteNombre: z.string().min(1),
  clienteTelefono: z.string().min(1),
  servicioId: z.number().int().positive().optional(),
  fechaPreferida: z.string().transform((val) => new Date(val)),
  horarioPreferido: z.string().optional(),
});

@Controller('api/v1/waitlist')
@UseGuards(JwtAuthGuard, TenantGuard)
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Get('/')
  async getAll(@TenantId() negocioId: number) {
    return this.waitlistService.getAll(negocioId);
  }

  @Post('/')
  @UsePipes(new ZodValidationPipe(addToWaitlistSchema))
  async add(
    @TenantId() negocioId: number,
    @Body()
    body: {
      clienteNombre: string;
      clienteTelefono: string;
      servicioId?: number;
      fechaPreferida: Date;
      horarioPreferido?: string;
    },
  ) {
    return this.waitlistService.addToWaitlist(negocioId, body);
  }

  @Post('/:id/notify')
  @HttpCode(200)
  async notify(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) _id: number,
  ) {
    const notified = await this.waitlistService.notifyAvailableSlot(negocioId, new Date());
    return { notified };
  }
}
