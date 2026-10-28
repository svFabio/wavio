# Auditoría Exhaustiva de Producción — Wavio

> [!IMPORTANT]
> **Dictamen del Arquitecto**: El sistema **NO está listo para producción**. Existen fallos críticos de seguridad en el modelo de tokens, carreras y omisión de datos en el bot de IA, desincronización de zonas horarias en citas, y un Dockerfile que fallará al arrancar en cualquier base de datos limpia (_crash loop_ por migraciones de Prisma).

---

## 1. Bloqueadores Críticos de Infraestructura y Base de Datos (P0)

### 1.1 `Dockerfile` con Crash Loop en Bases de Datos Limpias (Error P3009)

- **Archivo**: [`ai-appointment-platform-backend/Dockerfile`](../ai-appointment-platform-backend/Dockerfile#L62)
- **Línea**: 62: `CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]`
- **Defecto**: La migración inicial `20250714000000_add_scheduling_tables` ejecuta instrucciones `ALTER TABLE "Cita"` asumiendo que tablas baseline ya existían (creadas previamente con `db push`, según documenta el propio [ADR-013](./decisions.md#L347)).
- **Impacto en Producción**: Si se despliega en una base de datos nueva (Render, AWS RDS, o disaster recovery), `prisma migrate deploy` falla inmediatamente con error `P3009`, impidiendo que el contenedor inicie y provocando un reinicio continuo (_CrashLoopBackOff_).
- **Solución**: Generar una migración baseline consolidada con `prisma migrate diff` o sincronizar el historial de migraciones antes de producción.

### 1.2 Recursión Infinita en Scripts del Monorepo

- **Archivo**: [`package.json`](../package.json#L10)
- **Defecto**: El script raíz define `"typecheck": "pnpm -r run typecheck"`. Sin exclusión de la raíz (`pnpm-workspace.yaml`), invocar este comando hace que la raíz se ejecute a sí misma recursivamente, provocando explosión de procesos `tsc` y agotamiento de CPU/RAM.
- **Solución**: Definir filtros explícitos: `"typecheck": "pnpm --filter \"./ai-appointment-platform-*\" run typecheck"`.

---

## 2. Vulnerabilidades de Seguridad y Autorización (P0)

### 2.1 Tokens JWT de 30 Días sin Revocación ni Verificación en Base de Datos

- **Archivos**:
  - [`ai-appointment-platform-backend/src/config/index.ts`](../ai-appointment-platform-backend/src/config/index.ts#L12) (`JWT_EXPIRES_IN = '30d'`)
  - [`ai-appointment-platform-backend/src/auth/strategies/jwt.strategy.ts`](../ai-appointment-platform-backend/src/auth/strategies/jwt.strategy.ts#L19-L34)
  - [`ai-appointment-platform-backend/src/common/guards/tenant.guard.ts`](../ai-appointment-platform-backend/src/common/guards/tenant.guard.ts#L32-L41)
- **Defecto**:
  1. Los tokens de autenticación tienen una vigencia de 30 días sin mecanismo de _refresh token_ ni _token blacklist_.
  2. [`JwtStrategy`](../ai-appointment-platform-backend/src/auth/strategies/jwt.strategy.ts#L19-L34) **no consulta la base de datos**. Solo desempaqueta el contenido del payload.
  3. [`TenantGuard`](../ai-appointment-platform-backend/src/common/guards/tenant.guard.ts#L32-L41) toma la lista de negocios y el rol directamente de `user.negocios` incrustado en el token hace semanas.
- **Impacto**: Si un administrador despide a un empleado o revoca su acceso en `UsuarioNegocio`, o si un usuario es eliminado de la base de datos, **el token sigue siendo 100% válido por hasta 30 días**, manteniendo acceso de lectura y escritura con permisos de ADMIN.
- **Solución**: Reducir el TTL de los access tokens a 15-60 minutos, implementar refresh tokens o validar la membresía activa contra Redis / base de datos en [`TenantGuard`](../ai-appointment-platform-backend/src/common/guards/tenant.guard.ts).

---

## 3. Lógica de Negocio y Motor de Citas (P0 / P1)

### 3.1 Desincronización Crítica de Zonas Horarias (Timezone Skew)

- **Archivos**:
  - [`ai-appointment-platform-backend/src/scheduling/availability-engine.ts`](../ai-appointment-platform-backend/src/scheduling/availability-engine.ts#L22)
  - [`ai-appointment-platform-backend/src/citas/citas.service.ts`](../ai-appointment-platform-backend/src/citas/citas.service.ts#L198)
  - [`ai-appointment-platform-backend/src/domain/cita-time.ts`](../ai-appointment-platform-backend/src/domain/cita-time.ts#L21-L23)
  - [`ai-appointment-platform-backend/src/scheduling/reminder.service.ts`](../ai-appointment-platform-backend/src/scheduling/reminder.service.ts#L30-L38)
- **Defecto**:
  1. [`citas.service.ts`](../ai-appointment-platform-backend/src/citas/citas.service.ts#L198) llama a [`getSlotsDisponibles`](../ai-appointment-platform-backend/src/scheduling/availability-engine.ts#L22) sin pasarle la zona horaria del negocio; el motor siempre cae en el valor por defecto `'America/La_Paz'`, ignorando si el negocio está en Argentina (`America/Argentina/Buenos_Aires`), México o España.
  2. En [`crearCitaAdmin`](../ai-appointment-platform-backend/src/citas/citas.service.ts#L243-L260), se construye `fechaCita` usando `new Date(year, month - 1, day)` y `fechaCita.setHours(horas, minutos)`, lo cual usa la zona horaria local del servidor Node. En contenedores Docker (donde `TZ=UTC`), una cita para las 10:00 se almacena como 10:00 UTC, lo que equivale a las 06:00 o 07:00 en horario local del cliente.
  3. Los recordatorios en [`ReminderService`](../ai-appointment-platform-backend/src/scheduling/reminder.service.ts) y [`buildCitaDateTime`](../ai-appointment-platform-backend/src/domain/cita-time.ts#L21-L23) comparan fechas usando la hora del servidor en lugar de la zona del negocio, enviando recordatorios con 4-5 horas de desfase.
- **Solución**: Usar `date-fns-tz` o `luxon` con la zona horaria de `Negocio.timezone` para componer y parsear cualquier timestamp.

### 3.2 El Bot de WhatsApp Agenda Citas con Monto 0 y Omite el Servicio

- **Archivos**:
  - [`ai-appointment-platform-backend/src/webhooks/webhook.service.ts`](../ai-appointment-platform-backend/src/webhooks/webhook.service.ts#L232-L241)
  - [`ai-appointment-platform-backend/src/chat/ai-engine.ts`](../ai-appointment-platform-backend/src/chat/ai-engine.ts#L10)
- **Defecto**:
  1. Cuando Gemini ejecuta la herramienta `agendar_cita` en [`webhook.service.ts`](../ai-appointment-platform-backend/src/webhooks/webhook.service.ts#L232-L241), invoca `crearCitaAdmin` **sin pasar `servicioId`** y con `monto: 0`.
  2. Al no recibir `servicioId`, [`crearCitaAdmin`](../ai-appointment-platform-backend/src/citas/citas.service.ts#L245-L257) salta la validación de disponibilidad del slot (`if (servicioId)`), no calcula el precio y guarda la cita con `servicioId = null` y duración por defecto de 60 min.
  3. En [`ai-engine.ts`](../ai-appointment-platform-backend/src/chat/ai-engine.ts#L10), el modelo está fijado como `'gemini-2.5-flash'`, que **no existe** en la API de Google (los nombres válidos son `gemini-1.5-flash` o `gemini-2.0-flash`). En producción, cualquier llamada a la IA arrojará HTTP 404 de Google.

### 3.3 Sincronización con Google Calendar Fantasma (Nunca se Ejecuta Automáticamente)

- **Archivos**:
  - [`ai-appointment-platform-backend/src/calendar/google-calendar.service.ts`](../ai-appointment-platform-backend/src/calendar/google-calendar.service.ts#L55)
  - [`ai-appointment-platform-backend/src/citas/citas.service.ts`](../ai-appointment-platform-backend/src/citas/citas.service.ts#L44)
- **Defecto**:
  1. `createEvent` **nunca es invocado** al crear una cita (`crearCitaAdmin`), ni al validar/aprobar un pago (`validarCita`), ni al agendar por el portal o WhatsApp.
  2. Solo está expuesto en un endpoint aislado (`POST /api/v1/calendar/events/:citaId`), pero el frontend **no tiene ningún botón ni llamada a ese endpoint**.
  3. En consecuencia, la integración con Google Calendar está 100% inoperativa en el flujo de negocio: ninguna cita llega jamás al calendario de Google.
  4. Encima, hardcodea `'America/Mexico_City'` como `timeZone`, y no escucha eventos de refresco de token para persistir el nuevo `access_token` en base de datos.

### 3.4 Flujo de Lista de Espera Incompleto y Desconectado del Bot

- **Archivos**:
  - [`ai-appointment-platform-backend/src/waitlist/waitlist.service.ts`](../ai-appointment-platform-backend/src/waitlist/waitlist.service.ts#L52-L56)
  - [`ai-appointment-platform-backend/src/webhooks/webhook.service.ts`](../ai-appointment-platform-backend/src/webhooks/webhook.service.ts)
  - [`ai-appointment-platform-backend/src/citas/citas.service.ts`](../ai-appointment-platform-backend/src/citas/citas.service.ts#L341)
- **Defecto**:
  1. Al notificar un cupo libre, el mensaje dice _"¿Deseas agendar tu cita? Responde SÍ para confirmar"_. Sin embargo, [`WebhookService`](../ai-appointment-platform-backend/src/webhooks/webhook.service.ts) no tiene lógica para capturar esa confirmación: el mensaje "SÍ" va en crudo a Gemini sin contexto de la cita liberada, y la entrada en lista de espera jamás se transforma en una cita confirmada.
  2. Cuando una cita se cancela en [`cambiarEstado`](../ai-appointment-platform-backend/src/citas/citas.service.ts#L341), nunca se dispara [`notifyAvailableSlot`](../ai-appointment-platform-backend/src/waitlist/waitlist.service.ts#L39); la notificación solo existe por endpoint manual.

### 3.5 Web Push Notifications Fantasma (Código Incompleto)

- **Archivos**:
  - [`ai-appointment-platform-backend/src/push/push.service.ts`](../ai-appointment-platform-backend/src/push/push.service.ts)
  - [`ai-appointment-platform-backend/src/repositories/push.repository.ts`](../ai-appointment-platform-backend/src/repositories/push.repository.ts)
- **Defecto**: El backend permite registrar suscripciones push (`POST /push/subscribe`) y guarda las claves en `PushSubscription`, pero **no existe ni una sola llamada a `webPush.sendNotification` en todo el proyecto**. Se prometen notificaciones push en el navegador pero el sistema jamás despacha ninguna.

### 3.6 URLs de Invitación Apuntan a un 404 del Backend

- **Archivos**:
  - [`ai-appointment-platform-backend/src/invitaciones/invitaciones.service.ts`](../ai-appointment-platform-backend/src/invitaciones/invitaciones.service.ts#L41)
  - [`ai-appointment-platform-backend/src/invitaciones/invitaciones.controller.ts`](../ai-appointment-platform-backend/src/invitaciones/invitaciones.controller.ts#L50)
  - [`ai-appointment-platform-frontend/src/App.tsx`](../ai-appointment-platform-frontend/src/App.tsx#L196)
- **Defecto**: `buildAcceptUrl` genera `${env.BACKEND_URL}/api/v1/invitaciones/aceptar/${rawToken}`. El backend no tiene ningún `GET` en esa ruta (solo un `POST /api/v1/invitaciones/aceptar`), por lo que al hacer clic desde el email se recibe un error HTTP 404. La URL correcta debe apuntar al frontend (`/invitaciones/aceptar/:token`), donde está montada la vista [`InvitacionAceptar`](../ai-appointment-platform-frontend/src/pages/InvitacionAceptar.tsx).

---

## 4. Defectos de Código y Anti-Patrones en Backend (P1)

### 4.1 Interceptor de Paginación Desconectado (Código Muerto que Afecta la API)

- **Archivos**:
  - [`ai-appointment-platform-backend/src/common/interceptors/pagination.interceptor.ts`](../ai-appointment-platform-backend/src/common/interceptors/pagination.interceptor.ts#L16)
  - [`ai-appointment-platform-backend/src/usuarios/usuarios.controller.ts`](../ai-appointment-platform-backend/src/usuarios/usuarios.controller.ts#L38)
  - [`ai-appointment-platform-backend/src/clientes/clientes.controller.ts`](../ai-appointment-platform-backend/src/clientes/clientes.controller.ts#L30)
- **Defecto**: Los controladores asumen que `req.pagination` existe: `(req as any).pagination?.page ?? 1`. Sin embargo, [`PaginationInterceptor`](../ai-appointment-platform-backend/src/common/interceptors/pagination.interceptor.ts#L16) **nunca fue registrado** ni en `app.module.ts`, ni en `main.ts`, ni en los controladores.
- **Impacto**: La paginación en la API está completamente rota: si el cliente envía `?page=2&limit=50`, `req.pagination` siempre es `undefined` y el backend siempre devuelve la página 1 con 20 elementos.

### 4.2 Métricas Mensuales con Desfase por Uso de Hora Local del Servidor

- **Archivo**: [`ai-appointment-platform-backend/src/statistics/statistics.service.ts`](../ai-appointment-platform-backend/src/statistics/statistics.service.ts#L57-L59)
- **Defecto**: `startOfMonth` y `endOfMonth` se calculan con `new Date(now.getFullYear(), now.getMonth(), 1)` (hora local del servidor de Node). Si el servidor corre en UTC (Render/Docker) y el negocio en América Latina (UTC-3 a UTC-5), las citas ocurridas en las últimas horas del mes anterior se cuentan erróneamente en el mes en curso.

### 4.3 Cero Normalización en Teléfonos de Clientes

- **Archivos**:
  - [`ai-appointment-platform-backend/src/clientes/dto/clientes.dto.ts`](../ai-appointment-platform-backend/src/clientes/dto/clientes.dto.ts#L5)
  - [`ai-appointment-platform-backend/src/clientes/clientes.service.ts`](../ai-appointment-platform-backend/src/clientes/clientes.service.ts#L30)
- **Defecto**: No hay sanitización ni formateo E.164. Si se da de alta un cliente con `+54 9 11 ...` y luego interactúa por WhatsApp con `54911...`, [`findByTelefono`](../ai-appointment-platform-backend/src/clientes/clientes.service.ts#L30) no coincide, creando registros duplicados y perdiendo el historial de citas y no-shows.

### 4.4 Registro Redundante del Filtro Global de Excepciones

- **Archivos**:
  - [`ai-appointment-platform-backend/src/app.module.ts`](../ai-appointment-platform-backend/src/app.module.ts#L60)
  - [`ai-appointment-platform-backend/src/main.ts`](../ai-appointment-platform-backend/src/main.ts#L54)
- **Defecto**: [`AllExceptionsFilter`](../ai-appointment-platform-backend/src/common/filters/all-exceptions.filter.ts) está registrado dos veces: como provider `APP_FILTER` en `AppModule` y con `app.useGlobalFilters(...)` en `main.ts`.

---

## 5. Defectos de Código y Anti-Patrones en Frontend (P1)

### 5.1 Pantalla en Blanco por Acceso Inseguro a `localStorage` y Fallo del `ErrorBoundary`

- **Archivos**:
  - [`ai-appointment-platform-frontend/src/lib/auth.ts`](../ai-appointment-platform-frontend/src/lib/auth.ts#L7)
  - [`ai-appointment-platform-frontend/src/shared/components/ErrorBoundary.tsx`](../ai-appointment-platform-frontend/src/shared/components/ErrorBoundary.tsx#L32)
- **Defecto**:
  1. [`auth.ts`](../ai-appointment-platform-frontend/src/lib/auth.ts#L7) accede directamente a `localStorage.getItem` sin verificar si `window.localStorage` está disponible o si arroja una excepción de seguridad (común en modo incógnito, iframes o navegadores con políticas estrictas de privacidad).
  2. [`ErrorBoundary.componentDidCatch`](../ai-appointment-platform-frontend/src/shared/components/ErrorBoundary.tsx#L32) llama a `auth.getToken()` para registrar el error. Si el error inicial fue por almacenamiento, el propio ErrorBoundary arroja una excepción no capturada, provocando un _White Screen of Death_.

### 5.2 Bucle de Re-renders en `AuthContext`

- **Archivo**: [`ai-appointment-platform-frontend/src/context/AuthContext.tsx`](../ai-appointment-platform-frontend/src/context/AuthContext.tsx#L76-L90)
- **Defecto**: `const negocios = isError ? [] : data?.negocios || [];` crea una nueva referencia de array en cada ciclo de render. Este array es pasado como dependencia a `useEffect(..., [negocios, localActiveId])`, forzando ejecuciones redundantes del efecto y actualizaciones de estado consecutivas.
- **Solución**: Envolver la inicialización de `negocios` en un `useMemo` o comparar por identidad de datos.

### 5.3 Mutaciones del Portal sin Invalidación de Caché (React Query)

- **Archivo**: [`ai-appointment-platform-frontend/src/features/portal/api/usePortal.ts`](../ai-appointment-platform-frontend/src/features/portal/api/usePortal.ts#L42-L45)
- **Defecto**: [`useBookAppointmentMutation`](../ai-appointment-platform-frontend/src/features/portal/api/usePortal.ts#L42-L45) no implementa `onSuccess`. Al agendar una cita desde el portal del cliente, las queries `['portal', 'appointments']` y `['portal', 'slots']` quedan obsoletas; el usuario no ve su nueva cita hasta refrescar manualmente el navegador y el horario agendado sigue apareciendo como libre.

### 5.4 Código Muerto: Generación de Link Mágico sin UI

- **Archivo**: [`ai-appointment-platform-frontend/src/features/portal/components/GenerateLinkButton.tsx`](../ai-appointment-platform-frontend/src/features/portal/components/GenerateLinkButton.tsx#L9)
- **Defecto**: [`GenerateLinkButton`](../ai-appointment-platform-frontend/src/features/portal/components/GenerateLinkButton.tsx#L9) no está montado en ninguna pantalla (clientes, citas o configuración). No existe interfaz gráfica para que el dueño del negocio genere un link mágico para sus clientes.

### 5.5 Estado Zombie en `useNotifications`

- **Archivo**: [`ai-appointment-platform-frontend/src/shared/hooks/useNotifications.ts`](../ai-appointment-platform-frontend/src/shared/hooks/useNotifications.ts#L38)
- **Defecto**: Almacena y sincroniza notificaciones en `localStorage`, pero ningún componente de la aplicación las lee ni las renderiza (la retroalimentación al usuario se realiza a través de `sonner`).

---

## 6. Resumen de Hallazgos por Severidad

| Severidad        | Área                 | Hallazgo                                                                                 |
| ---------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| **P0 (Crítico)** | Infraestructura      | `Dockerfile` falla en bases limpias por migración baseline rota (`P3009`).               |
| **P0 (Crítico)** | Seguridad            | JWT de 30 días sin revocación; guards no verifican pertenencia ni rol en BD.             |
| **P0 (Crítico)** | Negocio              | Desincronización de zona horaria (`UTC` vs `Negocio.timezone`) en citas y recordatorios. |
| **P0 (Crítico)** | Integración IA       | Modelo Gemini inexistente (`gemini-2.5-flash`); `agendar_cita` omite servicio y precio.  |
| **P1 (Alto)**    | Integración Calendar | `createEvent` nunca se llama automáticamente (solo endpoint manual sin UI).              |
| **P1 (Alto)**    | Flujo Waitlist       | Bot notifica liberar cupo pidiendo "SÍ" sin handler para convertir a cita.               |
| **P1 (Alto)**    | Push Notifications   | Backend permite suscribirse pero no existe llamada a `sendNotification`.                 |
| **P1 (Alto)**    | Invitaciones         | URL en email apunta a un 404 del backend en vez del formulario frontend.                 |
| **P1 (Alto)**    | API                  | `PaginationInterceptor` desconectado: paginación no funcional en usuarios y clientes.    |
| **P1 (Alto)**    | Clientes             | Teléfonos sin normalización E.164 provocan perfiles duplicados.                          |
| **P1 (Alto)**    | Frontend             | `localStorage` sin protección rompe el `ErrorBoundary` en entornos restringidos.         |
| **P1 (Alto)**    | Frontend             | `useBookAppointmentMutation` no invalida caché de citas ni horarios.                     |
| **P2 (Medio)**   | Monorepo             | Script `typecheck` del root produce recursión de procesos en pnpm.                       |
| **P2 (Medio)**   | Frontend             | Bucle de referencias en `AuthContext` y componentes huérfanos (`GenerateLinkButton`).    |
