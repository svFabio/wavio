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
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Pagination, PaginationParams } from '../common/decorators/pagination.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { enviarMensajeSchema, EnviarMensajeDto } from './dto/chat.dto';

@Controller('api/v1/chat')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('/conversaciones')
  async getConversaciones(
    @TenantId() negocioId: number,
    @Pagination() pagination: PaginationParams,
  ) {
    return this.chatService.getConversaciones(negocioId, pagination.page, pagination.limit);
  }

  @Get('/mensajes/:jid')
  async getMensajes(
    @TenantId() negocioId: number,
    @Param('jid') jid: string,
    @Pagination() pagination: PaginationParams,
  ) {
    return this.chatService.getMensajes(negocioId, jid, pagination.page, pagination.limit);
  }

  @Post('/enviar/:jid')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(enviarMensajeSchema))
  async sendMensaje(
    @TenantId() negocioId: number,
    @Param('jid') jid: string,
    @Body() body: EnviarMensajeDto,
  ) {
    return this.chatService.sendMensaje(negocioId, jid, body.texto);
  }

  @Delete('/conversacion/:jid')
  @HttpCode(204)
  async deleteConversacion(@TenantId() negocioId: number, @Param('jid') jid: string) {
    await this.chatService.deleteConversacion(negocioId, jid);
  }
}
