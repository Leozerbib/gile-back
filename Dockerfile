# syntax=docker/dockerfile:1

# Builder stage: install deps and build all apps
FROM node:20-slim AS builder
WORKDIR /app

# Enable Corepack to use pnpm
RUN corepack enable

# Copy manifest files first for better layer caching
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

# Copy source
COPY apps ./apps
COPY libs ./libs
COPY prisma ./prisma

# Install all dependencies (including dev) and build
RUN pnpm install --frozen-lockfile
# Generate Prisma Client before TypeScript compilation
RUN pnpm exec prisma generate
# Build all applications using the consolidated build script
RUN pnpm run build


# Runtime stage: production deps only, prisma client generation, and run
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Enable pnpm and install curl for healthchecks
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy only what is needed at runtime
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Prisma schema and client generation
COPY prisma ./prisma
RUN pnpm exec prisma generate

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Copy proto assets to satisfy runtime join(process.cwd(), "libs/proto/...") lookups
COPY libs/proto ./libs/proto

# Expose common service ports (for clarity)
EXPOSE 3000 50051 50052 50053 50054 50055 50056

# Default command (overridden by Compose per service)
CMD ["node", "dist/main.js"]