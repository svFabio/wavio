# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /usr/src/app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@11 --activate

# Copy config files first (layer cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY . .

# Compile TypeScript
RUN pnpm run build

# Prune devDependencies
RUN pnpm prune --prod

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:22-slim AS production

# Baileys needs openssl for crypto operations
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1001 wavio && \
    useradd --uid 1001 --gid wavio --shell /bin/sh --create-home wavio

WORKDIR /usr/src/app

# Copy built artifacts and production dependencies
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/prisma ./prisma

# Set ownership
RUN chown -R wavio:wavio /usr/src/app

USER wavio

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/server.js"]
