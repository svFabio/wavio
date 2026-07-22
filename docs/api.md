# Wavio API Reference

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All endpoints except `/auth/login` and `/auth/google` require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/google` | Login with Google OAuth |
| GET | `/auth/profile` | Get current user profile |

### Negocios

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/negocios` | List user's businesses |
| POST | `/negocios` | Create new business |
| GET | `/negocios/:id` | Get business details |
| PUT | `/negocios/:id` | Update business |

### Servicios

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/servicios` | List services for business |
| POST | `/servicios` | Create new service |
| PUT | `/servicios/:id` | Update service |
| DELETE | `/servicios/:id` | Delete service |
| GET | `/servicios/categorias` | List service categories |
| GET | `/servicios/categoria/:categoria` | List services by category |

### Citas

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/citas` | List appointments |
| GET | `/citas/:id` | Get appointment details |
| POST | `/citas` | Create new appointment |
| PUT | `/citas/:id` | Update appointment |
| DELETE | `/citas/:id` | Cancel appointment |
| POST | `/citas/:id/confirm` | Confirm appointment |
| POST | `/citas/:id/no-show` | Mark as no-show |
| POST | `/citas/recurrente` | Create recurring appointment |
| DELETE | `/citas/serie/:recurrenceId` | Cancel recurring series |
| GET | `/citas/serie/:recurrenceId` | Get recurring series |

### Horarios

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/horarios` | Get business hours |
| PUT | `/horarios` | Update business hours |
| GET | `/horarios/especiales` | List special hours |
| POST | `/horarios/especiales` | Add special hours |
| DELETE | `/horarios/especiales/:id` | Remove special hours |
| GET | `/horarios/staff/:userId` | Get staff schedule |
| PUT | `/horarios/staff/:userId` | Update staff schedule |
| GET | `/horarios/staff/negocio/:negocioId` | List staff schedules for business |

### Clientes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/clientes` | List clients |
| GET | `/clientes/:id` | Get client details |
| POST | `/clientes` | Create client |
| PUT | `/clientes/:id` | Update client |
| DELETE | `/clientes/:id` | Delete client |
| GET | `/clientes/:id/no-shows` | Get client no-show count |

### Lista de Espera

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/waitlist` | List waitlist entries |
| POST | `/waitlist` | Add to waitlist |
| DELETE | `/waitlist/:id` | Remove from waitlist |
| POST | `/waitlist/:id/notify` | Notify waitlisted client |

### Reportes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reportes/citas/csv` | Export appointments as CSV |
| GET | `/reportes/resumen/:year/:month` | Get monthly summary |

### Configuración

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/configuracion` | Get business configuration |
| PUT | `/configuracion` | Update configuration |

### WhatsApp (Webhooks)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/webhooks/whatsapp` | Verify webhook |
| POST | `/webhooks/whatsapp` | Receive webhook events |

### Google Calendar

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendar/auth` | Get Google Calendar auth URL |
| GET | `/calendar/callback` | Handle OAuth callback |
| POST | `/calendar/sync` | Sync appointment to calendar |
| DELETE | `/calendar/sync/:citaId` | Remove from calendar |

### Chat (AI Assistant)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/message` | Send message to AI assistant |
| GET | `/chat/history/:sessionId` | Get chat history |

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `CONFLICT` | Resource already exists |
| `RATE_LIMITED` | Too many requests |

## Rate Limiting

API endpoints are rate-limited:
- 100 requests per minute per IP
- 10 requests per minute for AI chat endpoints

## Pagination

List endpoints support pagination:

```
GET /citas?page=1&limit=20
```

Response includes:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
