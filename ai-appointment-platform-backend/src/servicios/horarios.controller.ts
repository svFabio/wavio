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
} from '@nestjs/common';
import { HorariosService } from './horarios.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { updateHorariosSchema, createEspecialSchema } from './dto/servicios.dto';
import type { HorarioNegocio, HorarioEspecial } from '../domain/types';

@Controller('api/v1/horarios')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  @Get('/')
  async getHorarios(@TenantId() negocioId: number): Promise<HorarioNegocio[]> {
    return this.horariosService.getHorarios(negocioId);
  }

  @Put('/')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(updateHorariosSchema))
  async updateHorarios(
    @TenantId() negocioId: number,
    @Body()
    body: {
      horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>;
    },
  ): Promise<HorarioNegocio[]> {
    return this.horariosService.replaceHorarios(negocioId, body.horarios);
  }

  @Get('/especiales')
  async getEspeciales(@TenantId() negocioId: number): Promise<HorarioEspecial[]> {
    return this.horariosService.getEspeciales(negocioId);
  }

  @Post('/especiales')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(createEspecialSchema))
  async createEspecial(
    @TenantId() negocioId: number,
    @Body()
    body: { fecha: string; cerrado: boolean; horaInicio?: string | null; horaFin?: string | null },
  ): Promise<HorarioEspecial> {
    return this.horariosService.createEspecial(negocioId, {
      fecha: new Date(body.fecha),
      cerrado: body.cerrado,
      horaInicio: body.horaInicio,
      horaFin: body.horaFin,
    });
  }

  @Delete('/especiales/:id')
  @Roles('ADMIN')
  @HttpCode(204)
  async deleteEspecial(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.horariosService.deleteEspecial(negocioId, id);
  }
}
