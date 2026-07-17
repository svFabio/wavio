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
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { updateHorariosSchema, createEspecialSchema } from './dto/servicios.dto';

@Controller('api/v1/horarios')
@UseGuards(JwtAuthGuard, TenantGuard)
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  @Get('/')
  async getHorarios(@TenantId() negocioId: number) {
    return this.horariosService.getHorarios(negocioId);
  }

  @Put('/')
  @UsePipes(new ZodValidationPipe(updateHorariosSchema))
  async updateHorarios(
    @TenantId() negocioId: number,
    @Body() body: {
      horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>;
    },
  ) {
    return this.horariosService.replaceHorarios(negocioId, body.horarios);
  }

  @Get('/especiales')
  async getEspeciales(@TenantId() negocioId: number) {
    return this.horariosService.getEspeciales(negocioId);
  }

  @Post('/especiales')
  @UsePipes(new ZodValidationPipe(createEspecialSchema))
  async createEspecial(
    @TenantId() negocioId: number,
    @Body() body: { fecha: string; cerrado: boolean; horaInicio?: string | null; horaFin?: string | null },
  ) {
    return this.horariosService.createEspecial(negocioId, {
      fecha: new Date(body.fecha),
      cerrado: body.cerrado,
      horaInicio: body.horaInicio,
      horaFin: body.horaFin,
    });
  }

  @Delete('/especiales/:id')
  @HttpCode(204)
  async deleteEspecial(
    @TenantId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.horariosService.deleteEspecial(negocioId, id);
  }
}
