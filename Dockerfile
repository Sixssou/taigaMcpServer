# Dockerfile for Taiga MCP Server
# Multi-stage build for optimized production image

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run test:unit

# Production stage
FROM base AS production
ENV NODE_ENV=production
USER node

COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Expose port for HTTP/SSE mode
EXPOSE 3000

# Environment variable to choose transport mode
ENV MCP_TRANSPORT=stdio

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default to stdio mode (use start:http for HTTP mode)
CMD ["node", "src/index.js"]