# Wavio — Developer Onboarding

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL (local or Docker)
- A `.env` file in each app directory (see `.env.example`)

## Quick Start

```bash
# 1. Clone and navigate
git clone <repo-url>
cd 01-wavio

# 2. Backend setup
cd ai-appointment-platform-backend
pnpm install
cp .env.example .env          # fill in required values
pnpm prisma migrate dev       # run migrations
pnpm dev                      # starts on port 3000

# 3. Frontend setup (new terminal)
cd ai-appointment-platform-frontend
pnpm install
cp .env.example .env          # fill in VITE_* vars
pnpm dev                      # starts on port 5173
```

## Environment Variables

### Backend (required)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `GEMINI_API_KEY` | Google Gemini API key |
| `META_WHATSAPP_TOKEN` | WhatsApp Cloud API token |
| `META_PHONE_NUMBER_ID` | WhatsApp sender phone number ID |
| `CLOUDINARY_*` | Cloudinary upload credentials |

### Frontend (required)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL |
| `VITE_SOCKET_URL` | Socket.IO server URL |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |

## Project Structure

Read [`architecture.md`](./architecture.md) for the full layer map.
Read [`AGENTS.md`](../AGENTS.md) for code conventions and rules before writing any code.

## Running Tests

```bash
# Backend
cd ai-appointment-platform-backend
pnpm test

# Frontend
cd ai-appointment-platform-frontend
pnpm test
```

## Making Changes

1. Identify the layer your change belongs to (see `architecture.md`).
2. Follow the naming convention in `AGENTS.md`.
3. If adding a new architectural pattern, document it in `decisions.md` first.
4. Commits follow Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`.
