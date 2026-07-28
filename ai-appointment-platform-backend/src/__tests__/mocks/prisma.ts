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

const createModelMethods = () => ({
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

const createModelWithAggregate = () => ({
  ...createModelMethods(),
  aggregate: vi.fn(),
  groupBy: vi.fn(),
});

/* ─── Factory ─────────────────────────────────────────────────────── */

export const createMockPrisma = () => ({
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $transaction: vi.fn(
    <T>(fn: (tx: ReturnType<typeof createMockPrisma>) => Promise<T>): Promise<T> =>
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

export type MockPrisma = ReturnType<typeof createMockPrisma>;
