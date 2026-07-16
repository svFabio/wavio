// backend/src/config/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Configuración central de la aplicación.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Límite máximo de bots de WhatsApp activos simultáneamente.
 * ⚠️  Para habilitar más bots, cambia este número y reinicia el servidor.
 */
export const MAX_BOTS_ACTIVOS = 2;

export const JWT_EXPIRES_IN = '7d';

export const BCRYPT_SALT_ROUNDS = 10;

/** Días hacia atrás para buscar citas en la agenda por defecto */
export const AGENDA_LOOKBACK_DAYS = 60;

/** Días hacia adelante para buscar citas en la agenda por defecto */
export const AGENDA_LOOKAHEAD_DAYS = 30;
