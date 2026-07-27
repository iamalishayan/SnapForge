# syntax=docker/dockerfile:1.4
# Minimal multi-stage Dockerfile for the worker process

# Stage 1: Dependencies
FROM node:22-alpine AS builder

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy root workspace configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc ./

# Copy all packages to install dependencies correctly
COPY packages/ ./packages/

# Install dependencies (ignoring scripts to prevent unrs-resolver error)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm and tsx globally or just use local
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Create a non-root user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy installed dependencies and packages from builder
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages

USER nodejs

# Healthcheck to verify the container is alive
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD ["node", "-e", "console.log('Healthcheck OK')"] || exit 1

WORKDIR /app/packages/queue

# Run the worker process using tsx (already available via pnpm)
CMD ["pnpm", "exec", "tsx", "src/start-worker.ts"]
