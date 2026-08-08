import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictError, NotFoundError } from '../domain/errors';

export type InvitacionRow = {
  id: number;
  negocioId: number;
  email: string;
  rol: string;
  tokenHash: string;
  expiraEn: Date;
  estado: string;
  creadoEn: Date;
  creadoPor: number;
  aceptadaEn: Date | null;
};

const INVITACION_SELECT = {
  id: true,
  negocioId: true,
  email: true,
  rol: true,
  tokenHash: true,
  expiraEn: true,
  estado: true,
  creadoEn: true,
  creadoPor: true,
  aceptadaEn: true,
} as const;

@Injectable()
export class InvitacionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    negocioId: number;
    email: string;
    rol: 'ADMIN' | 'STAFF';
    tokenHash: string;
    expiraEn: Date;
    creadoPor: number;
  }): Promise<InvitacionRow> {
    return this.prisma.invitacion.create({ data, select: INVITACION_SELECT });
  }

  async findByTokenHash(tokenHash: string): Promise<InvitacionRow | null> {
    return this.prisma.invitacion.findUnique({
      where: { tokenHash },
      select: INVITACION_SELECT,
    });
  }

  async findPendingByEmailAndNegocio(
    email: string,
    negocioId: number,
  ): Promise<InvitacionRow | null> {
    return this.prisma.invitacion.findFirst({
      // "Pendiente" significa PENDIENTE y aún no expirada: una invitación
      // vencida no debe bloquear un re-invite (RELIABILITY-001).
      where: { email, negocioId, estado: 'PENDIENTE', expiraEn: { gte: new Date() } },
      select: INVITACION_SELECT,
    });
  }

  /**
   * Anula las invitaciones PENDIENTE vencidas del mismo email+negocio
   * marcándolas EXPIRADA (estado que el DTO y el listado exponen). Se invoca
   * antes de crear una nueva invitación para que un invite vencido no bloquee
   * el re-invite.
   */
  async voidExpiredByEmailAndNegocio(email: string, negocioId: number): Promise<void> {
    const now = new Date();
    await this.prisma.invitacion.updateMany({
      where: { email, negocioId, estado: 'PENDIENTE', expiraEn: { lt: now } },
      data: { estado: 'EXPIRADA' },
    });
  }

  /** Devuelve el usuario si ya tiene membresía activa en el negocio. */
  async findMembershipByEmailAndNegocio(
    email: string,
    negocioId: number,
  ): Promise<{ id: number } | null> {
    return this.prisma.usuario.findFirst({
      where: { email, usuarioNegocios: { some: { negocioId } } },
      select: { id: true },
    });
  }

  async findByIdAndNegocio(id: number, negocioId: number): Promise<InvitacionRow | null> {
    return this.prisma.invitacion.findFirst({
      where: { id, negocioId },
      select: INVITACION_SELECT,
    });
  }

  async findManyByNegocio(negocioId: number, estado?: string): Promise<InvitacionRow[]> {
    return this.prisma.invitacion.findMany({
      where: { negocioId, ...(estado ? { estado } : {}) },
      select: INVITACION_SELECT,
      orderBy: { creadoEn: 'desc' },
    });
  }

  /**
   * Transición de estado atómica: solo actualiza si la fila sigue PENDIENTE
   * (RESILIENCE-001). Si otra operación ganó la carrera, devuelve el estado
   * actual de la fila para que el servicio decida (ACEPTADA → conflict,
   * CANCELADA → idempotente).
   */
  async updateEstado(id: number, estado: string): Promise<{ id: number; estado: string }> {
    const result = await this.prisma.invitacion.updateMany({
      where: { id, estado: 'PENDIENTE' },
      data: { estado },
    });
    if (result.count === 1) {
      return { id, estado };
    }
    const current = await this.prisma.invitacion.findUnique({
      where: { id },
      select: { id: true, estado: true },
    });
    if (!current) {
      throw new NotFoundError('Invitación');
    }
    return current;
  }

  /** Rota el token solo si la invitación sigue PENDIENTE y no vencida (RESILIENCE-001). */
  async rotateToken(id: number, tokenHash: string, expiraEn: Date): Promise<{ count: number }> {
    return this.prisma.invitacion.updateMany({
      where: { id, estado: 'PENDIENTE', expiraEn: { gt: new Date() } },
      data: { tokenHash, expiraEn },
    });
  }

  async findUsuarioByEmail(email: string): Promise<{
    id: number;
    nombre: string;
    email: string;
    password: string;
    rol: string;
  } | null> {
    return this.prisma.usuario.findUnique({
      where: { email },
      select: { id: true, nombre: true, email: true, password: true, rol: true },
    });
  }

  async findMembership(
    usuarioId: number,
    negocioId: number,
  ): Promise<{ usuarioId: number; negocioId: number; rol: string } | null> {
    return this.prisma.usuarioNegocio.findUnique({
      where: { usuarioId_negocioId: { usuarioId, negocioId } },
    });
  }

  /**
   * Acepta una invitación para un usuario nuevo: crea Usuario + membresía y
   * marca la invitación ACEPTADA, todo en una sola transacción.
   *
   * La marca ACEPTADA es una escritura condicional (id + tokenHash + PENDIENTE
   * + no vencida): si otra operación (cancelación, rotación, doble aceptación)
   * ganó la carrera, count === 0 → ConflictError y la transacción revierte,
   * sin crear usuario ni membresía (RESILIENCE-001).
   */
  async acceptNewUser(data: {
    nombre: string;
    email: string;
    password: string;
    rol: string;
    negocioId: number;
    invitacionId: number;
    tokenHash: string;
  }): Promise<{ usuarioId: number }> {
    return this.prisma.$transaction(async (tx) => {
      const marked = await tx.invitacion.updateMany({
        where: {
          id: data.invitacionId,
          tokenHash: data.tokenHash,
          estado: 'PENDIENTE',
          expiraEn: { gt: new Date() },
        },
        data: { estado: 'ACEPTADA', aceptadaEn: new Date() },
      });
      if (marked.count !== 1) {
        throw new ConflictError('La invitación ya no es válida');
      }
      const usuario = await tx.usuario.create({
        data: {
          nombre: data.nombre,
          email: data.email,
          password: data.password,
          rol: data.rol as 'ADMIN' | 'STAFF',
        },
      });
      await tx.usuarioNegocio.create({
        data: {
          usuarioId: usuario.id,
          negocioId: data.negocioId,
          rol: data.rol as 'ADMIN' | 'STAFF',
        },
      });
      return { usuarioId: usuario.id };
    });
  }

  /**
   * Acepta una invitación para un usuario ya existente.
   *
   * Guardas de seguridad (RISK-001):
   * - El password SOLO se escribe si el servicio lo autoriza explícitamente
   *   (`setPassword: true`, solo válido cuando el usuario tiene password '').
   *   Nunca se sobrescriben credenciales de una cuenta activa.
   * - La membresía se crea con el rol de la invitación; si ya existiera se
   *   conserva tal cual (update: {}, nunca se promueve — ADR-009).
   * - La marca ACEPTADA es una escritura condicional como en acceptNewUser.
   */
  async acceptExistingUser(data: {
    usuarioId: number;
    negocioId: number;
    rol: string;
    invitacionId: number;
    tokenHash: string;
    setPassword: boolean;
    password: string;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const marked = await tx.invitacion.updateMany({
        where: {
          id: data.invitacionId,
          tokenHash: data.tokenHash,
          estado: 'PENDIENTE',
          expiraEn: { gt: new Date() },
        },
        data: { estado: 'ACEPTADA', aceptadaEn: new Date() },
      });
      if (marked.count !== 1) {
        throw new ConflictError('La invitación ya no es válida');
      }
      if (data.setPassword) {
        await tx.usuario.update({
          where: { id: data.usuarioId },
          data: { password: data.password },
        });
      }
      await tx.usuarioNegocio.upsert({
        where: {
          usuarioId_negocioId: { usuarioId: data.usuarioId, negocioId: data.negocioId },
        },
        update: {},
        create: {
          usuarioId: data.usuarioId,
          negocioId: data.negocioId,
          rol: data.rol as 'ADMIN' | 'STAFF',
        },
      });
    });
  }
}
