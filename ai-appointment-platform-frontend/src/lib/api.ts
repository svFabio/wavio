/**
 * @file src/lib/api.ts
 * @description Backward-compatibility barrel that re-exports all feature API modules.
 *
 * New code should import directly from the feature API modules:
 *   import { authApi } from '../features/auth/api/auth.api';
 *   import { citasApi } from '../features/calendario/api/citas.api';
 *   etc.
 *
 * This barrel exists so existing consumers (`api.someMethod()`) continue working
 * without requiring a full import update sweep.
 */
import { authApi } from '../features/auth/api/auth.api';
import { citasApi } from '../features/calendario/api/citas.api';
import { chatApi } from '../features/chat/api/chat.api';
import { configuracionApi } from '../features/configuracion/api/configuracion.api';
import { statisticsApi } from '../features/statistics/api/statistics.api';
import { usersApi } from '../features/users/api/users.api';
import { waitlistApi } from '../features/waitlist/api/waitlist.api';
import { clientesApi } from '../features/statistics/api/clientes.api';
import { pushApi } from '../shared/api/push.api';
import { portalApi } from '../features/portal/api/portal.api';

export {
  authApi,
  citasApi,
  chatApi,
  configuracionApi,
  statisticsApi,
  usersApi,
  waitlistApi,
  clientesApi,
  pushApi,
  portalApi,
};

/**
 * Aggregate object for backward compatibility.
 * Prefer using named imports (authApi, citasApi, etc.) in new code.
 */
export const api = {
  // Auth
  ...authApi,
  // Citas
  ...citasApi,
  // Chat
  ...chatApi,
  // Configuración (WhatsApp, bot, servicios, horarios, negocio)
  ...configuracionApi,
  // Statistics
  ...statisticsApi,
  // Users
  ...usersApi,
  // Waitlist
  ...waitlistApi,
  // Clientes
  ...clientesApi,
  // Push notifications
  ...pushApi,
  // Portal (magic link)
  ...portalApi,
};
