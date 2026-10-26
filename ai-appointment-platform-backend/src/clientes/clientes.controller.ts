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
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { ClientesService } from './clientes.service';
import { PaginationInterceptor } from '../common/interceptors/pagination.interceptor';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createClienteSchema,
  updateClienteSchema,
  type CreateClienteDto,
  type UpdateClienteDto,
} from './dto/clientes.dto';
import type { Cliente } from '../domain/types';

@Controller('api/v1/clientes')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get('/')
  @UseInterceptors(PaginationInterceptor)
  async getAll(
    @TenantId() negocioId: number,
    @Req() req: Request,
  ): Promise<{ data: Cliente[]; total: number; page: number; limit: number; totalPages: number }> {
    const pagination = (req as { pagination?: { page: number; limit: number } }).pagination;
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    return this.clientesService.getAll(negocioId, page, limit);
  }

  @Get('/:id')
  async getById(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Cliente> {
    return this.clientesService.getById(negocioId, id);
  }

  @Post('/')
  @UsePipes(new ZodValidationPipe(createClienteSchema))
  async create(@TenantId() negocioId: number, @Body() body: CreateClienteDto): Promise<Cliente> {
    return this.clientesService.create(negocioId, body);
  }

  @Put('/:id')
  @UsePipes(new ZodValidationPipe(updateClienteSchema))
  async update(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateClienteDto,
  ): Promise<Cliente> {
    return this.clientesService.update(negocioId, id, body);
  }

  @Delete('/:id')
  @HttpCode(204)
  async remove(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.clientesService.remove(negocioId, id);
  }

  @Get('/:id/no-shows')
  async getNoShows(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ noShows: number }> {
    return this.clientesService.getNoShows(id, negocioId);
  }
}
