# syntax=docker/dockerfile:1

# Base stage - Install dependencies
FROM oven/bun:1.2.23-alpine AS deps
WORKDIR /app

# Copy root package files
COPY package.json bun.lockb ./
COPY turbo.json ./

# Copy workspace package files
COPY apps/web/package.json ./apps/web/
COPY packages/api/package.json ./packages/api/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN bun install --frozen-lockfile

# Builder stage - Build the application
FROM oven/bun:1.2.23-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Generate Drizzle types
RUN bun run db:generate

# Build the Next.js app
RUN bun run build

# Production stage - Run the application
FROM oven/bun:1.2.23-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./apps/web/package.json

# Copy workspace packages
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules

# Create database directory
RUN mkdir -p /app/apps/web && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3001

# Start the Next.js application
CMD ["bun", "run", "dev:web"]
