# ==============================================================================
# TIGER WORKSPACE CRM: PRODUCTION MULTI-STAGE DOCKERFILE
# Security Hardened: Non-Root Execution, npm ci Lockfile Enforcement, Minimal Attack Surface
# ==============================================================================

# STAGE 1: Build Frontend and Backend Assets
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package descriptors for deterministic lockfile resolution
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Deterministic install using npm ci (NEVER npm install in production/CI)
RUN npm ci --prefix client
RUN npm ci --prefix server

# Copy source trees
COPY client ./client
COPY server ./server

# Build production bundles
RUN npm run build --prefix client
RUN npm run build --prefix server

# STAGE 2: Minimal Secure Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install minimal production system tools & curl for healthcheck
RUN apk add --no-cache libc6-compat curl dumb-init

# Copy server package descriptors and install production-only dependencies strictly with npm ci
COPY server/package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy compiled backend dist and prisma artifacts
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/client/dist ./public

# Run Prisma generate for production runtime client
RUN npx prisma generate

# Create non-root unprivileged app user
USER node:node

EXPOSE 5000

# Health check probe against local health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.js"]
