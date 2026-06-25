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

# Only production dependencies are needed to run the compiled server.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy the build artifacts and the files the server reads at runtime.
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/dist_server ./dist_server
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Run as the unprivileged user that ships with the node image.
USER node

EXPOSE 3000
CMD ["node", "dist_server/server.js"]
