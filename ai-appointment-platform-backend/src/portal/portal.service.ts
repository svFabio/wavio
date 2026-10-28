import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { PortalRepository } from './portal.repository';
import { CitasService } from '../citas/citas.service';
import { NotFoundError, ValidationError, ConflictError } from '../domain/errors';
import type { Cita } from '../domain/types';

const MAGIC_LINK_EXPIRY_DAYS = 7;

@Injectable()
export class PortalService {
  constructor(
    private readonly portalRepository: PortalRepository,
    private readonly citasService: CitasService,
  ) {}

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

    const timezone = 'America/La_Paz';
    const hoyEnNegocio = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const horaActual = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());

    if (data.fecha < hoyEnNegocio || (data.fecha === hoyEnNegocio && data.horario < horaActual)) {
      throw new ValidationError('No se puede agendar una cita en el pasado');
    }

    const cita = await this.citasService.crearCitaAdmin(validation.negocio.id, {
      clienteNombre: validation.cliente.nombre,
      clienteTelefono: validation.cliente.telefono,
      fecha: data.fecha,
      horario: data.horario,
      servicioId: data.servicioId,
      estado: 'PENDIENTE',
      origen: 'portal',
    });

    if (!cita) {
      throw new ConflictError('Ese horario ya fue reservado por otro cliente');
    }

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
    return this.citasService.getHorariosDisponibles(validation.negocio.id, fecha, servicioId);
  }
}
