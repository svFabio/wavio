import { Injectable } from '@nestjs/common';
import { HorariosNegocioRepository } from '../repositories/horariosNegocio.repository';
import { HorariosEspecialesRepository } from '../repositories/horariosEspeciales.repository';
import { NotFoundError } from '../domain/errors';
import type { HorarioEspecial, HorarioNegocio } from '../domain/types';

@Injectable()
export class HorariosService {
  constructor(
    private readonly horariosNegocioRepository: HorariosNegocioRepository,
    private readonly horariosEspecialesRepository: HorariosEspecialesRepository,
  ) {}

  async getHorarios(negocioId: number): Promise<HorarioNegocio[]> {
    return this.horariosNegocioRepository.findByNegocioId(negocioId);
  }

  async replaceHorarios(
    negocioId: number,
    horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>,
  ): Promise<HorarioNegocio[]> {
    await this.horariosNegocioRepository.deleteByNegocioId(negocioId);
    return Promise.all(
      horarios.map((h) =>
        this.horariosNegocioRepository.upsert(negocioId, h.diaSemana, h.horaInicio, h.horaFin),
      ),
    );
  }

  async getEspeciales(negocioId: number): Promise<HorarioEspecial[]> {
    return this.horariosEspecialesRepository.findByNegocioId(negocioId);
  }

  async createEspecial(
    negocioId: number,
    data: { fecha: Date; cerrado: boolean; horaInicio?: string | null; horaFin?: string | null },
  ): Promise<HorarioEspecial> {
    const existing = await this.horariosEspecialesRepository.findByNegocioIdYFecha(
      negocioId,
      data.fecha,
    );
    if (existing) {
      await this.horariosEspecialesRepository.deleteById(existing.id);
    }
    return this.horariosEspecialesRepository.create({
      negocioId,
      fecha: data.fecha,
      cerrado: data.cerrado,
      horaInicio: data.horaInicio ?? undefined,
      horaFin: data.horaFin ?? undefined,
    });
  }

  async deleteEspecial(negocioId: number, id: number): Promise<HorarioEspecial> {
    const existing = await this.horariosEspecialesRepository.findById(id);
    if (!existing || existing.negocioId !== negocioId) {
      throw new NotFoundError('Horario especial');
    }
    return this.horariosEspecialesRepository.deleteById(id);
  }
}
