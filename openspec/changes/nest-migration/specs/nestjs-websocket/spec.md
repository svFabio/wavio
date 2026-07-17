# nestjs-websocket Specification

## Purpose

WebSocket real-time communication via NestJS `@WebSocketGateway`, replacing the Express/Socket.IO singleton pattern. Handles appointment updates, chat messages, and conversation events with JWT authentication.

## Phase 3 Requirements

### Requirement: EventsGateway

The system SHALL provide an `EventsGateway` decorated with `@WebSocketGateway` using `@nestjs/platform-socket.io`. The gateway SHALL authenticate connections via JWT in the handshake (query or auth header). Authenticated clients SHALL be assigned to rooms by `negocioId`. The gateway SHALL expose an `afterInit` hook for server setup and `handleConnection`/`handleDisconnect` for lifecycle management.

#### Scenario: Authenticated client connects

- GIVEN a client connects with a valid JWT
- WHEN the gateway handles the connection
- THEN the client joins a room named after their `negocioId`
- AND the connection is tracked

#### Scenario: Unauthenticated client rejected

- GIVEN a client connects without a JWT
- WHEN the gateway handles the connection
- THEN the connection is closed with an auth error

### Requirement: EventsService

The system SHALL provide an `EventsService` injectable that wraps the gateway's `server` emit methods. It SHALL expose: `emitCambioCitas(negocioId, data)`, `emitNuevaCita(negocioId, data)`, `emitNuevoMensaje(negocioId, data)`, `emitConversacionEliminada(negocioId, data)`. Services SHALL inject `EventsService` instead of importing a singleton.

#### Scenario: Appointment change emitted

- GIVEN an appointment is updated for `negocioId: 42`
- WHEN `EventsService.emitCambioCitas(42, data)` is called
- THEN all clients in room `42` receive the `cambio_citas` event
- AND clients in other rooms do NOT receive it

#### Scenario: New message emitted

- GIVEN a new chat message arrives for `negocioId: 42`
- WHEN `EventsService.emitNuevoMensaje(42, data)` is called
- THEN all clients in room `42` receive the `nuevo_mensaje` event

### Requirement: ChatModule Integration

The system SHALL provide a `ChatModule` that integrates with `EventsService` to emit real-time chat events. The module SHALL include `ChatService` and `AiService` as injectable providers. Chat message creation SHALL trigger `emitNuevoMensaje` automatically.

#### Scenario: Chat message triggers real-time event

- GIVEN a user sends a chat message via REST API
- WHEN the message is persisted
- THEN `EventsService.emitNuevoMensaje` is called with the correct negocioId
- AND connected clients receive the event in real time

## What Changes vs What Stays

| Changes | Stays |
|---------|-------|
| `lib/socket.ts` singleton → `EventsGateway` class | All 3 emission trigger points in services (logic unchanged) |
| `getSocket().to(room).emit()` → `EventsService.emitXxx()` | Socket.IO protocol and event names |
| Manual room join/leave → Gateway `handleConnection`/`handleDisconnect` | Frontend Socket.IO client (no changes) |
| JWT check in socket middleware → Gateway handshake auth | Event payload shapes |

## Risk Areas

| Risk | Mitigation |
|------|------------|
| Socket.IO singleton removal breaks emit calls | Grep for `getSocket` and `socket.emit` — replace all with `EventsService` injection |
| Gateway JWT auth differs from HTTP JWT auth | Reuse same JWT verification logic; test with real Socket.IO client |
| Room assignment race condition on reconnect | Gateway `handleDisconnect` removes from room; `handleConnection` re-adds |
| Only 3 emit sites — low blast radius | Verify each emit site with integration test |
