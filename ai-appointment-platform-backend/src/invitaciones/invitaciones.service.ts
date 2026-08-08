import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { BCRYPT_SALT_ROUNDS, INVITE_EXPIRES_IN_HOURS, BACKEND_URL_FALLBACK } from '../config';
import { InvitacionesRepository } from './invitaciones.repository';
import { ConflictError, ValidationError, NotFoundError, ForbiddenError } from '../domain/errors';

const hashToken = (rawToken: string): string =>
  crypto.createHash('sha256').update(rawToken).digest('hex');

export type InvitacionCreada = {
  id: number;
  email: string;
  rol: string;
  estado: string;
  expiraEn: Date;
  url: string;
};

export type InvitacionAceptada = {
  ok: boolean;
  usuario: { id: number; nombre: string; email: string; rol: string };
};

export type InvitacionListada = {
  id: number;
  email: string;
  rol: string;
  estado: string;
  expiraEn: Date;
  creadoEn: Date;
};

@Injectable()
export class InvitacionesService {
  constructor(private readonly invitacionesRepository: InvitacionesRepository) {}

  private buildAcceptUrl(rawToken: string): string {
    const baseUrl = (env.BACKEND_URL ?? BACKEND_URL_FALLBACK).replace(/\/+$/, '');
    return `${baseUrl}/api/v1/invitaciones/aceptar/${rawToken}`;
  }

  private computeExpiration(): Date {
    return new Date(Date.now() + INVITE_EXPIRES_IN_HOURS * 60 * 60 * 1000);
  }

