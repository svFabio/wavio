/**
 * Test utilities for NestJS integration tests.
 *
 * Provides helpers to create NestJS testing modules with mocked
 * PrismaService, suitable for controller + service integration tests
 * without a real database.
 *
 * @example
 * // Controller integration test
 * const { app, prisma } = await createTestingModule([CitasModule], {
 *   providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
 * });
 * const request = app.getHttpServer();
 *
 * // Unit test with module
 * const { module } = await createTestingModule([CitasModule], {
 *   skipAppInit: true,
 * });
 * const service = module.get(CitasService);
 */

import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication, Type, Provider } from '@nestjs/common';
import type { DynamicModule, ForwardReference } from '@nestjs/common/interfaces';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, type MockPrisma } from './mocks/prisma';

type ModuleImport = Type<any> | DynamicModule | ForwardReference<any> | Promise<DynamicModule>;

export { createMockPrisma };
export type { MockPrisma };

/* ─── Types ────────────────────────────────────────────────────────── */

export interface TestingModuleOptions {
  /** Providers to override (e.g., guards like `APP_GUARD`) */
  providers?: Array<Provider>;
  /** Skip app creation (only return TestingModule). Default: false */
  skipAppInit?: boolean;
}

export interface TestingModuleResult {
  module: TestingModule;
  app?: INestApplication;
  prisma: MockPrisma;
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

/**
 * Creates a NestJS testing module for a given set of imported modules.
 *
 * - PrismaService is automatically mocked
 * - All other providers are real (services, repositories, controllers)
 * - Returns the module, app (if not skipped), and mocked prisma
 *
 * @example
 * const { app, prisma } = await createTestingModule([CitasModule]);
 * prisma.cita.findMany.mockResolvedValue([buildCita(1)]);
 * const res = await request(app.getHttpServer()).get('/citas');
 */
export async function createTestingModule(
  imports: Array<ModuleImport>,
  options: TestingModuleOptions = {},
): Promise<TestingModuleResult> {
  const prisma = createMockPrisma();

  const moduleBuilder = Test.createTestingModule({
    imports,
  })
    .overrideProvider(PrismaService)
    .useValue(prisma);

  // Apply any additional provider overrides
  if (options.providers?.length) {
    for (const provider of options.providers) {
      moduleBuilder.overrideProvider(provider).useValue(provider);
    }
  }

  const module = await moduleBuilder.compile();

  if (options.skipAppInit) {
    return { module, prisma };
  }

  const app = module.createNestApplication();
  await app.init();

  return { module, app, prisma };
}

/**
 * Creates a minimal NestJS module for unit-testing a single service.
 *
 * @example
 * const { prisma } = await createServiceTestingModule(CitasService, [
 *   CitasRepository,
 *   AvailabilityRepository,
 * ]);
 * prisma.cita.findMany.mockResolvedValue([buildCita(1)]);
 */
export async function createServiceTestingModule(
  service: Provider,
  providers: Array<Provider> = [],
): Promise<{ module: TestingModule; prisma: MockPrisma }> {
  const prisma = createMockPrisma();

  const module = await Test.createTestingModule({
    providers: [service, ...providers],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();

  return { module, prisma };
}
