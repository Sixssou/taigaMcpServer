# Dockerfile for Taiga REST API
# Multi-stage build for optimized production image

FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies for building
RUN apk add --no-cache dumb-init

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS build
WORKDIR /app

# Copy workspace configuration
COPY ../../package.json ../../package-lock.json ./
COPY ./packages/taiga-core ./packages/taiga-core
COPY ./packages/taiga-rest-api ./packages/taiga-rest-api

# Install all dependencies and build
WORKDIR /app
RUN npm ci

# Build both packages
WORKDIR /app/packages/taiga-core
RUN npm run build

WORKDIR /app/packages/taiga-rest-api
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
USER node

WORKDIR /app

# Copy built artifacts
COPY --chown=node:node --from=build /app/packages/taiga-core/dist ./packages/taiga-core/dist
COPY --chown=node:node --from=build /app/packages/taiga-core/package.json ./packages/taiga-core/
COPY --chown=node:node --from=build /app/packages/taiga-rest-api/dist ./packages/taiga-rest-api/dist
COPY --chown=node:node --from=build /app/packages/taiga-rest-api/package.json ./packages/taiga-rest-api/
COPY --chown=node:node --from=deps /app/node_modules ./node_modules

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose REST API port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "packages/taiga-rest-api/dist/server.js"]
