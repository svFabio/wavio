import { configuracionRepository } from '../repositories/configuracion.repository';
import { ValidationError } from '../domain/errors';
import { Configuracion } from '../domain/types';

type ServicioItem = { nombre: string; precio: number };
type HorariosMap = Record<string, string[]>;

export const configuracionService = {
  async getConfiguracion(negocioId: number): Promise<Configuracion> {
    return configuracionRepository.getOrCreateByNegocioId(negocioId);
  },

  async updateConfiguracion(
    negocioId: number,
    data: Record<string, unknown>,
  ): Promise<Configuracion> {
    const {
      trigger,
      mensajeBienvenida,
      mensajeConfirmacion,
      servicios,
      horarios,
      cobrarAdelanto,
      porcentajeAdelanto,
    } = data;

    if (trigger !== undefined && (typeof trigger !== 'string' || trigger.trim().length === 0)) {
      throw new ValidationError('El trigger no puede estar vacio');
    }
    if (servicios !== undefined) {
      if (
        !Array.isArray(servicios) ||
        !servicios.every(
          (s: unknown) =>
            s !== null &&
            typeof s === 'object' &&
            'nombre' in s &&
            typeof (s as Record<string, unknown>).nombre === 'string' &&
            'precio' in s &&
            typeof (s as Record<string, unknown>).precio === 'number',
        )
      ) {
        throw new ValidationError('servicios debe ser un array de { nombre, precio }');
      }
    }
    if (
      porcentajeAdelanto !== undefined &&
      (typeof porcentajeAdelanto !== 'number' || porcentajeAdelanto < 1 || porcentajeAdelanto > 100)
    ) {
      throw new ValidationError('porcentajeAdelanto debe ser un numero entre 1 y 100');
    }
    if (horarios !== undefined) {
      if (typeof horarios !== 'object' || horarios === null || Array.isArray(horarios)) {
        throw new ValidationError('horarios debe ser un mapa JSON válido');
      }
    }

    const updateData: Partial<{
      trigger: string;
      mensajeBienvenida: string;
      mensajeConfirmacion: string;
      servicios: ServicioItem[];
      horarios: HorariosMap;
      cobrarAdelanto: boolean;
      porcentajeAdelanto: number;
    }> = {};
    if (trigger !== undefined) updateData.trigger = (trigger as string).trim();
    if (mensajeBienvenida !== undefined) updateData.mensajeBienvenida = mensajeBienvenida as string;
    if (mensajeConfirmacion !== undefined)
      updateData.mensajeConfirmacion = mensajeConfirmacion as string;
    if (servicios !== undefined) updateData.servicios = servicios as ServicioItem[];
    if (horarios !== undefined) updateData.horarios = horarios as HorariosMap;
    if (cobrarAdelanto !== undefined) updateData.cobrarAdelanto = Boolean(cobrarAdelanto);
    if (porcentajeAdelanto !== undefined)
      updateData.porcentajeAdelanto = Number(porcentajeAdelanto);

    return configuracionRepository.upsert(negocioId, updateData);
  },
};
