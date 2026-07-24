import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { PortalRepository } from './portal.repository';
import { NotFoundError, ValidationError } from '../domain/errors';
import type { Cita } from '../domain/types';

const MAGIC_LINK_EXPIRY_DAYS = 7;

@Injectable()
export class PortalService {
  constructor(private readonly portalRepository: PortalRepository) {}

  async generateMagicLink(
    negocioId: number,
    clienteId: number,
  ): Promise<{ url: string; token: string }> {
    const cliente = await this.portalRepository.findClienteByIdAndNegocio(clienteId, negocioId);
    if (!cliente) throw new NotFoundError('Cliente');

    const token = crypto.randomUUID();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + MAGIC_LINK_EXPIRY_DAYS);

    await this.portalRepository.updateMagicToken(clienteId, token, expiry);

    return {
      url: `/portal/${token}`,
      token,
    };
  }

  async validateMagicLink(token: string): Promise<{
    cliente: {
      id: number;
      nombre: string;
      telefono: string;
      email: string | null;
    };
    negocio: {
      id: number;
      nombre: string;
    };
  }> {
    const cliente = await this.portalRepository.findClienteByMagicToken(token);

    if (!cliente) {
      throw new ValidationError('Enlace inválido o expirado');
    }

    if (!cliente.magicLinkExpiry || cliente.magicLinkExpiry < new Date()) {
      throw new ValidationError('Enlace expirado');
    }

    return {
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        email: cliente.email,
      },
      negocio: cliente.negocio,
    };
  }

  async getClientAppointments(token: string): Promise<Cita[]> {
    const validation = await this.validateMagicLink(token);

    return this.portalRepository.findCitasByCliente(
      validation.negocio.id,
      validation.cliente.telefono,
      validation.cliente.nombre,
    );
  }

  async bookAppointmentFromPortal(
    token: string,
    data: {
      fecha: string;
      horario: string;
      servicioId?: number;
    },
  ): Promise<{ success: boolean; message: string }> {
    const validation = await this.validateMagicLink(token);

    const [year, month, day] = data.fecha.split('-').map(Number);
    const fechaCita = new Date(year, month - 1, day);
    const [horas, minutos] = data.horario.split(':').map(Number);
    fechaCita.setHours(horas, minutos, 0, 0);

    const now = new Date();
    if (fechaCita < now) {
      throw new ValidationError('No se puede agendar una cita en el pasado');
    }

    const occupied = await this.portalRepository.checkSlotOccupied(
      validation.negocio.id,
      fechaCita,
      data.horario,
    );
    if (occupied) {
      throw new ValidationError('Ese horario ya está ocupado');
    }

    const servicio = data.servicioId
      ? await this.portalRepository.findServicioById(data.servicioId, validation.negocio.id)
      : null;

    await this.portalRepository.createCita({
      negocioId: validation.negocio.id,
      clienteNombre: validation.cliente.nombre,
      clienteTelefono: validation.cliente.telefono,
      fecha: fechaCita,
      horario: data.horario,
      servicio: servicio?.nombre ?? 'General',
      servicioId: servicio?.id ?? null,
      duracionMinutos: servicio?.duracionMinutos ?? 60,
      monto: servicio?.precio ?? 0,
      estado: 'PENDIENTE',
      estadoPago: 'PENDIENTE',
      origen: 'portal',
    });

    return {
      success: true,
      message: 'Cita agendada exitosamente. Espera confirmación del negocio.',
    };
  }

  async getServiciosForPortal(
    token: string,
  ): Promise<Array<{ id: number; nombre: string; duracionMinutos: number; precio: number }>> {
    const validation = await this.validateMagicLink(token);
    return this.portalRepository.findServiciosActivos(validation.negocio.id);
  }

  async getHorariosDisponibles(
    token: string,
    fecha: string,
    servicioId?: number,
  ): Promise<string[]> {
    const validation = await this.validateMagicLink(token);

    const [year, month, day] = fecha.split('-').map(Number);
    const fechaDate = new Date(year, month - 1, day);
    const diaSemana = fechaDate.getDay();

    const horarios = await this.portalRepository.findHorariosByDia(
      validation.negocio.id,
      diaSemana,
    );

    const servicio = servicioId
      ? await this.portalRepository.findServicioById(servicioId, validation.negocio.id)
      : null;
    const duracion = servicio?.duracionMinutos ?? 60;

    const slots: string[] = [];
    for (const h of horarios) {
      const [hInicio, mInicio] = h.horaInicio.split(':').map(Number);
      const [hFin, mFin] = h.horaFin.split(':').map(Number);

      let currentMinutes = hInicio * 60 + mInicio;
      const endMinutes = hFin * 60 + mFin;

      while (currentMinutes + duracion <= endMinutes) {
        const hh = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
        const mm = String(currentMinutes % 60).padStart(2, '0');
        slots.push(`${hh}:${mm}`);
        currentMinutes += duracion;
      }
    }

    const fechaInicio = new Date(year, month - 1, day);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(year, month - 1, day);
    fechaFin.setHours(23, 59, 59, 999);

    const ocupadas = await this.portalRepository.findCitasOcupadas(
      validation.negocio.id,
      fechaInicio,
      fechaFin,
    );

    const ocupadasSet = new Set(ocupadas.map((c) => c.horario));
    return slots.filter((s) => !ocupadasSet.has(s));
  }
}
