import { Controller, Get, Post, Delete, Body, HttpCode, UseGuards, UsePipes } from '@nestjs/common';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/utils/jwt';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { subscribePushSchema, type SubscribePushDto } from './push.dto';

@Controller('api/v1/push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('/vapid-public-key')
  getVapidPublicKey(): { publicKey: string | null } {
    return { publicKey: this.pushService.getVapidPublicKey() };
  }

  @Post('/subscribe')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @UsePipes(new ZodValidationPipe(subscribePushSchema))
  async subscribe(
    @TenantId() negocioId: number,
    @CurrentUser() user: JwtPayload,
    @Body() body: SubscribePushDto,
  ) {
    return this.pushService.subscribe(negocioId, user.id, body);
  }

  @Delete('/unsubscribe')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, TenantGuard)
  async unsubscribe(@Body() body: { endpoint: string }) {
    const removed = await this.pushService.unsubscribe(body.endpoint);
    return { success: removed };
  }
}
