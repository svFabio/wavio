import { prisma } from './prisma';

export const healthRepository = {
  async checkDbConnection(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { ok: true, latencyMs: Date.now() - start };
    } catch {
      return { ok: false, latencyMs: Date.now() - start };
    }
  },
};
