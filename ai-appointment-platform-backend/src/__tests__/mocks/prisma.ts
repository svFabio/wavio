/**
 * Mock PrismaService factory.
 *
 * Creates a fully mocked PrismaService with `vi.fn()` stubs for every
 * model method used across the codebase. Each model exposes the standard
 * CRUD methods plus any model-specific methods (aggregate, upsert, etc.).
 *
 * @example
 * const prisma = createMockPrisma();
 * prisma.cita.findMany.mockResolvedValue([buildCita(1)]);
 *
 * const repo = new CitasRepository(prisma as unknown as PrismaService);
 * const result = await repo.getAgenda(1, start, end, 1, 10);
 * expect(result.data).toHaveLength(1);
 */

import { vi } from 'vitest';

/* ─── Model method sets ───────────────────────────────────────────── */

const createModelMethods = (): MockModelMethods => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
  upsert: vi.fn(),
  createMany: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
});

const createModelWithAggregate = (): MockModelWithAggregate => ({
  ...createModelMethods(),
  aggregate: vi.fn(),
  groupBy: vi.fn(),
});

/* ─── Types ────────────────────────────────────────────────────────── */

export interface MockModelMethods {
  findUnique: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
  updateMany: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
}

interface MockModelWithAggregate extends MockModelMethods {
  aggregate: ReturnType<typeof vi.fn>;
  groupBy: ReturnType<typeof vi.fn>;
}

export interface MockPrisma {
  $connect: ReturnType<typeof vi.fn>;
  $disconnect: ReturnType<typeof vi.fn>;
  $transaction: ReturnType<typeof vi.fn>;
  $queryRaw: ReturnType<typeof vi.fn>;
  $executeRaw: ReturnType<typeof vi.fn>;
  negocio: MockModelMethods;
  usuario: MockModelMethods;
  usuarioNegocio: MockModelMethods;
  servicio: MockModelMethods;
  horarioNegocio: MockModelMethods;
  horarioStaff: MockModelMethods;
  horarioEspecial: MockModelMethods;
  cliente: MockModelMethods;
  cita: MockModelWithAggregate;
  sesionChat: MockModelMethods;
  mensajeChat: MockModelMethods;
  configuracion: MockModelMethods;
  listaEspera: MockModelMethods;
  pushSubscription: MockModelMethods;
}

/* ─── Factory ─────────────────────────────────────────────────────── */

export const createMockPrisma = (): MockPrisma => ({
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $transaction: vi.fn(<T>(fn: (tx: MockPrisma) => Promise<T>): Promise<T> =>
    fn(createMockPrisma()),
  ),
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn(),

  // Models
  negocio: createModelMethods(),
  usuario: createModelMethods(),
  usuarioNegocio: createModelMethods(),
  servicio: createModelMethods(),
  horarioNegocio: createModelMethods(),
  horarioStaff: createModelMethods(),
  horarioEspecial: createModelMethods(),
  cliente: createModelMethods(),
  cita: createModelWithAggregate(),
  sesionChat: createModelMethods(),
  mensajeChat: createModelMethods(),
  configuracion: createModelMethods(),
  listaEspera: createModelMethods(),
  pushSubscription: createModelMethods(),
});
