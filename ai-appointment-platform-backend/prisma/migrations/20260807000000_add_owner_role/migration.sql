-- AlterEnum: add OWNER as the highest role (requires PostgreSQL >= 12 to
-- allow using the new enum value in the same transaction)
ALTER TYPE "Rol" ADD VALUE IF NOT EXISTS 'OWNER' BEFORE 'ADMIN';

-- Backfill: promote the oldest ADMIN of each negocio to OWNER.
-- Single statement, two data-modifying CTEs (one UPDATE per table):
-- 1. UsuarioNegocio: the oldest admin (ROW_NUMBER by creadoEn ASC, usuarioId ASC
--    partitioned by negocioId) becomes OWNER.
-- 2. Usuario: the same promoted users get rol = 'OWNER'.
-- Both CTEs share the same snapshot, so the ranking is consistent.
WITH ranked AS (
  SELECT
    un."negocioId",
    un."usuarioId",
    ROW_NUMBER() OVER (
      PARTITION BY un."negocioId"
      ORDER BY u."creadoEn" ASC, un."usuarioId" ASC
    ) AS rn
  FROM "UsuarioNegocio" un
  JOIN "Usuario" u ON u."id" = un."usuarioId"
  WHERE un."rol" = 'ADMIN'
),
promoted AS (
  UPDATE "UsuarioNegocio" AS un
  SET "rol" = 'OWNER'
  FROM ranked r
  WHERE un."negocioId" = r."negocioId"
    AND un."usuarioId" = r."usuarioId"
    AND r.rn = 1
  RETURNING un."usuarioId"
)
UPDATE "Usuario" AS u
SET "rol" = 'OWNER'
WHERE u."id" IN (SELECT "usuarioId" FROM promoted);
