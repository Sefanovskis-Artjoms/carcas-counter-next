# syntax=docker/dockerfile:1

# =============================================================================
# Carcas Counter — production image
# Custom Node server (server.ts) + Next.js 16 + Socket.IO.
# Build with `next build` and the TypeScript server build, then run the
# compiled server with `node dist_server/server.js`.
# =============================================================================

# ---- Stage 1: build -----------------------------------------------------------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install all dependencies (incl. devDependencies needed for the build).
COPY package.json package-lock.json ./
RUN npm ci

# Build the Next.js app (.next) and compile the server (dist_server).
COPY . .
RUN npm run build

# ---- Stage 2: runtime ---------------------------------------------------------
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Run everything as the unprivileged "node" user that ships with the image, and
# make sure it owns /app so the server can write its runtime cache (.next/cache)
# without permission errors.
RUN chown node:node /app
USER node

# Only production dependencies are needed to run the compiled server.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy the build artifacts and the files the server reads at runtime.
# next.config is plain JS so no TypeScript is needed at runtime.
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/dist_server ./dist_server
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/next.config.js ./next.config.js

EXPOSE 3000
CMD ["node", "dist_server/server.js"]
