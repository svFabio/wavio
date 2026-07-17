import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  UseGuards,
  UsePipes,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ClientesService } from './clientes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createClienteSchema, updateClienteSchema } from './dto/clientes.dto';

@Controller('api/v1/clientes')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get('/')
  async getAll(@TenantId() negocioId: number, @Req() req: Request) {
    const pagination = (req as unknown as Record<string, unknown>).pagination as
      | { page: number; limit: number }
      | undefined;
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    return this.clientesService.getAll(negocioId, page, limit);
  }

  @Get('/:id')
  async getById(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientesService.getById(negocioId, id);
  }

  @Post('/')
  @UsePipes(new ZodValidationPipe(createClienteSchema))
  async create(
    @TenantId() negocioId: number,
    @Body() body: { nombre: string; telefono: string; email?: string; notas?: string },
  ) {
    return this.clientesService.create(negocioId, body);
  }

  @Put('/:id')
  @UsePipes(new ZodValidationPipe(updateClienteSchema))
  async update(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { nombre?: string; email?: string; notas?: string },
  ) {
    return this.clientesService.update(negocioId, id, body);
  }

  @Delete('/:id')
  @HttpCode(204)
  async remove(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.clientesService.remove(negocioId, id);
  }
}
