# Wavio

AI-powered appointment management platform for service businesses. Manage clients, appointments, and WhatsApp communications with an AI assistant that handles natural-language scheduling.

<table>
  <tr>
    <td>
      <img src="https://github.com/user-attachments/assets/de39a9ba-4caa-4698-a7b9-5672ed335e2a" width="100%">
    </td>
    <td>
      <img src="https://github.com/user-attachments/assets/03dc4005-fb6c-4da0-8ea3-4e87d438462a" width="100%">
    </td>
  </tr>
</table>

<table>
  <tr>
    <td>
      <img width="1920" height="896" alt="image" src="https://github.com/user-attachments/assets/6e4dde80-9b83-4597-a0e5-9feb8dfb5f88" />
    </td>
    <td>
      <img width="1920" height="896" alt="image" src="https://github.com/user-attachments/assets/0a7eb6cf-ad66-4203-8ba7-80737d76cac5" />
    </td>
  </tr>
</table>

## Tech Stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Backend   | NestJS, TypeScript, Prisma, Socket.IO, PostgreSQL |
| Frontend  | React 19, Vite, TypeScript, TailwindCSS           |
| AI        | Google Gemini (natural-language scheduling)       |
| Messaging | WhatsApp Cloud API                                |
| Payments  | Stripe                                            |

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 15+
- pnpm

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment setup

```bash
cp ai-appointment-platform-backend/.env.example ai-appointment-platform-backend/.env
# Edit .env with your database URL, JWT secret, API keys
```

### 3. Database

```bash
cd ai-appointment-platform-backend
pnpm prisma migrate dev
pnpm prisma db seed
```

### 4. Run development servers

```bash
# Terminal 1 — Backend
cd ai-appointment-platform-backend
pnpm dev

# Terminal 2 — Frontend
cd ai-appointment-platform-frontend
pnpm dev
```

Backend runs on `http://localhost:3000`, frontend on `http://localhost:5173`.

## Project Structure

```
wavio/
├── ai-appointment-platform-backend/     # NestJS API
│   └── src/
│       ├── <module>/                    # One folder per NestJS module
│       ├── repositories/                # Data access (Prisma)
│       ├── domain/                      # Entities, value types, errors
│       ├── lib/                         # External clients (Gemini, WhatsApp, Cloudinary)
│       ├── config/                      # Env parsing, constants
│       ├── prisma/                      # PrismaModule + PrismaService
│       └── common/                      # Guards, decorators, pipes
├── ai-appointment-platform-frontend/    # React SPA
│   └── src/
│       ├── features/                    # Domain slices (auth, calendario, chat, etc.)
│       ├── shared/                      # Reusable components and hooks
│       ├── lib/                         # Singletons (apiClient, auth, socket)
│       └── pages/                       # Route-level composition
└── docs/                                # Architecture, decisions, API docs
```

## Scripts

### Backend

```bash
pnpm dev          # Start with hot-reload
pnpm build        # Production build
pnpm test         # Run unit tests
pnpm typecheck    # Type checking
pnpm lint         # ESLint
```

### Frontend

```bash
pnpm dev          # Start Vite dev server
pnpm build        # Production build
pnpm test         # Run unit tests
pnpm typecheck    # Type checking
pnpm lint         # ESLint
```

## Testing

```bash
# Backend
cd ai-appointment-platform-backend && pnpm test

# Frontend
cd ai-appointment-platform-frontend && pnpm test
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for full architecture details.

## Contributing

See [AGENTS.md](AGENTS.md) for the agent contract and coding standards.
