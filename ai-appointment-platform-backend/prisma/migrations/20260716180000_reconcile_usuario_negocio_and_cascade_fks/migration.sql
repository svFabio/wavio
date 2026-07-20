-- Migration: reconcile_usuario_negocio_and_cascade_fks
-- E5: Creates UsuarioNegocio junction table (exists in schema but had no migration)
-- E6: Fixes ON DELETE RESTRICT → CASCADE for 5 FKs added in saas_multitenancy migration

-- ─── E5: UsuarioNegocio ──────────────────────────────────────────────────────

-- Create UsuarioNegocio if it doesn't already exist
-- (guard with IF NOT EXISTS for idempotency in case of partial apply)
CREATE TABLE IF NOT EXISTS "UsuarioNegocio" (
    "usuarioId"  INTEGER  NOT NULL,
    "negocioId"  INTEGER  NOT NULL,
    "rol"        "Rol"    NOT NULL DEFAULT 'STAFF',
    "creadoEn"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioNegocio_pkey" PRIMARY KEY ("usuarioId", "negocioId"),
    CONSTRAINT "UsuarioNegocio_usuarioId_fkey"
        FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsuarioNegocio_negocioId_fkey"
        FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "UsuarioNegocio_negocioId_idx" ON "UsuarioNegocio"("negocioId");

-- ─── E6: Fix RESTRICT → CASCADE on the 5 FKs from saas_multitenancy ─────────

-- Usuario.negocioId FK
ALTER TABLE "Usuario"
    DROP CONSTRAINT IF EXISTS "Usuario_negocioId_fkey";
ALTER TABLE "Usuario"
    ADD CONSTRAINT "Usuario_negocioId_fkey"
        FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Cita.negocioId FK
ALTER TABLE "Cita"
    DROP CONSTRAINT IF EXISTS "Cita_negocioId_fkey";
ALTER TABLE "Cita"
    ADD CONSTRAINT "Cita_negocioId_fkey"
        FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SesionChat.negocioId FK
ALTER TABLE "SesionChat"
    DROP CONSTRAINT IF EXISTS "SesionChat_negocioId_fkey";
ALTER TABLE "SesionChat"
    ADD CONSTRAINT "SesionChat_negocioId_fkey"
        FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MensajeChat.negocioId FK
ALTER TABLE "MensajeChat"
    DROP CONSTRAINT IF EXISTS "MensajeChat_negocioId_fkey";
ALTER TABLE "MensajeChat"
    ADD CONSTRAINT "MensajeChat_negocioId_fkey"
        FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Configuracion.negocioId FK
ALTER TABLE "Configuracion"
    DROP CONSTRAINT IF EXISTS "Configuracion_negocioId_fkey";
ALTER TABLE "Configuracion"
    ADD CONSTRAINT "Configuracion_negocioId_fkey"
        FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