  async createInvitacion(
    negocioId: number,
    data: { email: string; rol?: 'ADMIN' | 'STAFF' },
    requestingRol: string,
    creadoPor: number,
  ): Promise<InvitacionCreada> {
    const email = data.email.trim().toLowerCase();
    const rol = data.rol ?? 'STAFF';

    if (requestingRol === 'STAFF') {
      throw new ForbiddenError('No tienes permisos para invitar usuarios');
    }
    if (requestingRol === 'ADMIN' && rol === 'ADMIN') {
      throw new ForbiddenError('Solo el propietario puede invitar administradores');
    }

    const activeMembership = await this.invitacionesRepository.findMembershipByEmailAndNegocio(
      email,
      negocioId,
    );
    if (activeMembership) {
      throw new ConflictError('El email ya es miembro de este negocio');
    }

    // Primero se anulan las invitaciones vencidas del mismo email+negocio
    // (RELIABILITY-001): un invite PENDIENTE expirado no debe bloquear un
    // re-invite. El chequeo de "pendiente" posterior solo ve invitaciones
    // aún vigentes (el repositorio filtra expiraEn >= now).
    await this.invitacionesRepository.voidExpiredByEmailAndNegocio(email, negocioId);

    const pending = await this.invitacionesRepository.findPendingByEmailAndNegocio(
      email,
      negocioId,
    );
    if (pending) {
      throw new ConflictError('Ya existe una invitación pendiente para este email');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiraEn = this.computeExpiration();

    const invitacion = await this.invitacionesRepository.create({
      negocioId,
      email,
      rol,
      tokenHash: hashToken(rawToken),
      expiraEn,
      creadoPor,
    });

    return {
      id: invitacion.id,
      email: invitacion.email,
      rol: invitacion.rol,
      estado: invitacion.estado,
      expiraEn: invitacion.expiraEn,
      url: this.buildAcceptUrl(rawToken),
    };
  }

  async aceptarInvitacion(
    token: string,
    nombre: string,
    password: string,
  ): Promise<InvitacionAceptada> {
    const tokenHash = hashToken(token);
    const invitacion = await this.invitacionesRepository.findByTokenHash(tokenHash);
    if (!invitacion) {
      throw new NotFoundError('Invitación');
    }
    if (invitacion.estado !== 'PENDIENTE' || invitacion.expiraEn < new Date()) {
      throw new ValidationError('La invitación no es válida o expiró');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const existingUser = await this.invitacionesRepository.findUsuarioByEmail(invitacion.email);

    if (existingUser) {
      // Guardas RISK-001: la aceptación jamás debe dar acceso a una cuenta que
      // ya tiene credenciales, ni a un usuario que ya es miembro del negocio.
      const membership = await this.invitacionesRepository.findMembership(
        existingUser.id,
        invitacion.negocioId,
      );
      if (membership) {
        throw new ConflictError('El email ya es miembro de este negocio');
      }
      if (existingUser.password !== '') {
        // Cuenta activa con credenciales: nunca sobrescribir su contraseña.
        throw new ConflictError(
          'El email ya tiene una cuenta con acceso; contacta a tu administrador',
        );
      }
      // Solo un usuario sin contraseña ('', p.ej. staff que entró por Google)
      // puede fijarla al aceptar. La membresía se crea con el rol de la
      // invitación (sin promoción, ADR-009).
      await this.invitacionesRepository.acceptExistingUser({
        usuarioId: existingUser.id,
        negocioId: invitacion.negocioId,
        rol: invitacion.rol,
        setPassword: true,
        password: hashedPassword,
        invitacionId: invitacion.id,
        tokenHash,
      });

      return {
        ok: true,
        usuario: {
          id: existingUser.id,
          nombre: existingUser.nombre,
          email: existingUser.email,
          rol: invitacion.rol,
        },
      };
    }

    const { usuarioId } = await this.invitacionesRepository.acceptNewUser({
      nombre: nombre.trim(),
      email: invitacion.email,
      password: hashedPassword,
      rol: invitacion.rol,
      negocioId: invitacion.negocioId,
      invitacionId: invitacion.id,
      tokenHash,
    });

    return {
      ok: true,
      usuario: {
        id: usuarioId,
        nombre: nombre.trim(),
        email: invitacion.email,
        rol: invitacion.rol,
      },
    };
  }

  async listarInvitaciones(negocioId: number, estado?: string): Promise<InvitacionListada[]> {
    const rows = await this.invitacionesRepository.findManyByNegocio(negocioId, estado);
    const now = new Date();
    return rows.map(({ id, email, rol, estado: st, expiraEn, creadoEn }) => ({
      id,
      email,
      rol,
      // Mapeo perezoso: una fila PENDIENTE ya vencida se expone como EXPIRADA
      // sin necesidad de escribir en la base en cada lectura (RELIABILITY-001).
      estado: st === 'PENDIENTE' && expiraEn < now ? 'EXPIRADA' : st,
      expiraEn,
      creadoEn,
    }));
  }

  async reenviarInvitacion(
    id: number,
    negocioId: number,
  ): Promise<{ url: string; expiraEn: Date }> {
    const invitacion = await this.invitacionesRepository.findByIdAndNegocio(id, negocioId);
    if (!invitacion) {
      throw new NotFoundError('Invitación');
    }
    if (invitacion.estado !== 'PENDIENTE') {
      throw new ConflictError('La invitación no está pendiente');
    }
    if (invitacion.expiraEn < new Date()) {
      // Marca la fila EXPIRADA antes de rechazar, para que el estado quede
      // consistente con el listado y el filtro ?estado=EXPIRADA.
      await this.invitacionesRepository.updateEstado(id, 'EXPIRADA');
      throw new ConflictError('La invitación expiró, créala de nuevo');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiraEn = this.computeExpiration();
    const updated = await this.invitacionesRepository.rotateToken(
      id,
      hashToken(rawToken),
      expiraEn,
    );
    if (updated.count === 0) {
      // Carrera: la invitación dejó de ser PENDIENTE/vigente entre la lectura
      // y la rotación (RESILIENCE-001).
      throw new ConflictError('La invitación ya no es válida');
    }

    return { url: this.buildAcceptUrl(rawToken), expiraEn };
  }

  async cancelarInvitacion(id: number, negocioId: number): Promise<{ id: number; estado: string }> {
    const invitacion = await this.invitacionesRepository.findByIdAndNegocio(id, negocioId);
    if (!invitacion) {
      throw new NotFoundError('Invitación');
    }
    if (invitacion.estado === 'ACEPTADA') {
      throw new ConflictError('La invitación ya fue aceptada');
    }
    if (invitacion.estado === 'CANCELADA') {
      return { id: invitacion.id, estado: invitacion.estado };
    }

    // La escritura es atómica (solo si sigue PENDIENTE). Si una carrera la
    // convirtió en ACEPTADA, se rechaza; si quedó CANCELADA, es idempotente.
    const updated = await this.invitacionesRepository.updateEstado(id, 'CANCELADA');
    if (updated.estado === 'ACEPTADA') {
      throw new ConflictError('La invitación ya fue aceptada');
    }
    return updated;
  }
}
