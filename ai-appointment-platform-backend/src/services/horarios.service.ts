import { horariosNegocioRepository } from '../repositories/horariosNegocio.repository';
import { horariosEspecialesRepository } from '../repositories/horariosEspeciales.repository';
import { NotFoundError } from '../domain/errors';
import type { HorarioEspecial, HorarioNegocio } from '../domain/types';

export const horariosService = {
  async listarHorarios(negocioId: number): Promise<HorarioNegocio[]> {
    return horariosNegocioRepository.findByNegocioId(negocioId);
  },

  async replaceHorarios(
    negocioId: number,
    horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>,
  ): Promise<HorarioNegocio[]> {
    await horariosNegocioRepository.deleteByNegocioId(negocioId);
    return Promise.all(
      horarios.map((h) =>
        horariosNegocioRepository.upsert(negocioId, h.diaSemana, h.horaInicio, h.horaFin),
      ),
    );
  },

  async listarEspeciales(negocioId: number): Promise<HorarioEspecial[]> {
    return horariosEspecialesRepository.findByNegocioId(negocioId);
  },

  async crearEspecial(
    negocioId: number,
    data: { fecha: Date; cerrado: boolean; horaInicio?: string | null; horaFin?: string | null },
  ): Promise<HorarioEspecial> {
    const existing = await horariosEspecialesRepository.findByNegocioIdYFecha(
      negocioId,
      data.fecha,
    );
    if (existing) {
      await horariosEspecialesRepository.deleteById(existing.id);
    }
    return horariosEspecialesRepository.create({
      negocioId,
      fecha: data.fecha,
      cerrado: data.cerrado,
      horaInicio: data.horaInicio ?? undefined,
      horaFin: data.horaFin ?? undefined,
    });
  },

  async eliminarEspecial(negocioId: number, id: number): Promise<HorarioEspecial> {
    const existing = await horariosEspecialesRepository.findById(id);
    if (!existing || existing.negocioId !== negocioId) {
      throw new NotFoundError('Horario especial');
    }
    return horariosEspecialesRepository.deleteById(id);
  },
};
