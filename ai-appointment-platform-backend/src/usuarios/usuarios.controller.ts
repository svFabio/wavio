import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UsePipes,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createUserSchema, updateUserSchema } from './dto/usuarios.dto';

@Controller('api/v1/usuarios')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('ADMIN')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('/')
  async getAll(@TenantId() negocioId: number, @Req() req: Request) {
    const pagination = (req as unknown as Record<string, unknown>).pagination as
      { page: number; limit: number } | undefined;
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    return this.usuariosService.getAllUsers(negocioId, page, limit);
  }

  @Post('/')
  @UsePipes(new ZodValidationPipe(createUserSchema))
  async create(
    @TenantId() negocioId: number,
    @Body() body: { nombre: string; email: string; password: string; rol?: string },
  ) {
    return this.usuariosService.createUser(negocioId, body);
  }

  @Put('/:id')
  @UsePipes(new ZodValidationPipe(updateUserSchema))
  async update(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { nombre?: string; email?: string; rol?: string },
  ) {
    return this.usuariosService.updateUser(negocioId, id, body);
  }

  @Delete('/:id')
  async delete(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usuariosService.deleteUser(negocioId, id, user.id);
  }
}
